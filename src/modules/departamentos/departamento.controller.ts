import type { FastifyReply, FastifyRequest } from "fastify";
import {
  criarDepartamento,
  listarDepartamentos,
  listarDepartamentosDaDirecao,
  obterDepartamento,
  atualizarDepartamento,
  eliminarDepartamento,
  listarUtilizadoresDoDepartamento,
  contarUtilizadoresDoDepartamento,
  listarDepartamentosComContagemUtilizadores,
} from "./departamentos.service.js";
import {
  DepartamentoNaoEncontradoError,
  DepartamentoDuplicadoError,
  DepartamentoComDependenciasError,
  DirecaoNaoEncontradaError,
} from "./departamentos.errors.js";
import type { CriarDepartamentoInput, AtualizarDepartamentoInput } from "./departamentos.schema.js";

function tratarErro(error: unknown, reply: FastifyReply) {
  if (error instanceof DepartamentoNaoEncontradoError || error instanceof DirecaoNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof DepartamentoDuplicadoError || error instanceof DepartamentoComDependenciasError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  throw error;
}

export async function criarDepartamentoController(
  request: FastifyRequest<{ Body: CriarDepartamentoInput }>,
  reply: FastifyReply
) {
  try {
    const departamento = await criarDepartamento({ input: request.body, municipioId: request.user.municipioId });
    return reply.status(201).send({ success: true, data: departamento });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function listarDepartamentosController(
  request: FastifyRequest<{
    Querystring: { page?: string; pageSize?: string; direcaoId?: string; search?: string };
  }>,
  reply: FastifyReply
) {
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  const resultado = await listarDepartamentos({
    municipioId: request.user.municipioId,
    page,
    pageSize,
    ...(request.query.direcaoId ? { direcaoId: request.query.direcaoId } : {}),
    ...(request.query.search ? { search: request.query.search } : {}),
  });
  return reply.status(200).send({ success: true, data: resultado });
}

export async function listarDepartamentosDaDirecaoController(
  request: FastifyRequest<{ Params: { direcaoId: string }; Querystring: { page?: string; pageSize?: string } }>,
  reply: FastifyReply
) {
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  try {
    const resultado = await listarDepartamentosDaDirecao({
      direcaoId: request.params.direcaoId,
      municipioId: request.user.municipioId,
      page,
      pageSize,
    });
    return reply.status(200).send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function obterDepartamentoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const departamento = await obterDepartamento(request.params.id, request.user.municipioId);
    return reply.status(200).send({ success: true, data: departamento });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function atualizarDepartamentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtualizarDepartamentoInput }>,
  reply: FastifyReply
) {
  try {
    const departamento = await atualizarDepartamento({
      id: request.params.id,
      municipioId: request.user.municipioId,
      input: request.body,
    });
    return reply.status(200).send({ success: true, data: departamento });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function eliminarDepartamentoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await eliminarDepartamento(request.params.id, request.user.municipioId);
    return reply.status(204).send();
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function listarUtilizadoresDoDepartamentoController(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; pageSize?: string } }>,
  reply: FastifyReply
) {
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  try {
    const resultado = await listarUtilizadoresDoDepartamento({
      departamentoId: request.params.id,
      municipioId: request.user.municipioId,
      page,
      pageSize,
    });
    return reply.status(200).send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function contarUtilizadoresDoDepartamentoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const resultado = await contarUtilizadoresDoDepartamento(request.params.id, request.user.municipioId);
    return reply.status(200).send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function estatisticasUtilizadoresPorDepartamentoController(
  request: FastifyRequest<{ Querystring: { direcaoId?: string } }>,
  reply: FastifyReply
) {
  const resultado = await listarDepartamentosComContagemUtilizadores({
    municipioId: request.user.municipioId,
    ...(request.query.direcaoId ? { direcaoId: request.query.direcaoId } : {}),
  });
  return reply.status(200).send({ success: true, data: resultado });
}