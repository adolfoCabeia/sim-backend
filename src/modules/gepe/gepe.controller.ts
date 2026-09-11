import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./gepe.service.js";
import { listarPlanosQuerySchema } from "./gepe.schema.js";
import type {
  CriarPlanoInput,
  AtualizarPlanoInput,
  RejeitarPlanoInput,
  ListarPlanosQuery,
} from "./gepe.schema.js";

function tratarErro(reply: FastifyReply, error: unknown) {
  if (error instanceof service.TransicaoInvalidaError) {
    return reply.status(409).send({ error: error.message });
  }
  throw error;
}

export async function criarController(req: FastifyRequest<{ Body: CriarPlanoInput }>, reply: FastifyReply) {
  const plano = await service.criarPlano(req.user.municipioId, req.user.sub, req.body);
  return reply.status(201).send(plano);
}

export async function listarController(req: FastifyRequest<{ Querystring: ListarPlanosQuery }>, reply: FastifyReply) {
  const query = listarPlanosQuerySchema.parse(req.query);
  const resultado = await service.listarPlanos(
    { municipioId: req.user.municipioId, tipo: query.tipo, estado: query.estado },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(resultado);
}

export async function obterController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const plano = await service.obterPlano(req.params.id, req.user.municipioId);
  if (!plano) return reply.status(404).send({ error: "Plano não encontrado" });
  return reply.send(plano);
}

export async function atualizarController(
  req: FastifyRequest<{ Params: { id: string }; Body: AtualizarPlanoInput }>,
  reply: FastifyReply
) {
  try {
    const plano = await service.atualizarPlano(req.params.id, req.user.municipioId, req.body);
    return reply.send(plano);
  } catch (error) {
    return tratarErro(reply, error);
  }
}

export async function removerController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await service.removerPlano(req.params.id, req.user.municipioId);
    return reply.status(204).send();
  } catch (error) {
    return tratarErro(reply, error);
  }
}

export async function submeterController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const plano = await service.submeterPlano(req.params.id, req.user.municipioId, req.user.sub);
    return reply.send(plano);
  } catch (error) {
    return tratarErro(reply, error);
  }
}

export async function aprovarController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const plano = await service.aprovarPlano(req.params.id, req.user.municipioId, req.user.sub);
    return reply.send(plano);
  } catch (error) {
    return tratarErro(reply, error);
  }
}

export async function rejeitarController(
  req: FastifyRequest<{ Params: { id: string }; Body: RejeitarPlanoInput }>,
  reply: FastifyReply
) {
  try {
    const plano = await service.rejeitarPlano(req.params.id, req.user.municipioId, req.user.sub, req.body);
    return reply.send(plano);
  } catch (error) {
    return tratarErro(reply, error);
  }
}

export async function investimentosPublicosController(req: FastifyRequest, reply: FastifyReply) {
  const investimentos = await service.listarInvestimentosPublicos(req.user.municipioId);
  return reply.send(investimentos);
}