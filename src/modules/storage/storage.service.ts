import { Client as MinioClient } from "minio";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";

let client: MinioClient | undefined;
let bucketEnsured = false;

function getClient(): MinioClient {
  if (!client) {
    client = new MinioClient({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return client;
}

async function ensureBucket(bucket: string): Promise<void> {
  if (bucketEnsured) return;
  const c = getClient();
  const exists = await c.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await c.makeBucket(bucket);
  }
  bucketEnsured = true;
}

const MAGIC_BYTES: Array<{ mime: string; signature: number[] }> = [
  { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { mime: "image/png", signature: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "application/pdf", signature: [0x25, 0x50, 0x44, 0x46] },
];

export class TipoFicheiroInvalidoError extends Error {}

export function detectarTipoReal(buffer: Buffer): string | null {
  for (const { mime, signature } of MAGIC_BYTES) {
    const matches = signature.every((byte, index) => buffer[index] === byte);
    if (matches) return mime;
  }
  return null;
}
const NOME_MAXIMO = 150;
const NOME_FALLBACK = "documento";

const CARACTERES_CONTROLO = /[\x00-\x1F\x7F]/g;
const CARACTERES_UNICODE_DISFARCE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const SEPARADORES_DE_CAMINHO = /[/\\]/g;

export function sanitizarNomeOriginal(nomeOriginal: string | undefined | null): string {
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

  if (params.mimeTiposAceites && !params.mimeTiposAceites.includes(mimeType)) {
    throw new TipoFicheiroInvalidoError(
      `Este documento tem de ser submetido em ${params.mimeTiposAceites.join(" ou ")} — ficheiro recebido é ${mimeType}.`
    );
  }

  const nomeOriginalSeguro = sanitizarNomeOriginal(params.nomeOriginal);

  const extensao = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1];
  const storageKey = `${params.prefixo}/${randomUUID()}.${extensao}`;

  await ensureBucket(env.MINIO_BUCKET_DOCUMENTOS);

  await getClient().putObject(
    env.MINIO_BUCKET_DOCUMENTOS,
    storageKey,
    params.buffer,
    params.buffer.length,
    {
      "Content-Type": mimeType,
      "X-Amz-Meta-Original-Filename": encodeURIComponent(nomeOriginalSeguro),
    }
  );

  return { storageKey, mimeType, tamanhoBytes: params.buffer.length, nomeOriginal: nomeOriginalSeguro };
}
 
export const MIME_TIPOS_ENTRADA_SAIDA = ["application/pdf"];

export async function obterNomeOriginal(storageKey: string): Promise<string> {
  try {
    const stat = await getClient().statObject(env.MINIO_BUCKET_DOCUMENTOS, storageKey);
    const metaData = (stat.metaData ?? {}) as Record<string, string>;

    const chaveEncontrada = Object.keys(metaData).find(
      (chave) => chave.toLowerCase().replace(/^x-amz-meta-/, "") === "original-filename"
    );

    if (!chaveEncontrada) return NOME_FALLBACK;

    const valor = metaData[chaveEncontrada];
    if (!valor) return NOME_FALLBACK;

    return decodeURIComponent(valor);
  } catch {
    return NOME_FALLBACK;
  }
}

export async function gerarUrlVisualizacao(
  storageKey: string,
  expiraEmSegundos = 300
): Promise<string> {
  return getClient().presignedGetObject(
    env.MINIO_BUCKET_DOCUMENTOS,
    storageKey,
    expiraEmSegundos
  );
}

export async function eliminarDocumento(storageKey: string): Promise<void> {
  await getClient().removeObject(env.MINIO_BUCKET_DOCUMENTOS, storageKey);
}
export async function getObjectStream(storageKey: string): Promise<NodeJS.ReadableStream> {
  await ensureBucket(env.MINIO_BUCKET_DOCUMENTOS);
  return getClient().getObject(env.MINIO_BUCKET_DOCUMENTOS, storageKey);
}
export const storageService = {
  uploadDocumento,
  obterNomeOriginal,
  gerarUrlVisualizacao,
  eliminarDocumento,
  getObjectStream,
} as const;