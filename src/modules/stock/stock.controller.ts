import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./stock.service.js";
import {
  itemStockCreateSchema,
  itemStockUpdateSchema,
  itemStockParamsSchema,
  listarItensQuerySchema,
  movimentoStockCreateSchema,
  listarMovimentosQuerySchema,
} from "./stock.schema.js";
import type {
  ItemStockCreateInput,
  ItemStockUpdateInput,
  ListarItensQuery,
  MovimentoStockCreateInput,
  ListarMovimentosQuery,
} from "./stock.schema.js";

function obterUtilizadorId(req: FastifyRequest): string | undefined {
  return (req as any).user?.sub;
}

// ─── ItemStock ───

export async function listarItensController(req: FastifyRequest<{ Querystring: ListarItensQuery }>, reply: FastifyReply) {
  const query = listarItensQuerySchema.parse(req.query);
  const municipioId = query.municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const result = await service.listarItensStock(
    {
      municipioId,
      categoria: query.categoria,
      abaixoMinimo: query.abaixoMinimo === "true",
    },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(result);
}

export async function obterItemController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = itemStockParamsSchema.parse(req.params);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.obterItemStock(id, municipioId);
  if (!item) return reply.status(404).send({ error: "Item não encontrado" });
  return reply.send(item);
}

export async function criarItemController(req: FastifyRequest<{ Body: ItemStockCreateInput }>, reply: FastifyReply) {
  const dados = itemStockCreateSchema.parse(req.body);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const utilizadorId = obterUtilizadorId(req);
  if (!utilizadorId) return reply.status(401).send({ error: "Utilizador não autenticado" });

  const item = await service.criarItemStock(municipioId, dados, utilizadorId);
  return reply.status(201).send(item);
}

export async function atualizarItemController(req: FastifyRequest<{ Params: { id: string }; Body: ItemStockUpdateInput }>, reply: FastifyReply) {
  const { id } = itemStockParamsSchema.parse(req.params);
  const dados = itemStockUpdateSchema.parse(req.body);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const utilizadorId = obterUtilizadorId(req);
  if (!utilizadorId) return reply.status(401).send({ error: "Utilizador não autenticado" });

  const item = await service.atualizarItemStock(id, municipioId, dados, utilizadorId);
  return reply.send(item);
}

export async function removerItemController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = itemStockParamsSchema.parse(req.params);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const utilizadorId = obterUtilizadorId(req);
  if (!utilizadorId) return reply.status(401).send({ error: "Utilizador não autenticado" });

  await service.removerItemStock(id, municipioId, utilizadorId);
  return reply.status(204).send();
}

// ─── Alertas ───

export async function listarAlertasController(req: FastifyRequest, reply: FastifyReply) {
  const municipioId = (req.query as any).municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const alertas = await service.listarAlertasReposicao(municipioId);
  return reply.send(alertas);
}

// ─── Movimentos ───

export async function listarMovimentosController(req: FastifyRequest<{ Querystring: ListarMovimentosQuery }>, reply: FastifyReply) {
  const query = listarMovimentosQuerySchema.parse(req.query);
  const municipioId = query.municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const result = await service.listarMovimentosStock(
    {
      municipioId,
      itemStockId: query.itemStockId,
      tipo: query.tipo,
      desde: query.desde ? new Date(query.desde) : undefined,
      ate: query.ate ? new Date(query.ate) : undefined,
    },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(result);
}

export async function criarMovimentoController(req: FastifyRequest<{ Body: MovimentoStockCreateInput }>, reply: FastifyReply) {
  const dados = movimentoStockCreateSchema.parse(req.body);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const utilizadorId = obterUtilizadorId(req);
  if (!utilizadorId) return reply.status(401).send({ error: "Utilizador não autenticado" });

  const movimento = await service.criarMovimentoStock(municipioId, { ...dados, utilizadorId });
  return reply.status(201).send(movimento);
}