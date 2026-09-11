import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarPrograma,
  obterPrograma,
  atualizarPrograma,
  inscreverParticipante,
  removerParticipante,
  listarProgramas,
  ProgramaNaoEncontradoError,
  BeneficiarioNaoEncontradoError,
  ParticipanteJaInscritoError,
} from "./programa.service.js";
import type {
  CriarProgramaInput,
  AtualizarProgramaInput,
  InscreverParticipanteInput,
  ListarProgramasQuery,
} from "./programa.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof ProgramaNaoEncontradoError || error instanceof BeneficiarioNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof ParticipanteJaInscritoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarProgramaController(request: FastifyRequest<{ Body: CriarProgramaInput }>, reply: FastifyReply) {
  const programa = await criarPrograma({ municipioId: request.user.municipioId, input: request.body });
  return reply.status(201).send({ success: true, data: programa });
}

export async function obterProgramaController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const programa = await obterPrograma({ municipioId: request.user.municipioId, id: request.params.id });
    return reply.send({ success: true, data: programa });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter programa");
  }
}

export async function atualizarProgramaController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtualizarProgramaInput }>,
  reply: FastifyReply
) {
  try {
    const programa = await atualizarPrograma({ municipioId: request.user.municipioId, id: request.params.id, input: request.body });
    return reply.send({ success: true, data: programa });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao atualizar programa");
  }
}

export async function inscreverParticipanteController(
  request: FastifyRequest<{ Params: { id: string }; Body: InscreverParticipanteInput }>,
  reply: FastifyReply
) {
  try {
    const participante = await inscreverParticipante({
      municipioId: request.user.municipioId,
      programaId: request.params.id,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: participante });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao inscrever participante");
  }
}

export async function removerParticipanteController(
  request: FastifyRequest<{ Params: { id: string; participanteId: string } }>,
  reply: FastifyReply
) {
  try {
    await removerParticipante({
      municipioId: request.user.municipioId,
      programaId: request.params.id,
      participanteId: request.params.participanteId,
    });
    return reply.send({ success: true, data: null });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao remover participante");
  }
}

export async function listarProgramasController(
  request: FastifyRequest<{ Querystring: ListarProgramasQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarProgramas({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}
