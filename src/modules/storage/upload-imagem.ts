import { storageService, detectarTipoReal, TipoFicheiroInvalidoError } from "./storage.service.js";

const MIME_IMAGENS = ["image/jpeg", "image/png", "image/webp"];

export interface UploadImagemResult {
  storageKey: string;
  mimeType: string;
  tamanhoBytes: number;
  urlVisualizacao: string;
  nomeOriginal: string;
}

export async function uploadImagem(params: {
  buffer: Buffer;
  prefixo: string;
  nomeOriginal?: string;
}): Promise<UploadImagemResult> {
  const mimeType = detectarTipoReal(params.buffer);

  if (!mimeType || !MIME_IMAGENS.includes(mimeType)) {
    throw new TipoFicheiroInvalidoError(
      `Imagem inválida. Apenas JPEG, PNG ou WebP são aceites. Recebido: ${mimeType ?? "desconhecido"}`
    );
  }

  const uploadParams: { buffer: Buffer; prefixo: string; nomeOriginal?: string; mimeTiposAceites?: string[] } = {
    buffer: params.buffer,
    prefixo: params.prefixo,
    mimeTiposAceites: MIME_IMAGENS,
  };
  if (params.nomeOriginal) uploadParams.nomeOriginal = params.nomeOriginal;

  const resultado = await storageService.uploadDocumento(uploadParams);

  const urlVisualizacao = await storageService.gerarUrlVisualizacao(resultado.storageKey, 3600);

  return {
    storageKey: resultado.storageKey,
    mimeType: resultado.mimeType,
    tamanhoBytes: resultado.tamanhoBytes,
    nomeOriginal: resultado.nomeOriginal,
    urlVisualizacao,
  };
}