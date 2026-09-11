import type { FastifyReply, FastifyRequest } from "fastify";
import {
  criarDirecao,
  listarDirecoes,
  obterDirecao,
  atualizarDirecao,
  eliminarDirecao,
  listarUtilizadoresDaDirecao,
  contarUtilizadoresDaDirecao,
  listarDirecoesComContagemUtilizadores,
} from "./direcoes.service.js";
import {
  DirecaoNaoEncontradaError,
  DirecaoDuplicadaError,
  DirecaoComDependenciasError,
} from "./direcoes.errors.js";
import type { CriarDirecaoInput, AtualizarDirecaoInput } from "./direcoes.schema.js";

function tratarErro(error: unknown, reply: FastifyReply) {
  if (error instanceof DirecaoNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof DirecaoDuplicadaError || error instanceof DirecaoComDependenciasError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  throw error;
}

export async function criarDirecaoController(
  request: FastifyRequest<{ Body: CriarDirecaoInput }>,
  reply: FastifyReply
) {
  try {
    const direcao = await criarDirecao({ input: request.body, municipioId: request.user.municipioId });
    return reply.status(201).send({ success: true, data: direcao });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function listarDirecoesController(
  request: FastifyRequest<{ Querystring: { page?: string; pageSize?: string; search?: string; tipo?: string } }>,
  reply: FastifyReply
) {
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  const resultado = await listarDirecoes({
    municipioId: request.user.municipioId,
    page,
    pageSize,
    ...(request.query.search ? { search: request.query.search } : {}),
    ...(request.query.tipo ? { tipo: request.query.tipo } : {}),
  });
  return reply.status(200).send({ success: true, data: resultado });
}

export async function obterDirecaoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const direcao = await obterDirecao(request.params.id, request.user.municipioId);
    return reply.status(200).send({ success: true, data: direcao });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function atualizarDirecaoController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtualizarDirecaoInput }>,
  reply: FastifyReply
) {
  try {
    const direcao = await atualizarDirecao({
      id: request.params.id,
      municipioId: request.user.municipioId,
      input: request.body,
    });
    return reply.status(200).send({ success: true, data: direcao });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function eliminarDirecaoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await eliminarDirecao(request.params.id, request.user.municipioId);
    return reply.status(204).send();
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function listarUtilizadoresDaDirecaoController(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; pageSize?: string } }>,
  reply: FastifyReply
) {
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  try {
    const resultado = await listarUtilizadoresDaDirecao({
      direcaoId: request.params.id,
      municipioId: request.user.municipioId,
      page,
      pageSize,
    });
    return reply.status(200).send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function contarUtilizadoresDaDirecaoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const resultado = await contarUtilizadoresDaDirecao(request.params.id, request.user.municipioId);
    return reply.status(200).send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function estatisticasUtilizadoresPorDirecaoController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const resultado = await listarDirecoesComContagemUtilizadores(request.user.municipioId);
  return reply.status(200).send({ success: true, data: resultado });
}