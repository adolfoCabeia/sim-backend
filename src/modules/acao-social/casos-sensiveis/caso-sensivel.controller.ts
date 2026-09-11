import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarCasoSensivel,
  obterCasoSensivel,
  atualizarCasoSensivel,
  eliminarCasoSensivel,
  restaurarCasoSensivel,
  listarCasosSensiveis,
  listarCasosSensiveisEliminados,
  listarAcessosDoCaso,
  CasoSensivelNaoEncontradoError,
  CasoSensivelJaEliminadoError,
} from "./caso-sensivel.service.js";
import type {
  CriarCasoSensivelInput,
  AtualizarCasoSensivelInput,
  EliminarCasoSensivelInput,
  ListarCasosSensiveisQuery,
} from "./caso-sensivel.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof CasoSensivelNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof CasoSensivelJaEliminadoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarCasoSensivelController(
  request: FastifyRequest<{ Body: CriarCasoSensivelInput }>,
  reply: FastifyReply
) {
  try {
    const caso = await criarCasoSensivel({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: caso });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar caso sensível");
  }
}

export async function obterCasoSensivelController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const caso = await obterCasoSensivel({
      municipioId: request.user.municipioId,
      id: request.params.id,
      utilizadorId: request.user.sub,
    });
    return reply.send({ success: true, data: caso });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter caso sensível");
  }
}

export async function atualizarCasoSensivelController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtualizarCasoSensivelInput }>,
  reply: FastifyReply
) {
  try {
    const caso = await atualizarCasoSensivel({
      municipioId: request.user.municipioId,
      id: request.params.id,
      utilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: caso });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao atualizar caso sensível");
  }
}

export async function listarCasosSensiveisController(
  request: FastifyRequest<{ Querystring: ListarCasosSensiveisQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarCasosSensiveis({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
    query: request.query,
  });
  return reply.send({ success: true, data: resultado });
}

/** Requer permissão própria (mais restrita ainda) — ver README. */
export async function listarAcessosDoCasoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const acessos = await listarAcessosDoCaso({ municipioId: request.user.municipioId, casoSensivelId: request.params.id });
    return reply.send({ success: true, data: acessos });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter trilho de auditoria do caso");
  }
}

/** Soft delete — exige sempre motivo. Requer acao-social:casos-sensiveis:gerir. */
export async function eliminarCasoSensivelController(
  request: FastifyRequest<{ Params: { id: string }; Body: EliminarCasoSensivelInput }>,
  reply: FastifyReply
) {
  try {
    const caso = await eliminarCasoSensivel({
      municipioId: request.user.municipioId,
      id: request.params.id,
      utilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: caso });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao eliminar caso sensível");
  }
}

/** Requer permissão própria (ex.: acao-social:casos-sensiveis:eliminados) — ver README. */
export async function restaurarCasoSensivelController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const caso = await restaurarCasoSensivel({
      municipioId: request.user.municipioId,
      id: request.params.id,
      utilizadorId: request.user.sub,
    });
    return reply.send({ success: true, data: caso });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao restaurar caso sensível");
  }
}

/** Requer permissão própria (ex.: acao-social:casos-sensiveis:eliminados) — ver README. */
export async function listarCasosSensiveisEliminadosController(request: FastifyRequest, reply: FastifyReply) {
  const casos = await listarCasosSensiveisEliminados({ municipioId: request.user.municipioId, utilizadorId: request.user.sub });
  return reply.send({ success: true, data: casos });
}
