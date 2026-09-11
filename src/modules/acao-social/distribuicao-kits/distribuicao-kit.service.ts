import type { Prisma } from "../../../generated/prisma/client.js";
import { withTenantTransaction } from "../../../config/prisma.js";
import type { CriarDistribuicaoKitInput, ListarDistribuicoesQuery } from "./distribuicao-kit.schema.js";

export class BeneficiarioNaoEncontradoError extends Error {}

export async function criarDistribuicaoKit(params: { municipioId: string; distribuidoPorId: string; input: CriarDistribuicaoKitInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const beneficiario = await tx.beneficiario.findUnique({ where: { id: params.input.beneficiarioId } });
    if (!beneficiario) throw new BeneficiarioNaoEncontradoError("Beneficiário não encontrado.");

    return tx.distribuicaoKit.create({
      data: {
        municipioId: params.municipioId,
        beneficiarioId: params.input.beneficiarioId,
        distribuidoPorId: params.distribuidoPorId,
        ...(params.input.centroAcolhimentoId !== undefined && { centroAcolhimentoId: params.input.centroAcolhimentoId }),
        ...(params.input.quantidadeKits !== undefined && { quantidadeKits: params.input.quantidadeKits }),
        ...(params.input.requisicaoId !== undefined && { requisicaoId: params.input.requisicaoId }),
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
      },
    });
  });
}

export async function listarDistribuicoes(params: { municipioId: string; query: ListarDistribuicoesQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.DistribuicaoKitWhereInput = {
      ...(params.query.beneficiarioId !== undefined && { beneficiarioId: params.query.beneficiarioId }),
      ...(params.query.centroAcolhimentoId !== undefined && { centroAcolhimentoId: params.query.centroAcolhimentoId }),
      ...((params.query.desde !== undefined || params.query.ate !== undefined) && {
        criadoEm: {
          ...(params.query.desde !== undefined && { gte: new Date(params.query.desde) }),
          ...(params.query.ate !== undefined && { lte: new Date(params.query.ate) }),
        },
      }),
    };
    const [items, total] = await Promise.all([
      tx.distribuicaoKit.findMany({
        where,
        include: { beneficiario: { select: { nome: true, bairro: true } }, centroAcolhimento: { select: { nome: true } } },
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.distribuicaoKit.count({ where }),
    ]);
    return {
      items,
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}