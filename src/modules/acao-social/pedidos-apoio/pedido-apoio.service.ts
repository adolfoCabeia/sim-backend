import type { Prisma } from "../../../generated/prisma/client.js";
import { withTenantTransaction } from "../../../config/prisma.js";
import type { CriarPedidoApoioInput, ResolverPedidoApoioInput, ListarPedidosApoioQuery } from "./pedido-apoio.schema.js";

export class PedidoApoioNaoEncontradoError extends Error {}
export class PedidoApoioEstadoInvalidoError extends Error {}
export class BeneficiarioNaoEncontradoError extends Error {}

export async function criarPedidoApoio(params: { municipioId: string; input: CriarPedidoApoioInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const beneficiario = await tx.beneficiario.findUnique({ where: { id: params.input.beneficiarioId } });
    if (!beneficiario) throw new BeneficiarioNaoEncontradoError("Beneficiário não encontrado.");

    return tx.pedidoApoio.create({
      data: {
        municipioId: params.municipioId,
        beneficiarioId: params.input.beneficiarioId,
        tipo: params.input.tipo,
        estado: "EM_ANALISE",
        ...(params.input.valorAprovado !== undefined && { valorAprovado: params.input.valorAprovado }),
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
      },
    });
  });
}

async function obterPedidoOuFalhar(tx: Prisma.TransactionClient, id: string) {
  const pedido = await tx.pedidoApoio.findUnique({ where: { id } });
  if (!pedido) throw new PedidoApoioNaoEncontradoError("Pedido de apoio não encontrado.");
  return pedido;
}

export async function obterPedidoApoio(params: { municipioId: string; id: string }) {
  return withTenantTransaction(params.municipioId, (tx) => obterPedidoOuFalhar(tx, params.id));
}

export async function resolverPedidoApoio(params: {
  municipioId: string;
  id: string;
  resolvidoPorId: string;
  input: ResolverPedidoApoioInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const pedido = await obterPedidoOuFalhar(tx, params.id);
    if (pedido.estado !== "EM_ANALISE") {
      throw new PedidoApoioEstadoInvalidoError(`Só é possível resolver pedidos EM_ANALISE (estado actual: ${pedido.estado}).`);
    }

    return tx.pedidoApoio.update({
      where: { id: params.id },
      data: {
        estado: params.input.estado,
        resolvidoPorId: params.resolvidoPorId,
        resolvidoEm: new Date(),
        ...(params.input.estado === "DEFERIDO" && params.input.valorAprovado !== undefined
          ? { valorAprovado: params.input.valorAprovado }
          : {}),
        ...(params.input.estado === "INDEFERIDO" && params.input.motivoIndeferimento !== undefined
          ? { motivoIndeferimento: params.input.motivoIndeferimento }
          : {}),
      },
    });
  });
}

export async function cancelarPedidoApoio(params: { municipioId: string; id: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const pedido = await obterPedidoOuFalhar(tx, params.id);
    if (pedido.estado !== "EM_ANALISE") {
      throw new PedidoApoioEstadoInvalidoError("Só é possível cancelar pedidos ainda EM_ANALISE.");
    }
    return tx.pedidoApoio.update({ where: { id: params.id }, data: { estado: "CANCELADO", resolvidoEm: new Date() } });
  });
}

export async function listarPedidosApoio(params: { municipioId: string; query: ListarPedidosApoioQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.PedidoApoioWhereInput = {
      ...(params.query.tipo !== undefined && { tipo: params.query.tipo }),
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
      ...(params.query.beneficiarioId !== undefined && { beneficiarioId: params.query.beneficiarioId }),
    };
    const [items, total] = await Promise.all([
      tx.pedidoApoio.findMany({
        where,
        include: { beneficiario: { select: { nome: true, bairro: true } } },
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.pedidoApoio.count({ where }),
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