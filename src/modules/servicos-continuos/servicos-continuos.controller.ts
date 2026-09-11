import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./servicos-continuos.service.js";
import {
  servicoContinuoCreateSchema,
  servicoContinuoUpdateSchema,
  servicoContinuoParamsSchema,
  listarServicosQuerySchema,
  recargaSchema,
} from "./servicos-continuos.schema.js";
import type {
  ServicoContinuoCreateInput,
  ServicoContinuoUpdateInput,
  ListarServicosQuery,
  RecargaInput,
} from "./servicos-continuos.schema.js";

export async function listarController(req: FastifyRequest<{ Querystring: ListarServicosQuery }>, reply: FastifyReply) {
  const query = listarServicosQuerySchema.parse(req.query);
  const municipioId = query.municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const result = await service.listar(
    {
      municipioId,
      tipo: query.tipo,
      estado: query.estado,
      proximoVencimento: query.proximoVencimento === "true",
    },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(result);
}

export async function obterController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = servicoContinuoParamsSchema.parse(req.params);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.obter(id, municipioId);
  if (!item) return reply.status(404).send({ error: "Serviço não encontrado" });
  return reply.send(item);
}

export async function criarController(req: FastifyRequest<{ Body: ServicoContinuoCreateInput }>, reply: FastifyReply) {
  const dados = servicoContinuoCreateSchema.parse(req.body);
  const municipioId = dados.municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.criar(municipioId, dados);
  return reply.status(201).send(item);
}

export async function atualizarController(req: FastifyRequest<{ Params: { id: string }; Body: ServicoContinuoUpdateInput }>, reply: FastifyReply) {
  const { id } = servicoContinuoParamsSchema.parse(req.params);
  const dados = servicoContinuoUpdateSchema.parse(req.body);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.atualizar(id, municipioId, dados);
  return reply.send(item);
}

export async function removerController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = servicoContinuoParamsSchema.parse(req.params);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  await service.remover(id, municipioId);
  return reply.status(204).send();
}

export async function recarregarController(req: FastifyRequest<{ Params: { id: string }; Body: RecargaInput }>, reply: FastifyReply) {
  const { id } = servicoContinuoParamsSchema.parse(req.params);
  const dados = recargaSchema.parse(req.body);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.registrarRecarga(id, municipioId, dados);
  return reply.send(item);
}

export async function alertasController(req: FastifyRequest, reply: FastifyReply) {
  const municipioId = (req.query as any).municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const alertas = await service.listarAlertas(municipioId);
  return reply.send(alertas);
}