import type { FastifyRequest, FastifyReply } from "fastify";
import {
  listarMinhasNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  NotificacaoNaoEncontradaError,
} from "./notificacao.service.js";
import type { ListarNotificacoesQuery } from "./notificacao.schema.js";

export async function listarMinhasNotificacoesController(
  request: FastifyRequest<{ Querystring: ListarNotificacoesQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarMinhasNotificacoes({ utilizadorId: request.user.sub, query: request.query });
  return reply.send({ success: true, data: resultado });
}

export async function contarNaoLidasController(request: FastifyRequest, reply: FastifyReply) {
  const resultado = await contarNaoLidas({ utilizadorId: request.user.sub });
  return reply.send({ success: true, data: resultado });
}

export async function marcarComoLidaController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const notificacao = await marcarComoLida({ utilizadorId: request.user.sub, notificacaoId: request.params.id });
    return reply.send({ success: true, data: notificacao });
  } catch (error) {
    if (error instanceof NotificacaoNaoEncontradaError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao marcar notificação como lida");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function marcarTodasComoLidasController(request: FastifyRequest, reply: FastifyReply) {
  const resultado = await marcarTodasComoLidas({ utilizadorId: request.user.sub });
  return reply.send({ success: true, data: resultado });
}