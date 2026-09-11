import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function calcularHashConteudo(conteudo: string): string {
  // Normaliza espaços em branco nas pontas — evita que um simples
  // trailing-newline invalide uma assinatura legítima.
  return createHash("sha256").update(conteudo.trim(), "utf8").digest("hex");
}

export function calcularHmac(params: {
  hashConteudo: string;
  signatarioId: string;
  criadoEm: Date;
  segredo: string;
}): string {
  const base = `${params.hashConteudo}:${params.signatarioId}:${params.criadoEm.toISOString()}`;
  return createHmac("sha256", params.segredo).update(base, "utf8").digest("hex");
}

/** Comparação em tempo constante — não usar `===` para comparar HMACs. */
export function hmacsIguais(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}