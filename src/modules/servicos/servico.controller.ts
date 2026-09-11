import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./servico.service.js";
import type { CriarServicoInput, ActualizarServicoInput, ListarServicosQuery, ListarServicosPublicoQuery } from "./servico.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof service.ServicoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (
    error instanceof service.ServicoCodigoDuplicadoError ||
    error instanceof service.DirecaoResponsavelInvalidaError ||
    error instanceof service.SlaInvalidoError
  ) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  if (error instanceof service.ServicoEmUsoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarServicoController(request: FastifyRequest<{ Body: CriarServicoInput }>, reply: FastifyReply) {
  try {
    const servico = await service.criarServico({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: servico });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar serviço no catálogo");
  }
}

export async function actualizarServicoController(
  request: FastifyRequest<{ Params: { id: string }; Body: ActualizarServicoInput }>,
  reply: FastifyReply
) {
  try {
    const servico = await service.actualizarServico({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      servicoId: request.params.id,
      input: request.body,
    });
    return reply.send({ success: true, data: servico });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao actualizar serviço do catálogo");
  }
}

export async function activarServicoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const servico = await service.definirActivoServico({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      servicoId: request.params.id,
      activo: true,
    });
    return reply.send({ success: true, data: servico });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao activar serviço");
  }
}

export async function desactivarServicoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const servico = await service.definirActivoServico({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      servicoId: request.params.id,
      activo: false,
    });
    return reply.send({ success: true, data: servico });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao desactivar serviço");
  }
}

export async function removerServicoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await service.removerServico({ municipioId: request.user.municipioId, servicoId: request.params.id });
    return reply.send({ success: true });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao remover serviço");
  }
}

export async function listarServicosController(request: FastifyRequest<{ Querystring: ListarServicosQuery }>, reply: FastifyReply) {
  try {
    const resultado = await service.listarServicos({ municipioId: request.user.municipioId, query: request.query });
    return reply.send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar catálogo de serviços");
  }
}

export async function obterServicoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const servico = await service.obterServico({ municipioId: request.user.municipioId, servicoId: request.params.id });
    return reply.send({ success: true, data: servico });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter serviço");
  }
}

/** Endpoint público (sem autenticação) — substitui /servicos-municipais estático. Como os
 * dados passaram a ser por município, é obrigatório indicar municipioId. */
export async function listarServicosPublicoController(
  request: FastifyRequest<{ Querystring: ListarServicosPublicoQuery }>,
  reply: FastifyReply
) {
  try {
    const { municipioId, ...query } = request.query;
    const resultado = await service.listarServicos({ municipioId, query: { ...query, activo: true } });
    return reply.send({ success: true, data: resultado.items });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar catálogo público de serviços");
  }
}