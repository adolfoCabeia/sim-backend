import type { FastifyRequest, FastifyReply } from "fastify";
import {
  listarServicosDisponiveis,
  obterCapacidadesPortal,
  criarPedidoPortal,
  listarMeusProcessos,
  obterMeuProcesso,
  obterDocumentoFinal,
  ProcessoNaoEncontradoError,
  DocumentoNaoDisponivelError,
  OrigemNaoPermitidaError,
  obterResumoMeusProcessos,
} from "./portal.service.js";
import {
  ServicoNaoEncontradoError,
  ServicoIncompativelError,
  DirecaoNaoEncontradaError,
} from "../../core/process-engine/process-engine.service.js";
import type { CriarPedidoPortalInput, ListarMeusProcessosQuery, ListarServicosPortalQuery } from "./portal.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof ProcessoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof DocumentoNaoDisponivelError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof OrigemNaoPermitidaError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error instanceof ServicoNaoEncontradoError || error instanceof DirecaoNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof ServicoIncompativelError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function listarServicosDisponiveisController(
  request: FastifyRequest<{ Querystring: ListarServicosPortalQuery }>,
  reply: FastifyReply
) {
  try {
    const servicos = await listarServicosDisponiveis({
      municipioId: request.user.municipioId,
      tipoConta: request.user.tipoConta,
      query: request.query,
    });
    return reply.send({ success: true, data: servicos });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar serviços disponíveis no portal");
  }
}

export async function obterCapacidadesPortalController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const capacidades = await obterCapacidadesPortal({ municipioId: request.user.municipioId, tipoConta: request.user.tipoConta });
    return reply.send({ success: true, data: capacidades });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter capacidades do portal");
  }
}
export async function criarPedidoPortalController(
  request: FastifyRequest<{ Body: CriarPedidoPortalInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await criarPedidoPortal({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      tipoConta: request.user.tipoConta,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar pedido via portal");
  }
}

export async function listarMeusProcessosController(
  request: FastifyRequest<{ Querystring: ListarMeusProcessosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarMeusProcessos({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
    query: request.query,
  });
  return reply.send({ success: true, data: resultado });
}

export async function obterMeuProcessoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const processo = await obterMeuProcesso({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      processoId: request.params.id,
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter processo do portal");
  }
}

export async function obterResumoMeusProcessosController(request: FastifyRequest, reply: FastifyReply) {
  const resumo = await obterResumoMeusProcessos({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
  });
  return reply.send({ success: true, data: resumo });
}

export async function obterDocumentoFinalController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const documento = await obterDocumentoFinal({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      processoId: request.params.id,
    });
    return reply.send({ success: true, data: documento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter documento final do processo");
  }
}