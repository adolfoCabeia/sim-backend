import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./manutencao.service.js";
import {
  manutencaoCreateSchema,
  manutencaoUpdateSchema,
  manutencaoParamsSchema,
  listarManutencaoQuerySchema,
  concluirManutencaoSchema,
} from "./manutencao.schema.js";
import type {
  ManutencaoCreateInput,
  ManutencaoUpdateInput,
  ListarManutencaoQuery,
  ConcluirManutencaoInput,
} from "./manutencao.schema.js";

export async function listarController(req: FastifyRequest<{ Querystring: ListarManutencaoQuery }>, reply: FastifyReply) {
  const query = listarManutencaoQuerySchema.parse(req.query);
  const municipioId = query.municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const result = await service.listar(
    {
      municipioId,
      bemId: query.bemId,
      tipoManutencao: query.tipoManutencao,
      estado: query.estado,
      proximas: query.proximas === "true",
    },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(result);
}

export async function obterController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = manutencaoParamsSchema.parse(req.params);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.obter(id, municipioId);
  if (!item) return reply.status(404).send({ error: "Manutenção não encontrada" });
  return reply.send(item);
}

export async function criarController(req: FastifyRequest<{ Body: ManutencaoCreateInput }>, reply: FastifyReply) {
  const dados = manutencaoCreateSchema.parse(req.body);
  const municipioId = dados.municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.criar(municipioId, dados);
  return reply.status(201).send(item);
}

export async function atualizarController(req: FastifyRequest<{ Params: { id: string }; Body: ManutencaoUpdateInput }>, reply: FastifyReply) {
  const { id } = manutencaoParamsSchema.parse(req.params);
  const dados = manutencaoUpdateSchema.parse(req.body);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.atualizar(id, municipioId, dados);
  return reply.send(item);
}

export async function removerController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = manutencaoParamsSchema.parse(req.params);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  await service.remover(id, municipioId);
  return reply.status(204).send();
}

export async function concluirController(req: FastifyRequest<{ Params: { id: string }; Body: ConcluirManutencaoInput }>, reply: FastifyReply) {
  const { id } = manutencaoParamsSchema.parse(req.params);
  const dados = concluirManutencaoSchema.parse(req.body);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.concluir(id, municipioId, dados);
  return reply.send(item);
}

export async function alertasController(req: FastifyRequest, reply: FastifyReply) {
  const municipioId = (req.query as any).municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const alertas = await service.listarAlertas(municipioId);
  return reply.send(alertas);
}