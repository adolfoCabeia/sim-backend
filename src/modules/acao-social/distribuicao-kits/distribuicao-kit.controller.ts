import type { FastifyRequest, FastifyReply } from "fastify";
import { criarDistribuicaoKit, listarDistribuicoes, BeneficiarioNaoEncontradoError } from "./distribuicao-kit.service.js";
import type { CriarDistribuicaoKitInput, ListarDistribuicoesQuery } from "./distribuicao-kit.schema.js";

export async function criarDistribuicaoKitController(
  request: FastifyRequest<{ Body: CriarDistribuicaoKitInput }>,
  reply: FastifyReply
) {
  try {
    const distribuicao = await criarDistribuicaoKit({
      municipioId: request.user.municipioId,
      distribuidoPorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: distribuicao });
  } catch (error) {
    if (error instanceof BeneficiarioNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao registar distribuição de kit");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function listarDistribuicoesController(
  request: FastifyRequest<{ Querystring: ListarDistribuicoesQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarDistribuicoes({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}
