import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { withTenantTransaction } from "../../config/prisma.js";
import { carregarContextoExecutor, ehDirectorDaDireccao } from "../../core/process-engine/process-engine.vez.js";
import { gerarQrVerificacao } from "./qrcode.util.js";
import { lerFicheiro, guardarFicheiro } from "./assinatura.armazenamento.js";
import { AssinaturaNaoEncontradaError, ConteudoNaoResolvivelError } from "./assinatura.errors.js";

/** Tipo de referência usado ao assinar o documento de saída de um processo. */
export const REFERENCIA_ANEXO_SAIDA = "ANEXO_SAIDA";

/** O utilizador não pode assinar este documento de saída (mapear para HTTP 403). */
export class AssinaturaNaoAutorizadaError extends Error { }

// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo assinado e autorização
// ─────────────────────────────────────────────────────────────────────────────

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function carregarAnexoSaida(municipioId: string, anexoId: string) {
  return withTenantTransaction(municipioId, (tx) =>
    tx.processoGenericoAnexo.findFirst({
      where: { id: anexoId, tipoAnexo: "SAIDA", processo: { municipioId } },
      select: { id: true, processoId: true, nomeFicheiro: true, versao: true, storageKey: true },
    })
  );
}

/**
 * O que a assinatura cobre: o CONTEÚDO EXACTO do ficheiro (SHA-256 do PDF original).
 * Qualquer alteração ao ficheiro dá outro conteúdo e a verificação passa a falhar.
 */
export async function resolverConteudoAnexoSaida(anexoId: string, municipioId: string): Promise<string | null> {
  const anexo = await carregarAnexoSaida(municipioId, anexoId);
  if (!anexo) return null;
  const bytes = await lerFicheiro(anexo.storageKey);
  return `${REFERENCIA_ANEXO_SAIDA}|${anexo.nomeFicheiro}|v${anexo.versao}|sha256:${sha256Hex(bytes)}`;
}

/** Nome do ficheiro guardado no snapshot (para a página pública de verificação). */
export function nomeFicheiroDoSnapshot(snapshot: string | null): string | null {
  if (!snapshot?.startsWith(`${REFERENCIA_ANEXO_SAIDA}|`)) return null;
  return snapshot.split("|")[1] ?? null;
}

/**
 * Só assina o documento de saída quem tem uma razão para o fazer neste processo:
 *  - o responsável pelo processo (ex.: o funcionário/assessor que envia a resposta);
 *  - o director da direcção que o está a tratar (na SG, o Secretário Geral);
 *  - quem dá o despacho final (Administrador).
 */
export async function garantirPodeAssinarAnexoSaida(params: {
  municipioId: string;
  utilizadorId: string;
  anexoId: string;
}): Promise<void> {
  await withTenantTransaction(params.municipioId, async (tx) => {
    const anexo = await tx.processoGenericoAnexo.findFirst({
      where: { id: params.anexoId, tipoAnexo: "SAIDA", processo: { municipioId: params.municipioId } },
      select: { processo: { select: { responsavelActualId: true, direcaoAtualId: true } } },
    });
    if (!anexo) throw new AssinaturaNaoEncontradaError("Documento de saída não encontrado.");

    const { responsavelActualId, direcaoAtualId } = anexo.processo;
    const ctx = await carregarContextoExecutor(tx, params.municipioId, params.utilizadorId);

    const pode =
      responsavelActualId === params.utilizadorId ||
      ehDirectorDaDireccao(ctx, direcaoAtualId) ||
      ctx.podeDespachoFinal;

    if (!pode) {
      throw new AssinaturaNaoAutorizadaError(
        "Só o responsável pelo processo, o director da direcção ou quem dá o despacho final pode assinar este documento."
      );
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Carimbo no PDF (rodapé em todas as páginas + página final com certificado e QR)
// ─────────────────────────────────────────────────────────────────────────────

const ROTULOS_ASSINATURA: Record<string, string> = {
  PARECER_JURIDICO: "Parecer jurídico",
  DESPACHO: "Despacho",
  CONTRATO: "Contrato",
  AUTO_FISCALIZACAO: "Auto de fiscalização",
};

/** As fontes padrão do PDF só suportam Latin-1 (+ alguns símbolos): o resto vira "?". */
function seguro(texto: string): string {
  return [...texto.normalize("NFC")]
    .map((c) => (c.charCodeAt(0) <= 0xff || "—–’‘“”•€".includes(c) ? c : "?"))
    .join("");
}

function dataHora(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function escrever(
  pagina: PDFPage,
  texto: string,
  opcoes: { x: number; y: number; tamanho: number; fonte: PDFFont; largura: number; cor?: ReturnType<typeof rgb> }
): number {
  const { x, tamanho, fonte, largura } = opcoes;
  let y = opcoes.y;
  let linha = "";
  const palavras = seguro(texto).split(/\s+/);

  const desenhar = (t: string) => {
    pagina.drawText(t, { x, y, size: tamanho, font: fonte, color: opcoes.cor ?? rgb(0.1, 0.1, 0.1) });
    y -= tamanho * 1.45;
  };

  for (const palavra of palavras) {
    const tentativa = linha ? `${linha} ${palavra}` : palavra;
    if (fonte.widthOfTextAtSize(tentativa, tamanho) > largura && linha) {
      desenhar(linha);
      linha = palavra;
    } else {
      linha = tentativa;
    }
  }
  if (linha) desenhar(linha);
  return y;
}

type DadosCarimbo = {
  pdfOriginal: Buffer;
  qrPng: Buffer;
  codigoVerificacao: string;
  urlVerificacao: string;
  hashFicheiro: string;
  nomeFicheiro: string;
  versao: number;
  nomeMunicipio: string;
  assinaturas: Array<{ nome: string; tipo: string; criadoEm: Date }>;
};

async function carimbarPdf(d: DadosCarimbo): Promise<Buffer> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(d.pdfOriginal);
  } catch {
    throw new ConteudoNaoResolvivelError(
      "Não foi possível ler o PDF para o assinar (ficheiro corrompido ou protegido por palavra-passe)."
    );
  }

  const fonte = await doc.embedFont(StandardFonts.Helvetica);
  const negrito = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const cinza = rgb(0.35, 0.35, 0.35);

  // 1) Rodapé discreto em todas as páginas do documento
  const rodape = seguro(`Assinado electronicamente — código ${d.codigoVerificacao} — ver certificado na última página`);
  for (const pagina of doc.getPages()) {
    pagina.drawText(rodape, { x: 28, y: 12, size: 7, font: fonte, color: cinza });
  }

  // 2) Página final: certificado
  const cert = doc.addPage([595.28, 841.89]);
  const M = 50;
  const largura = 595.28 - 2 * M;
  let y = 841.89 - M;

  cert.drawText(seguro("Certificado de assinatura electrónica"), { x: M, y: y - 14, size: 18, font: negrito });
  y -= 36;
  y = escrever(cert, d.nomeMunicipio, { x: M, y, tamanho: 10, fonte, largura, cor: cinza });
  cert.drawLine({ start: { x: M, y: y - 4 }, end: { x: 595.28 - M, y: y - 4 }, thickness: 0.8, color: cinza });
  y -= 22;

  cert.drawText("Documento", { x: M, y, size: 9, font: negrito, color: cinza });
  y -= 14;
  y = escrever(cert, `${d.nomeFicheiro} (versão ${d.versao})`, { x: M, y, tamanho: 11, fonte, largura });
  y -= 8;

  cert.drawText("Impressão digital do ficheiro (SHA-256)", { x: M, y, size: 9, font: negrito, color: cinza });
  y -= 14;
  cert.drawText(d.hashFicheiro.slice(0, 32), { x: M, y, size: 9, font: mono });
  y -= 13;
  cert.drawText(d.hashFicheiro.slice(32), { x: M, y, size: 9, font: mono });
  y -= 26;

  cert.drawText("Assinado por", { x: M, y, size: 9, font: negrito, color: cinza });
  y -= 16;
  for (const a of d.assinaturas) {
    cert.drawText(seguro(a.nome), { x: M, y, size: 11, font: negrito });
    y -= 14;
    const rotulo = ROTULOS_ASSINATURA[a.tipo] ?? a.tipo;
    cert.drawText(seguro(`${rotulo} — ${dataHora(a.criadoEm)}`), { x: M, y, size: 9.5, font: fonte, color: cinza });
    y -= 20;
  }

  // 3) QR + instruções, ancorados em baixo
  const tamQr = 130;
  const yQr = 90;
  const qr = await doc.embedPng(d.qrPng);
  cert.drawImage(qr, { x: M, y: yQr, width: tamQr, height: tamQr });

  const xTexto = M + tamQr + 20;
  const larguraTexto = 595.28 - M - xTexto;
  let yt = yQr + tamQr - 10;
  cert.drawText("Confirme a autenticidade", { x: xTexto, y: yt, size: 11, font: negrito });
  yt -= 18;
  yt = escrever(
    cert,
    "Digitalize o código QR para verificar esta assinatura no portal do município, ou aceda ao endereço " +
      "abaixo e introduza o código de verificação.",
    { x: xTexto, y: yt, tamanho: 9.5, fonte, largura: larguraTexto }
  );
  yt -= 4;
  cert.drawText("Código de verificação", { x: xTexto, y: yt, size: 9, font: negrito, color: cinza });
  yt -= 14;
  cert.drawText(seguro(d.codigoVerificacao), { x: xTexto, y: yt, size: 12, font: mono });
  yt -= 18;
  escrever(cert, d.urlVerificacao, { x: xTexto, y: yt, tamanho: 8, fonte: mono, largura: larguraTexto, cor: cinza });

  escrever(
    cert,
    "Qualquer alteração ao conteúdo do documento invalida a assinatura. A verificação compara o documento com o " +
      "registo guardado no momento da assinatura.",
    { x: M, y: yQr - 18, tamanho: 8.5, fonte, largura, cor: cinza }
  );

  return Buffer.from(await doc.save());
}

// ─────────────────────────────────────────────────────────────────────────────
// Geração e persistência da cópia assinada
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Endereço impresso no certificado. Sem APP_PUBLIC_URL, usa o mesmo texto do modelo dos restantes
 * documentos ("sim-viana.gov.ao/verificar"), onde o código se introduz à mão. O QR tem o endereço
 * completo (é o `gerarQrVerificacao` que o define).
 */
function urlVerificacao(codigo: string): string {
  const base = process.env.APP_PUBLIC_URL;
  return base ? `${base.replace(/\/$/, "")}/verificar/${codigo}` : "sim-viana.gov.ao/verificar";
}

/** Constrói o PDF original + rodapé + certificado com QR. Não grava nada. */
export async function construirPdfAssinadoDoAnexo(params: { municipioId: string; anexoId: string }): Promise<Buffer> {
  const anexo = await carregarAnexoSaida(params.municipioId, params.anexoId);
  if (!anexo) throw new AssinaturaNaoEncontradaError("Documento de saída não encontrado.");

  const { emissao, nomes, nomeMunicipio } = await withTenantTransaction(params.municipioId, async (tx) => {
    const emissao = await tx.emissaoDocumento.findFirst({
      where: { referenciaTipo: REFERENCIA_ANEXO_SAIDA, referenciaId: anexo.id },
      orderBy: { versao: "desc" },
      include: { assinaturas: { orderBy: { criadoEm: "asc" } } },
    });
    const ids = [...new Set((emissao?.assinaturas ?? []).map((a) => a.signatarioId))];
    const utilizadores = ids.length
      ? await tx.utilizador.findMany({ where: { id: { in: ids } }, select: { id: true, nomeCompleto: true } })
      : [];
    const municipio = await tx.municipio.findUnique({ where: { id: params.municipioId }, select: { nome: true } });
    return {
      emissao,
      nomes: new Map(utilizadores.map((u) => [u.id, u.nomeCompleto])),
      nomeMunicipio: municipio?.nome ?? "Administração Municipal",
    };
  });

  if (!emissao || emissao.assinaturas.length === 0) {
    throw new AssinaturaNaoEncontradaError("Este documento de saída ainda não tem assinaturas.");
  }

  const pdfOriginal = await lerFicheiro(anexo.storageKey);
  const hashFicheiro = sha256Hex(pdfOriginal);

  // Segurança: o ficheiro que vai ser carimbado tem de ser exactamente o que foi assinado.
  if (emissao.conteudoSnapshot && !emissao.conteudoSnapshot.endsWith(`sha256:${hashFicheiro}`)) {
    throw new ConteudoNaoResolvivelError("O ficheiro foi alterado depois de assinado — assina a nova versão.");
  }

  const qrDataUrl = await gerarQrVerificacao(emissao.codigoVerificacao);
  const qrPng = Buffer.from(qrDataUrl.split(",")[1] ?? "", "base64");

  return carimbarPdf({
    pdfOriginal,
    qrPng,
    codigoVerificacao: emissao.codigoVerificacao,
    urlVerificacao: urlVerificacao(emissao.codigoVerificacao),
    hashFicheiro,
    nomeFicheiro: anexo.nomeFicheiro,
    versao: anexo.versao,
    nomeMunicipio,
    assinaturas: emissao.assinaturas.map((a) => ({
      nome: nomes.get(a.signatarioId) ?? "Signatário desconhecido",
      tipo: a.tipoAssinatura,
      criadoEm: a.criadoEm,
    })),
  });
}

/**
 * Gera a cópia assinada e guarda-a no anexo (`storageKeyAssinado`). É esta a versão que o cidadão
 * descarrega quando o processo é concluído. Chamar depois de cada nova assinatura.
 */
export async function persistirCopiaAssinada(params: { municipioId: string; anexoId: string }): Promise<string> {
  const anexo = await carregarAnexoSaida(params.municipioId, params.anexoId);
  if (!anexo) throw new AssinaturaNaoEncontradaError("Documento de saída não encontrado.");

  const pdf = await construirPdfAssinadoDoAnexo(params);
  const storageKey = await guardarFicheiro({
    nomeFicheiro: `assinado-${anexo.nomeFicheiro}`,
    conteudo: pdf,
    contentType: "application/pdf",
  });

  await withTenantTransaction(params.municipioId, (tx) =>
    tx.processoGenericoAnexo.update({
      where: { id: anexo.id },
      data: { storageKeyAssinado: storageKey, assinadoEm: new Date() },
    })
  );
  return storageKey;
}