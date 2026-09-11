import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarZonaSensivel,
  listarZonasSensiveis,
  criarBeneficiario,
  obterBeneficiario,
  atualizarBeneficiario,
  listarBeneficiarios,
  BeneficiarioNaoEncontradoError,
  ZonaSensivelNaoEncontradaError,
} from "./beneficiario.service.js";
import type {
  CriarZonaSensivelInput,
  CriarBeneficiarioInput,
  AtualizarBeneficiarioInput,
  ListarBeneficiariosQuery,
} from "./beneficiario.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof BeneficiarioNaoEncontradoError) return reply.status(404).send({ success: false, message: error.message });
  if (error instanceof ZonaSensivelNaoEncontradaError) return reply.status(400).send({ success: false, message: error.message });
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarZonaSensivelController(request: FastifyRequest<{ Body: CriarZonaSensivelInput }>, reply: FastifyReply) {
  const zona = await criarZonaSensivel({ municipioId: request.user.municipioId, input: request.body });
  return reply.status(201).send({ success: true, data: zona });
}

export async function listarZonasSensiveisController(request: FastifyRequest, reply: FastifyReply) {
  const zonas = await listarZonasSensiveis({ municipioId: request.user.municipioId });
  return reply.send({ success: true, data: zonas });
}

export async function criarBeneficiarioController(request: FastifyRequest<{ Body: CriarBeneficiarioInput }>, reply: FastifyReply) {
  try {
    const beneficiario = await criarBeneficiario({ municipioId: request.user.municipioId, input: request.body });
    return reply.status(201).send({ success: true, data: beneficiario });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar beneficiário");
  }
}

export async function obterBeneficiarioController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const beneficiario = await obterBeneficiario({ municipioId: request.user.municipioId, id: request.params.id });
    return reply.send({ success: true, data: beneficiario });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter beneficiário");
  }
}

export async function atualizarBeneficiarioController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtualizarBeneficiarioInput }>,
  reply: FastifyReply
) {
  try {
    const beneficiario = await atualizarBeneficiario({
      municipioId: request.user.municipioId,
      id: request.params.id,
      input: request.body,
    });
    return reply.send({ success: true, data: beneficiario });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao atualizar beneficiário");
  }
}

export async function listarBeneficiariosController(
  request: FastifyRequest<{ Querystring: ListarBeneficiariosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarBeneficiarios({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}
