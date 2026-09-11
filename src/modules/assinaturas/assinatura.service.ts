import { withTenantTransaction } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { calcularHashConteudo, calcularHmac, hmacsIguais } from "./assinatura.crypto.js";
import type { AssinarDocumentoInput } from "./assinatura.schema.js";

export class AssinaturaInvalidaError extends Error {}
export class AssinaturaNaoEncontradaError extends Error {}

export async function assinarDocumento(params: {
  municipioId: string;
  signatarioId: string;
  ipOrigem?: string | undefined;
  dados: AssinarDocumentoInput;
}) {
  const hashConteudo = calcularHashConteudo(params.dados.conteudo);
  const criadoEm = new Date();
  const assinaturaHmac = calcularHmac({
    hashConteudo,
    signatarioId: params.signatarioId,
    criadoEm,
    segredo: env.ASSINATURA_ELETRONICA_SECRET,
  });

  return withTenantTransaction(params.municipioId, async (tx) => {
    return tx.assinaturaEletronica.create({
      data: {
        municipioId: params.municipioId,
        signatarioId: params.signatarioId,
        referenciaTipo: params.dados.referenciaTipo,
        referenciaId: params.dados.referenciaId,
        tipoAssinatura: params.dados.tipoAssinatura,
        hashConteudo,
        assinaturaHmac,
        criadoEm,
        ...(params.ipOrigem !== undefined && { ipOrigem: params.ipOrigem }),
      },
    });
  });
}

export async function listarAssinaturas(params: {
  municipioId: string;
  referenciaTipo: string;
  referenciaId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    return tx.assinaturaEletronica.findMany({
      where: { referenciaTipo: params.referenciaTipo, referenciaId: params.referenciaId },
      orderBy: { criadoEm: "asc" },
    });
  });
}

export async function verificarAssinatura(params: {
  assinaturaId: string;
  municipioId: string;
  conteudo: string;
}): Promise<{ valida: boolean; assinatura: Awaited<ReturnType<typeof obterAssinatura>> }> {
  const assinatura = await obterAssinatura(params.assinaturaId, params.municipioId);
  if (!assinatura) throw new AssinaturaNaoEncontradaError("Assinatura não encontrada.");

  const hashRecalculado = calcularHashConteudo(params.conteudo);
  const hmacRecalculado = calcularHmac({
    hashConteudo: hashRecalculado,
    signatarioId: assinatura.signatarioId,
    criadoEm: assinatura.criadoEm,
    segredo: env.ASSINATURA_ELETRONICA_SECRET,
  });

  const valida = hmacsIguais(assinatura.assinaturaHmac, hmacRecalculado);

  return { valida, assinatura };
}

export async function obterAssinatura(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.assinaturaEletronica.findUnique({ where: { id } });
  });
}