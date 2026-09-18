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
  const conteudo = await resolverConteudoAtual(params.dados.referenciaTipo, params.dados.referenciaId, params.municipioId);
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

  return withTenantTransaction(params.municipioId, (tx) =>
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

async function verificarDocumentoPublico(params: { municipioId: string; referenciaTipo: string; referenciaId: string }) {
  const conteudoAtual = await resolverConteudoAtual(params.referenciaTipo, params.referenciaId, params.municipioId);
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
      if (a.algoritmo === "HMAC_LEGADO") {
        if (!a.assinaturaHmac) {
          return {
            signatarioId: a.signatarioId,
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

async function resolverNomeSignatario(signatarioId: string, municipioId: string): Promise<string> {
  return withTenantTransaction(municipioId, async (tx) => {
    const utilizador = await tx.utilizador.findUnique({ where: { id: signatarioId } });
    return utilizador?.nomeCompleto ?? "Signatário desconhecido";
  });
}

export async function gerarPdfDocumento(params: {
  municipioId: string;
  referenciaTipo: string;
  referenciaId: string;
  nomeMunicipio: string;
}): Promise<Buffer> {
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