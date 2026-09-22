type EmissaoParaPdf = {
  referenciaTipo: string;
  referenciaId: string;
  versao: number;
  conteudoSnapshot: string;
  codigoVerificacao: string;
  criadoEm: Date;
};

type AssinaturaParaPdf = {
  signatarioNome: string;
  tipoAssinatura: string;
  criadoEm: Date;
};

const TITULOS_TIPO: Record<string, string> = {
  PARECER_JURIDICO: "Parecer Jurídico",
  DESPACHO: "Despacho",
  CONTRATO: "Contrato",
  AUTO_FISCALIZACAO: "Auto de Fiscalização",
};

function formatarData(d: Date): string {
  return d.toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function construirHtmlDocumento(params: {
  emissao: EmissaoParaPdf;
  assinaturas: AssinaturaParaPdf[];
  qrDataUrl: string;
  nomeMunicipio: string;
}): string {
  const titulo =
    TITULOS_TIPO[params.emissao.referenciaTipo] ??
    params.emissao.referenciaTipo;

  const blocosAssinatura = params.assinaturas
    .map(
      (a) => `
        <div class="assinatura">
          <div class="linha"></div>
          <p class="nome">${escaparHtml(a.signatarioNome)}</p>
          <p class="detalhe">${escaparHtml(a.tipoAssinatura)} — ${formatarData(a.criadoEm)}</p>
        </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-AO">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 25mm 20mm; }
  body { font-family: "Times New Roman", serif; color: #1a1a1a; line-height: 1.5; font-size: 12pt; }
  .cabecalho { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 24px; }
  .cabecalho h1 { font-size: 14pt; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .cabecalho h2 { font-size: 12pt; margin: 4px 0 0; font-weight: normal; }
  .titulo-documento { text-align: center; font-size: 13pt; font-weight: bold; margin: 24px 0; text-transform: uppercase; }
  .conteudo { text-align: justify; white-space: pre-wrap; }
  .assinaturas { margin-top: 48px; display: flex; flex-wrap: wrap; gap: 32px; justify-content: center; }
  .assinatura { text-align: center; width: 200px; }
  .linha { border-top: 1px solid #1a1a1a; margin-bottom: 6px; }
  .nome { font-weight: bold; margin: 0; font-size: 10pt; }
  .detalhe { margin: 2px 0 0; font-size: 9pt; color: #444; }
  .rodape-verificacao { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ccc; display: flex; align-items: center; gap: 16px; }
  .rodape-verificacao img { width: 90px; height: 90px; }
  .rodape-texto { font-size: 8.5pt; color: #444; }
  .rodape-texto .codigo { font-family: monospace; font-size: 11pt; font-weight: bold; color: #1a1a1a; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="cabecalho">
    <h1>República de Angola</h1>
    <h2>${escaparHtml(params.nomeMunicipio)}</h2>
  </div>

  <div class="titulo-documento">${escaparHtml(titulo)} — Versão ${params.emissao.versao}</div>

  <div class="conteudo">${escaparHtml(params.emissao.conteudoSnapshot)}</div>

  <div class="assinaturas">${blocosAssinatura}</div>

  <div class="rodape-verificacao">
    <img src="${params.qrDataUrl}" alt="QR code de verificação" />
    <div class="rodape-texto">
      Este documento pode ser verificado em <strong>sim-viana.gov.ao/verificar</strong><br />
      Código de verificação: <span class="codigo">${escaparHtml(params.emissao.codigoVerificacao)}</span><br />
      A validade deste documento depende de o seu conteúdo não ter sido alterado desde a emissão.
    </div>
  </div>
</body>
</html>`;
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
