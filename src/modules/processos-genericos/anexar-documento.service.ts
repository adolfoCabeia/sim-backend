import type { MultipartFile } from "@fastify/multipart";
import { uploadDocumento, TipoFicheiroInvalidoError } from "../../modules/storage/storage.service.js";
import { adicionarAnexoProcesso } from "./processos-genericos.service.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword", 
];

export interface AnexarDocumentoInput {
  municipioId: string;
  processoId: string;
  utilizadorUploadId: string;
  tipoConta: "INTERNO" | "EXTERNO";
  ficheiro: MultipartFile;
  tipoDocumentoCodigo?: string;
  tipoAnexo?: "ENTRADA" | "SAIDA";
}

export async function anexarDocumentoService(input: AnexarDocumentoInput) {
  const buffer = await input.ficheiro.toBuffer();

  if (buffer.length > MAX_FILE_SIZE) {
    throw new TipoFicheiroInvalidoError("Ficheiro excede o tamanho máximo permitido (10 MB).");
  }

  if (!ALLOWED_MIME_TYPES.includes(input.ficheiro.mimetype)) {
    throw new TipoFicheiroInvalidoError(
      `Tipo de ficheiro não permitido (${input.ficheiro.mimetype}). Aceita apenas PDF, PNG, JPG e DOC/DOCX.`
    );
  }

  const upload = await uploadDocumento({
    buffer,
    prefixo: `processos-genericos/${input.processoId}`,
    nomeOriginal: input.ficheiro.filename,
  });

  const anexo = await adicionarAnexoProcesso({
    municipioId: input.municipioId,
    processoId: input.processoId,
    nomeFicheiro: upload.nomeOriginal,
    storageKey: upload.storageKey,
    utilizadorUploadId: input.utilizadorUploadId,
    exigirRequerente: input.tipoConta !== "INTERNO",
    origemInterna: input.tipoConta === "INTERNO",
    ...(input.tipoDocumentoCodigo !== undefined && { tipoDocumentoCodigo: input.tipoDocumentoCodigo }),
    ...(input.tipoAnexo !== undefined && { tipoAnexo: input.tipoAnexo }),
  });

  return anexo;
}