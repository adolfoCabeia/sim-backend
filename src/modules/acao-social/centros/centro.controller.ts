import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarCentro,
  obterCentro,
  atualizarCentro,
  listarCentros,
  CentroNaoEncontradoError,
  OcupacaoExcedeCapacidadeError,
} from "./centro.service.js";
import type { CriarCentroInput, AtualizarCentroInput, ListarCentrosQuery } from "./centro.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof CentroNaoEncontradoError) return reply.status(404).send({ success: false, message: error.message });
  if (error instanceof OcupacaoExcedeCapacidadeError) return reply.status(422).send({ success: false, message: error.message });
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarCentroController(request: FastifyRequest<{ Body: CriarCentroInput }>, reply: FastifyReply) {
  try {
    const centro = await criarCentro({ municipioId: request.user.municipioId, input: request.body });
    return reply.status(201).send({ success: true, data: centro });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar centro");
  }
}

export async function obterCentroController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const centro = await obterCentro({ municipioId: request.user.municipioId, id: request.params.id });
    return reply.send({ success: true, data: centro });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter centro");
  }
}

export async function atualizarCentroController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtualizarCentroInput }>,
  reply: FastifyReply
) {
  try {
    const centro = await atualizarCentro({ municipioId: request.user.municipioId, id: request.params.id, input: request.body });
    return reply.send({ success: true, data: centro });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao atualizar centro");
  }
}

export async function listarCentrosController(
  request: FastifyRequest<{ Querystring: ListarCentrosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarCentros({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}
