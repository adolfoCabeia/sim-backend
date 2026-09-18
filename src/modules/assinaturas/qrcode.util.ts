import QRCode from "qrcode";

/** Aponta sempre para o código curto (mesmo destino da verificação manual),
 * nunca para referenciaTipo/referenciaId crus na URL. */
export async function gerarQrVerificacao(codigoVerificacao: string): Promise<string> {
  const url = `https://sim-viana.gov.ao/verificar/${codigoVerificacao}`;
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2 });
}