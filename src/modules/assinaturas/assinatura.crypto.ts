import {
  createHash,
  generateKeyPairSync,
  sign as edSign,
  verify as edVerify,
  createCipheriv,
  createDecipheriv,
  createHmac,
  timingSafeEqual,
  randomBytes,
  KeyObject,
  createPublicKey,
  createPrivateKey,
} from "node:crypto";
import { env } from "../../config/env.js";

export function calcularHashConteudo(conteudo: string): string {
  return createHash("sha256").update(conteudo.trim(), "utf8").digest("hex");
}

/** Liga a assinatura ao contexto exacto (tipo+id+versão) — impede reaproveitar
 * uma assinatura válida noutro documento, mesmo copiando o QR fisicamente. */
export function construirPayloadAssinatura(params: {
  referenciaTipo: string;
  referenciaId: string;
  emissaoId: string;
  versao: number;
  hashConteudo: string;
  signatarioId: string;
  criadoEm: Date;
}): Buffer {
  const base = [
    params.referenciaTipo,
    params.referenciaId,
    params.emissaoId,
    params.versao,
    params.hashConteudo,
    params.signatarioId,
    params.criadoEm.toISOString(),
  ].join(":");
  return Buffer.from(base, "utf8");
}

export function gerarParChaves(): { chavePublicaDer: Buffer; chavePrivadaDer: Buffer } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    chavePublicaDer: publicKey.export({ type: "spki", format: "der" }),
    chavePrivadaDer: privateKey.export({ type: "pkcs8", format: "der" }),
  };
}

function obterMasterKey(): Buffer {
  const key = Buffer.from(env.ASSINATURA_MASTER_KEY, "base64");
  if (key.length !== 32) throw new Error("ASSINATURA_MASTER_KEY deve ter 32 bytes (base64).");
  return key;
}

export function cifrarChavePrivada(chavePrivadaDer: Buffer): { cifrado: string; iv: string; authTag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", obterMasterKey(), iv);
  const cifrado = Buffer.concat([cipher.update(chavePrivadaDer), cipher.final()]);
  return { cifrado: cifrado.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export function decifrarChavePrivada(params: { cifrado: string; iv: string; authTag: string }): KeyObject {
  const decipher = createDecipheriv("aes-256-gcm", obterMasterKey(), Buffer.from(params.iv, "base64"));
  decipher.setAuthTag(Buffer.from(params.authTag, "base64"));
  const der = Buffer.concat([decipher.update(Buffer.from(params.cifrado, "base64")), decipher.final()]);
  return createPrivateKey({ key: der, format: "der", type: "pkcs8" });
}

export function carregarChavePublica(chavePublicaDer: string): KeyObject {
  return createPublicKey({ key: Buffer.from(chavePublicaDer, "base64"), format: "der", type: "spki" });
}

export function assinarPayload(payload: Buffer, chavePrivada: KeyObject): string {
  return edSign(null, payload, chavePrivada).toString("base64");
}

export function verificarPayload(payload: Buffer, assinatura: string, chavePublica: KeyObject): boolean {
  try {
    return edVerify(null, payload, chavePublica, Buffer.from(assinatura, "base64"));
  } catch {
    return false;
  }
}

export function gerarCodigoVerificacao(hashConteudo: string, chave: string): string {
  return createHash("sha256").update(`${hashConteudo}:${chave}`).digest("hex").slice(0, 10).toUpperCase();
}

// ---------- Mantido só para verificar assinaturas do sistema legado ----------
export function calcularHmacLegado(params: { hashConteudo: string; signatarioId: string; criadoEm: Date }): string {
  const base = `${params.hashConteudo}:${params.signatarioId}:${params.criadoEm.toISOString()}`;
  return createHmac("sha256", env.ASSINATURA_ELETRONICA_SECRET).update(base, "utf8").digest("hex");
}

export function hmacsIguais(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}