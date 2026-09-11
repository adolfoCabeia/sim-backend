import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarPedidoFerias,
  responderPedidoFerias,
  cancelarPedidoFerias,
  listarMeusPedidosFerias,
  listarPedidosFerias,
  PedidoFeriasNaoEncontradoError,
  PedidoFeriasEstadoInvalidoError,
  SaldoFeriasInsuficienteError,
  SobreposicaoFeriasError,
  AntecedenciaFeriasInsuficienteError,
  PeriodoForaDoVinculoError,
  PeriodoInvalidoError,
} from "./ferias.service.js";
import { FuncionarioNaoEncontradoError } from "../funcionarios/funcionario.service.js";
import type { CriarPedidoFeriasInput, ResponderPedidoFeriasInput, ListarPedidosFeriasQuery } from "./ferias.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof PedidoFeriasNaoEncontradoError || error instanceof FuncionarioNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof SobreposicaoFeriasError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (
    error instanceof SaldoFeriasInsuficienteError ||
    error instanceof AntecedenciaFeriasInsuficienteError ||
    error instanceof PeriodoForaDoVinculoError ||
    error instanceof PeriodoInvalidoError
  ) {
    return reply.status(422).send({ success: false, message: error.message });
  }
  if (error instanceof PedidoFeriasEstadoInvalidoError) {
    return reply.status(error.message.includes("próprio funcionário") ? 403 : 409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarPedidoFeriasController(
  request: FastifyRequest<{ Body: CriarPedidoFeriasInput }>,
  reply: FastifyReply
) {
  try {
    const pedido = await criarPedidoFerias({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: pedido });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar pedido de férias");
  }
}

export async function responderPedidoFeriasController(
  request: FastifyRequest<{ Params: { id: string }; Body: ResponderPedidoFeriasInput }>,
  reply: FastifyReply
) {
  try {
    const pedido = await responderPedidoFerias({
      municipioId: request.user.municipioId,
      pedidoId: request.params.id,
      aprovadorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: pedido });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao responder ao pedido de férias");
  }
}

export async function cancelarPedidoFeriasController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const pedido = await cancelarPedidoFerias({
      municipioId: request.user.municipioId,
      pedidoId: request.params.id,
      utilizadorId: request.user.sub,
    });
    return reply.send({ success: true, data: pedido });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao cancelar pedido de férias");
  }
}

/** O próprio funcionário vê os seus pedidos e o saldo de dias disponível. */
export async function listarMeusPedidosFeriasController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await listarMeusPedidosFerias({ municipioId: request.user.municipioId, utilizadorId: request.user.sub });
    return reply.send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar os meus pedidos de férias");
  }
}

/** Staff com ferias:aprovar — lista para decidir. */
export async function listarPedidosFeriasController(
  request: FastifyRequest<{ Querystring: ListarPedidosFeriasQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarPedidosFerias({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}
