import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
}

const MAGIC_BYTES: Array<{ mime: string; signature: number[] }> = [
  { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { mime: "image/png", signature: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "application/pdf", signature: [0x25, 0x50, 0x44, 0x46] },
];

export class TipoFicheiroInvalidoError extends Error {}

export function detectarTipoReal(buffer: Buffer): string | null {
  for (const { mime, signature } of MAGIC_BYTES) {
    const matches = signature.every(
      (byte, index) => buffer[index] === byte
    );

    if (matches) return mime;
  }

  return null;
}

const NOME_MAXIMO = 150;
const NOME_FALLBACK = "documento";

const CARACTERES_CONTROLO = /[\x00-\x1F\x7F]/g;
const CARACTERES_UNICODE_DISFARCE =
  /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

const SEPARADORES_DE_CAMINHO = /[/\\]/g;

export function sanitizarNomeOriginal(
  nomeOriginal: string | undefined | null
): string {
  if (!nomeOriginal) {
    return NOME_FALLBACK;
  }

  let nome = nomeOriginal
    .normalize("NFC")
    .replace(CARACTERES_UNICODE_DISFARCE, "")
    .replace(CARACTERES_CONTROLO, "")
    .replace(SEPARADORES_DE_CAMINHO, "_")
    .trim();

  if (nome === "." || nome === "..") {
    nome = "";
  }

  if (nome.length > NOME_MAXIMO) {
    nome = nome.slice(0, NOME_MAXIMO);
  }

  return nome.length > 0 ? nome : NOME_FALLBACK;
}

export interface UploadResult {
  storageKey: string;
  mimeType: string;
  tamanhoBytes: number;
  nomeOriginal: string;
}

export async function uploadDocumento(params: {
  buffer: Buffer;
  prefixo: string;
  nomeOriginal?: string;
  mimeTiposAceites?: string[];
}): Promise<UploadResult> {
  const mimeType = detectarTipoReal(params.buffer);

  if (!mimeType) {
    throw new TipoFicheiroInvalidoError(
      "Tipo de ficheiro não suportado. Apenas JPEG, PNG ou PDF são aceites."
    );
  }

  if (
    params.mimeTiposAceites &&
    !params.mimeTiposAceites.includes(mimeType)
  ) {
    throw new TipoFicheiroInvalidoError(
      `Este documento tem de ser submetido em ${params.mimeTiposAceites.join(
        " ou "
      )} — ficheiro recebido é ${mimeType}.`
    );
  }

  const nomeOriginalSeguro = sanitizarNomeOriginal(params.nomeOriginal);

  const extensao =
    mimeType === "application/pdf"
      ? "pdf"
      : mimeType.split("/")[1];

  const storageKey = `${params.prefixo}/${randomUUID()}.${extensao}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: storageKey,
      Body: params.buffer,
      ContentLength: params.buffer.length,
      ContentType: mimeType,
      Metadata: {
        "original-filename": encodeURIComponent(nomeOriginalSeguro),
      },
    })
  );

  return {
    storageKey,
    mimeType,
    tamanhoBytes: params.buffer.length,
    nomeOriginal: nomeOriginalSeguro,
  };
}

export const MIME_TIPOS_ENTRADA_SAIDA = ["application/pdf"];

export async function obterNomeOriginal(
  storageKey: string
): Promise<string> {
  try {
    const response = await getClient().send(
      new HeadObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: storageKey,
      })
    );

    const valor = response.Metadata?.["original-filename"];

    if (!valor) {
      return NOME_FALLBACK;
    }

    return decodeURIComponent(valor);
  } catch {
    return NOME_FALLBACK;
  }
}

export async function gerarUrlVisualizacao(
  storageKey: string,
  expiraEmSegundos = 300
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: storageKey,
  });

  return getSignedUrl(getClient(), command, {
    expiresIn: expiraEmSegundos,
  });
}

export async function eliminarDocumento(
  storageKey: string
): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: storageKey,
    })
  );
}

export async function getObjectStream(
  storageKey: string
): Promise<NodeJS.ReadableStream> {
  const response = await getClient().send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: storageKey,
    })
  );

  if (!response.Body) {
    throw new Error("Objeto não possui conteúdo.");
  }

  return response.Body as NodeJS.ReadableStream;
}

export const storageService = {
  uploadDocumento,
  obterNomeOriginal,
  gerarUrlVisualizacao,
  eliminarDocumento,
  getObjectStream,
} as const;