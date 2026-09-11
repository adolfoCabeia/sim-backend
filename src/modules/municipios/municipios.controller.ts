import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarMunicipio,
  listarMunicipios,
  listarDirecoesDoMunicipio,
  CodigoMunicipioJaExisteError,
  ApenasSuperAdminError,
  obterMunicipioPorId
} from "./municipios.service.js";
import type { CriarMunicipioInput } from "./municipios.schema.js";
export class MunicipioNaoEncontradoError extends Error {}

export async function listarMunicipiosController(_request: FastifyRequest, reply: FastifyReply) {
  const municipios = await listarMunicipios();
  return reply.send({ success: true, data: municipios });
}

export async function listarDirecoesDoMunicipioController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const direcoes = await listarDirecoesDoMunicipio(request.params.id);
  return reply.send({ success: true, data: direcoes });
}

export async function criarMunicipioController(
  request: FastifyRequest<{ Body: CriarMunicipioInput }>,
  reply: FastifyReply
) {
  try {
    const resultado = await criarMunicipio({
      input: request.body,
      executorId: request.user.sub,
      executorMunicipioId: request.user.municipioId,
    });

    return reply.status(201).send({
      success: true,
      data: {
        municipio: resultado.municipio,
        direcoesCriadas: resultado.direcoesCriadas,
        departamentosCriados: resultado.departamentosCriados,
      },
    });
  } catch (error) {
    if (error instanceof ApenasSuperAdminError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof CodigoMunicipioJaExisteError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao criar município");
    return reply.status(500).send({ success: false, message: "Erro interno ao criar município." });
  }
}

export async function obterMunicipioController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const municipio = await obterMunicipioPorId(request.params.id);
    return reply.status(200).send({ success: true, data: municipio });
  } catch (error) {
    if (error instanceof MunicipioNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    throw error;
  }
}