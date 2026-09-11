import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITMO = "aes-256-gcm";
const VERSAO_FORMATO = "v1";
const TAMANHO_IV_BYTES = 12; // 96 bits — o recomendado para GCM

function obterChave(): Buffer {
  const chaveBase64 = process.env.CIFRA_CAMPOS_SENSIVEIS_CHAVE;
  if (!chaveBase64) {
    throw new Error(
      "CIFRA_CAMPOS_SENSIVEIS_CHAVE não está definida. Gerem uma com `openssl rand -base64 32` e coloquem-na " +
        "num secrets manager (nunca no .env versionado)."
    );
  }
  const chave = Buffer.from(chaveBase64, "base64");
  if (chave.length !== 32) {
    throw new Error("CIFRA_CAMPOS_SENSIVEIS_CHAVE tem de decodificar para exactamente 32 bytes (256 bits).");
  }
  return chave;
}

export function cifrar(textoPlano: string): string {
  const iv = randomBytes(TAMANHO_IV_BYTES);
  const cifra = createCipheriv(ALGORITMO, obterChave(), iv);
  const cifrado = Buffer.concat([cifra.update(textoPlano, "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [VERSAO_FORMATO, iv.toString("base64"), tag.toString("base64"), cifrado.toString("base64")].join(".");
}

export function decifrar(valorCifrado: string): string {
  const partes = valorCifrado.split(".");

  if (partes.length !== 4 || partes[0] !== VERSAO_FORMATO) {
    throw new Error("Valor cifrado em formato desconhecido ou corrompido.");
  }

  const [, ivBase64, tagBase64, cifradoBase64] = partes;

  if (!ivBase64 || !tagBase64 || !cifradoBase64) {
    throw new Error("Valor cifrado incompleto ou corrompido.");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");
  const cifrado = Buffer.from(cifradoBase64, "base64");

  if (iv.length !== TAMANHO_IV_BYTES) {
    throw new Error("IV inválido.");
  }

  if (tag.length !== 16) {
    throw new Error("Tag de autenticação inválida.");
  }

  const decifra = createDecipheriv(ALGORITMO, obterChave(), iv);

  decifra.setAuthTag(tag);

  const textoPlano = Buffer.concat([
    decifra.update(cifrado),
    decifra.final(),
  ]);

  return textoPlano.toString("utf8");
}

export function cifrarOpcional(textoPlano: string | null | undefined): string | null {
  if (textoPlano === null || textoPlano === undefined) return null;
  return cifrar(textoPlano);
}

export function decifrarOpcional(valorCifrado: string | null | undefined): string | null {
  if (valorCifrado === null || valorCifrado === undefined) return null;
  return decifrar(valorCifrado);
}
