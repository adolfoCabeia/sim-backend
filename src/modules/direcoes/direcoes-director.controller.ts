import type { FastifyReply, FastifyRequest } from "fastify";
import { listarCandidatosADirector, definirDirector, DirectorInvalidoError } from "./direcoes-director.service.js";
import { DirecaoNaoEncontradaError } from "./direcoes.errors.js";
import type { DefinirDirectorInput } from "./direcoes-diretor.schema.js";

function tratarErro(error: unknown, reply: FastifyReply) {
  if (error instanceof DirecaoNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof DirectorInvalidoError) {
    return reply.status(422).send({ success: false, message: error.message });
  }
  throw error;
}

export async function listarCandidatosADirectorController(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { search?: string } }>,
  reply: FastifyReply
) {
  try {
    const resultado = await listarCandidatosADirector({
      direcaoId: request.params.id,
      municipioId: request.user.municipioId,
      ...(request.query.search ? { search: request.query.search } : {}),
    });
    return reply.status(200).send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function definirDirectorController(
  request: FastifyRequest<{ Params: { id: string }; Body: DefinirDirectorInput }>,
  reply: FastifyReply
) {
  try {
    const direcao = await definirDirector({
      direcaoId: request.params.id,
      municipioId: request.user.municipioId,
      utilizadorId: request.body.utilizadorId,
      executorId: request.user.sub,
    });
    return reply.status(200).send({ success: true, data: direcao });
  } catch (error) {
    return tratarErro(error, reply);
  }
}