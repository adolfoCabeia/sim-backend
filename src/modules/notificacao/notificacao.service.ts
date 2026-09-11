import { prisma } from "../../config/prisma.js";
import type { ListarNotificacoesQuery } from "./notificacao.schema.js";

export class NotificacaoNaoEncontradaError extends Error {}

export async function listarMinhasNotificacoes(params: {
  utilizadorId: string;
  query: ListarNotificacoesQuery;
}) {
  const where = {
    utilizadorId: params.utilizadorId,
    ...(params.query.apenasNaoLidas && { lida: false }),
  };

  const [items, total, naoLidas] = await Promise.all([
    prisma.notificacao.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (params.query.page - 1) * params.query.pageSize,
      take: params.query.pageSize,
    }),
    prisma.notificacao.count({ where }),
    prisma.notificacao.count({ where: { utilizadorId: params.utilizadorId, lida: false } }),
  ]);

  return {
    items,
    page: params.query.page,
    pageSize: params.query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    naoLidas,
  };
}

export async function contarNaoLidas(params: { utilizadorId: string }): Promise<{ naoLidas: number }> {
  const naoLidas = await prisma.notificacao.count({ where: { utilizadorId: params.utilizadorId, lida: false } });
  return { naoLidas };
}

export async function marcarComoLida(params: { utilizadorId: string; notificacaoId: string }) {
  const notificacao = await prisma.notificacao.findUnique({ where: { id: params.notificacaoId } });
  if (!notificacao || notificacao.utilizadorId !== params.utilizadorId) {
    throw new NotificacaoNaoEncontradaError("Notificação não encontrada.");
  }
  if (notificacao.lida) {
    return notificacao;
  }
  return prisma.notificacao.update({
    where: { id: notificacao.id },
    data: { lida: true, lidaEm: new Date() },
  });
}

export async function marcarTodasComoLidas(params: { utilizadorId: string }): Promise<{ actualizadas: number }> {
  const resultado = await prisma.notificacao.updateMany({
    where: { utilizadorId: params.utilizadorId, lida: false },
    data: { lida: true, lidaEm: new Date() },
  });
  return { actualizadas: resultado.count };
}