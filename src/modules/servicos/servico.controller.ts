import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./servico.service.js";
import type {
  CriarServicoInput,
  ActualizarServicoInput,
  ListarServicosQuery,
  ListarServicosPublicoQuery,
  ObterServicoPublicoParams,
  ObterServicoPublicoQuery,
} from "./servico.schema.js";

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

/** Endpoint público (sem autenticação) — devolve todos os serviços activos do município,
 * sem paginação. municipioId é obrigatório e é o único critério de isolamento aqui, pois
 * filtrarServicosCatalogo já força activo:true. */
export async function listarServicosPublicoController(
  request: FastifyRequest<{ Querystring: ListarServicosPublicoQuery }>,
  reply: FastifyReply
) {
  try {
    const { municipioId, ...filtros } = request.query;
    const cleanFiltros = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined));
    const servicos = await service.filtrarServicosCatalogo({ municipioId, ...cleanFiltros });
    return reply.send({ success: true, data: servicos.map(service.mapServicoParaPublicoResumo) });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar catálogo público de serviços");
  }
}

/** Endpoint público (sem autenticação) — detalhe de um serviço pelo código. Devolve 404
 * se não existir, não pertencer ao município indicado ou estiver desactivado. */
export async function obterServicoPublicoController(
  request: FastifyRequest<{ Params: ObterServicoPublicoParams; Querystring: ObterServicoPublicoQuery }>,
  reply: FastifyReply
) {
  try {
    const servico = await service.obterServicoPorCodigo(request.query.municipioId, request.params.codigo);
    if (!servico) {
      return reply.status(404).send({ success: false, message: "Serviço não encontrado." });
    }
    return reply.send({ success: true, data: service.mapServicoParaPublicoDetalhe(servico) });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter serviço público");
  }
}