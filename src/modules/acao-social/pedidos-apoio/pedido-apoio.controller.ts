import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarPedidoApoio,
  obterPedidoApoio,
  resolverPedidoApoio,
  cancelarPedidoApoio,
  listarPedidosApoio,
  PedidoApoioNaoEncontradoError,
  PedidoApoioEstadoInvalidoError,
  BeneficiarioNaoEncontradoError,
} from "./pedido-apoio.service.js";
import type { CriarPedidoApoioInput, ResolverPedidoApoioInput, ListarPedidosApoioQuery } from "./pedido-apoio.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof PedidoApoioNaoEncontradoError || error instanceof BeneficiarioNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof PedidoApoioEstadoInvalidoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarPedidoApoioController(request: FastifyRequest<{ Body: CriarPedidoApoioInput }>, reply: FastifyReply) {
  try {
    const pedido = await criarPedidoApoio({ municipioId: request.user.municipioId, input: request.body });
    return reply.status(201).send({ success: true, data: pedido });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar pedido de apoio");
  }
}

export async function obterPedidoApoioController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const pedido = await obterPedidoApoio({ municipioId: request.user.municipioId, id: request.params.id });
    return reply.send({ success: true, data: pedido });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter pedido de apoio");
  }
}

export async function resolverPedidoApoioController(
  request: FastifyRequest<{ Params: { id: string }; Body: ResolverPedidoApoioInput }>,
  reply: FastifyReply
) {
  try {
    const pedido = await resolverPedidoApoio({
      municipioId: request.user.municipioId,
      id: request.params.id,
      resolvidoPorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: pedido });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao resolver pedido de apoio");
  }
}

export async function cancelarPedidoApoioController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const pedido = await cancelarPedidoApoio({ municipioId: request.user.municipioId, id: request.params.id });
    return reply.send({ success: true, data: pedido });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao cancelar pedido de apoio");
  }
}

export async function listarPedidosApoioController(
  request: FastifyRequest<{ Querystring: ListarPedidosApoioQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarPedidosApoio({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}
