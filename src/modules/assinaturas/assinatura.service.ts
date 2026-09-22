import { prisma, withTenantTransaction } from "../../config/prisma.js";
import {
  calcularHashConteudo,
  construirPayloadAssinatura,
  assinarPayload,
  verificarPayload,
  decifrarChavePrivada,
  carregarChavePublica,
  gerarCodigoVerificacao,
  calcularHmacLegado,
  hmacsIguais,
} from "./assinatura.crypto.js";
import { obterOuCriarChaveActiva, obterChaveVigenteEm } from "./assinatura.chaves.service.js";
import { resolverConteudoAtual } from "./assinatura.content-resolver.js";
import { AssinaturaNaoEncontradaError, ConteudoNaoResolvivelError } from "./assinatura.errors.js";
import type { AssinarDocumentoInput } from "./assinatura.schema.js";
import { obterBrowser } from "./assinatura.pdf.browser.js";
import { construirHtmlDocumento } from "./assinatura.pdf.template.js";
import { gerarQrVerificacao } from "./qrcode.util.js";
import {
  REFERENCIA_ANEXO_SAIDA,
  construirPdfAssinadoDoAnexo,
  garantirPodeAssinarAnexoSaida,
  nomeFicheiroDoSnapshot,
  persistirCopiaAssinada,
  resolverConteudoAnexoSaida,
} from "./assinatura.anexo-saida.js";

/**
 * O documento de saída de um processo (PDF) é assinado pelo seu conteúdo exacto; os restantes tipos
 * continuam a usar o resolvedor de sempre.
 */
async function resolverConteudo(referenciaTipo: string, referenciaId: string, municipioId: string) {
  if (referenciaTipo === REFERENCIA_ANEXO_SAIDA) {
    return resolverConteudoAnexoSaida(referenciaId, municipioId);
  }
  return resolverConteudoAtual(referenciaTipo, referenciaId, municipioId);
}

async function obterOuCriarEmissaoAtual(params: {
  municipioId: string;
  referenciaTipo: string;
  referenciaId: string;
  conteudo: string;
}) {
  const hashAtual = calcularHashConteudo(params.conteudo);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const ultima = await tx.emissaoDocumento.findFirst({
      where: { referenciaTipo: params.referenciaTipo, referenciaId: params.referenciaId },
      orderBy: { versao: "desc" },
    });

    if (ultima && ultima.hashConteudo === hashAtual) return ultima;

    const novaVersao = (ultima?.versao ?? 0) + 1;
    const emissao = await tx.emissaoDocumento.create({
      data: {
        municipioId: params.municipioId,
        referenciaTipo: params.referenciaTipo,
        referenciaId: params.referenciaId,
        versao: novaVersao,
        conteudoSnapshot: params.conteudo,
        hashConteudo: hashAtual,
        codigoVerificacao: gerarCodigoVerificacao(hashAtual, `${params.referenciaId}:${novaVersao}`),
      },
    });

    if (ultima) {
      await tx.emissaoDocumento.update({ where: { id: ultima.id }, data: { substituidaPorId: emissao.id } });
    }

    return emissao;
  });
}

export async function assinarDocumento(params: {
  municipioId: string;
  signatarioId: string;
  ipOrigem?: string | undefined;
  dados: AssinarDocumentoInput;
}) {
  // `referenciaTipo` vem do schema (enum); comparamos como string para não depender de o enum já incluir ANEXO_SAIDA.
  const referenciaTipo: string = params.dados.referenciaTipo;

  // Quem assina o documento de saída tem de ter uma razão para isso neste processo.
  if (referenciaTipo === REFERENCIA_ANEXO_SAIDA) {
    await garantirPodeAssinarAnexoSaida({
      municipioId: params.municipioId,
      utilizadorId: params.signatarioId,
      anexoId: params.dados.referenciaId,
    });
  }

  const conteudo = await resolverConteudo(referenciaTipo, params.dados.referenciaId, params.municipioId);
  if (conteudo === null) {
    throw new ConteudoNaoResolvivelError("Não foi possível obter o conteúdo actual do documento.");
  }

  const emissao = await obterOuCriarEmissaoAtual({
    municipioId: params.municipioId,
    referenciaTipo: params.dados.referenciaTipo,
    referenciaId: params.dados.referenciaId,
    conteudo,
  });

  const chave = await obterOuCriarChaveActiva(params.municipioId, params.signatarioId);
  const chavePrivada = decifrarChavePrivada({ cifrado: chave.chavePrivadaCifrada, iv: chave.iv, authTag: chave.authTag });
  const criadoEm = new Date();

  const payload = construirPayloadAssinatura({
    referenciaTipo: params.dados.referenciaTipo,
    referenciaId: params.dados.referenciaId,
    emissaoId: emissao.id,
    versao: emissao.versao,
    hashConteudo: emissao.hashConteudo,
    signatarioId: params.signatarioId,
    criadoEm,
  });

  const assinaturaDigital = assinarPayload(payload, chavePrivada);

  const assinatura = await withTenantTransaction(params.municipioId, (tx) =>
    tx.assinaturaEletronica.create({
      data: {
        municipioId: params.municipioId,
        emissaoId: emissao.id,
        signatarioId: params.signatarioId,
        tipoAssinatura: params.dados.tipoAssinatura,
        algoritmo: "ED25519",
        assinaturaDigital,
        criadoEm,
        ...(params.ipOrigem !== undefined && { ipOrigem: params.ipOrigem }),
      },
      include: { emissao: true },
    })
  );

  // O documento de saída passa a sair com as assinaturas e o QR de verificação: gera-se a cópia
  // assinada a cada nova assinatura. Se falhar, a assinatura já está registada e a cópia pode ser
  // regenerada mais tarde (GET /assinaturas/ANEXO_SAIDA/:id/pdf).
  if (referenciaTipo === REFERENCIA_ANEXO_SAIDA) {
    try {
      await persistirCopiaAssinada({ municipioId: params.municipioId, anexoId: params.dados.referenciaId });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[assinaturas] Assinatura registada, mas não foi possível gerar a cópia assinada do PDF:", err);
    }
  }

  return assinatura;
}

export async function listarAssinaturas(params: { municipioId: string; referenciaTipo: string; referenciaId: string }) {
  return withTenantTransaction(params.municipioId, (tx) =>
    tx.emissaoDocumento.findMany({
      where: { referenciaTipo: params.referenciaTipo, referenciaId: params.referenciaId },
      orderBy: { versao: "asc" },
      include: { assinaturas: { orderBy: { criadoEm: "asc" } } },
    })
  );
}

async function resolverNomeSignatario(signatarioId: string, municipioId: string): Promise<string> {
  return withTenantTransaction(municipioId, async (tx) => {
    const utilizador = await tx.utilizador.findUnique({ where: { id: signatarioId } });
    return utilizador?.nomeCompleto ?? "Signatário desconhecido";
  });
}

async function verificarDocumentoPublico(params: { municipioId: string; referenciaTipo: string; referenciaId: string }) {
  const conteudoAtual = await resolverConteudo(params.referenciaTipo, params.referenciaId, params.municipioId);
  if (conteudoAtual === null) {
    throw new AssinaturaNaoEncontradaError("Documento não encontrado.");
  }

  const hashAtual = calcularHashConteudo(conteudoAtual);

  const ultimaEmissao = await withTenantTransaction(params.municipioId, (tx) =>
    tx.emissaoDocumento.findFirst({
      where: { referenciaTipo: params.referenciaTipo, referenciaId: params.referenciaId },
      orderBy: { versao: "desc" },
      include: { assinaturas: true },
    })
  );

  if (!ultimaEmissao) {
    throw new AssinaturaNaoEncontradaError("Documento sem assinaturas registadas.");
  }

  const conteudoAlterado = ultimaEmissao.hashConteudo !== hashAtual;

  const assinaturasVerificadas = await Promise.all(
    ultimaEmissao.assinaturas.map(async (a) => {
      const signatarioNome = await resolverNomeSignatario(a.signatarioId, params.municipioId);

      if (a.algoritmo === "HMAC_LEGADO") {
        if (!a.assinaturaHmac) {
          return {
            signatarioId: a.signatarioId,
            signatarioNome,
            valida: false,
            algoritmo: "HMAC_LEGADO" as const,
            motivo: "assinatura_legado_corrompida" as const,
          };
        }
        const hmacRecalculado = calcularHmacLegado({
          hashConteudo: ultimaEmissao.hashConteudo,
          signatarioId: a.signatarioId,
          criadoEm: a.criadoEm,
        });
        return {
          signatarioId: a.signatarioId,
          signatarioNome,
          valida: hmacsIguais(a.assinaturaHmac, hmacRecalculado),
          algoritmo: "HMAC_LEGADO" as const,
          criadoEm: a.criadoEm,
          tipoAssinatura: a.tipoAssinatura,
        };
      }

      const chave = await obterChaveVigenteEm(params.municipioId, a.signatarioId, a.criadoEm);
      if (!chave || !a.assinaturaDigital) {
        return {
          signatarioId: a.signatarioId,
          signatarioNome,
          valida: false,
          algoritmo: "ED25519" as const,
          motivo: "chave_publica_ausente" as const,
        };
      }

      const payload = construirPayloadAssinatura({
        referenciaTipo: params.referenciaTipo,
        referenciaId: params.referenciaId,
        emissaoId: ultimaEmissao.id,
        versao: ultimaEmissao.versao,
        hashConteudo: ultimaEmissao.hashConteudo,
        signatarioId: a.signatarioId,
        criadoEm: a.criadoEm,
      });

      return {
        signatarioId: a.signatarioId,
        signatarioNome,
        valida: verificarPayload(payload, a.assinaturaDigital, carregarChavePublica(chave.chavePublica)),
        algoritmo: "ED25519" as const,
        criadoEm: a.criadoEm,
        tipoAssinatura: a.tipoAssinatura,
      };
    })
  );

  const todasValidas = assinaturasVerificadas.every((a) => a.valida);

  return {
    valido: todasValidas && !conteudoAlterado,
    conteudoAlterado,
    origemLegado: ultimaEmissao.origemLegado,
    versao: ultimaEmissao.versao,
    versaoMaisRecente: ultimaEmissao.substituidaPorId === null,
    codigoVerificacao: ultimaEmissao.codigoVerificacao,
    // Para a página pública dizer, em linguagem simples, de que documento se trata.
    documento: {
      tipo: params.referenciaTipo,
      nome: nomeFicheiroDoSnapshot(ultimaEmissao.conteudoSnapshot),
    },
    assinaturas: assinaturasVerificadas,
  };
}

/**
 * Ponto de entrada da rota pública (destino do QR / verificação manual).
 * Não recebe municipioId — não há autenticação — resolve-o a partir do
 * próprio código, que é único globalmente.
 */
export async function verificarDocumentoPublicoPorCodigo(codigo: string) {
  const emissaoApontada = await prisma.emissaoDocumento.findUnique({ where: { codigoVerificacao: codigo } });
  if (!emissaoApontada) {
    throw new AssinaturaNaoEncontradaError("Código de verificação não encontrado.");
  }

  const ultimaEmissao = await withTenantTransaction(emissaoApontada.municipioId, (tx) =>
    tx.emissaoDocumento.findFirst({
      where: { referenciaTipo: emissaoApontada.referenciaTipo, referenciaId: emissaoApontada.referenciaId },
      orderBy: { versao: "desc" },
    })
  );

  if (!ultimaEmissao) {
    throw new AssinaturaNaoEncontradaError("Documento sem assinaturas registadas.");
  }

  return verificarDocumentoPublico({
    municipioId: ultimaEmissao.municipioId,
    referenciaTipo: ultimaEmissao.referenciaTipo,
    referenciaId: ultimaEmissao.referenciaId,
  });
}

export async function gerarPdfDocumento(params: {
  municipioId: string;
  referenciaTipo: string;
  referenciaId: string;
  nomeMunicipio: string;
}): Promise<Buffer> {
  // Documento de saída: devolve o PDF do próprio documento, carimbado com as assinaturas e o QR.
  if (params.referenciaTipo === REFERENCIA_ANEXO_SAIDA) {
    return construirPdfAssinadoDoAnexo({ municipioId: params.municipioId, anexoId: params.referenciaId });
  }

  const emissao = await withTenantTransaction(params.municipioId, (tx) =>
    tx.emissaoDocumento.findFirst({
      where: { referenciaTipo: params.referenciaTipo, referenciaId: params.referenciaId },
      orderBy: { versao: "desc" },
      include: { assinaturas: true },
    })
  );

  if (!emissao) throw new AssinaturaNaoEncontradaError("Documento sem assinaturas registadas — não é possível gerar o PDF.");
  if (emissao.conteudoSnapshot === null) {
    throw new AssinaturaNaoEncontradaError("Emissão sem snapshot de conteúdo — não é possível regenerar o PDF (provavelmente registo legado).");
  }

  const assinaturas = await Promise.all(
    emissao.assinaturas.map(async (a) => ({
      signatarioNome: await resolverNomeSignatario(a.signatarioId, params.municipioId),
      tipoAssinatura: a.tipoAssinatura,
      criadoEm: a.criadoEm,
    }))
  );

  const qrDataUrl = await gerarQrVerificacao(emissao.codigoVerificacao);

  const html = construirHtmlDocumento({
    emissao: {
      referenciaTipo: emissao.referenciaTipo,
      referenciaId: emissao.referenciaId,
      versao: emissao.versao,
      conteudoSnapshot: emissao.conteudoSnapshot,
      codigoVerificacao: emissao.codigoVerificacao,
      criadoEm: emissao.criadoEm,
    },
    assinaturas,
    qrDataUrl,
    nomeMunicipio: params.nomeMunicipio,
  });

  const browser = await obterBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdfUint8Array = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdfUint8Array);
  } finally {
    await page.close(); // fecha a página, mas mantém o browser vivo para o próximo pedido
  }
}