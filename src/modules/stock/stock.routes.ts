import type { FastifyInstance } from "fastify";
import {
  listarItensController,
  obterItemController,
  criarItemController,
  atualizarItemController,
  removerItemController,
  listarAlertasController,
  listarMovimentosController,
  criarMovimentoController,
} from "./stock.controller.js";
import {
  itemStockCreateSchema,
  itemStockUpdateSchema,
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
import { requirePermission } from "../../middleware/hasPermission.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import {
  listarItensDocs,
  obterItemDocs,
  criarItemDocs,
  atualizarItemDocs,
  removerItemDocs,
  listarAlertasDocs,
  listarMovimentosDocs,
  criarMovimentoDocs,
} from "./stock.docs.js";

export async function stockRoutes(fastify: FastifyInstance) {
  // ─── Itens ───
  fastify.get<{ Querystring: ListarItensQuery }>(
    "/itens",
    {
      ...listarItensDocs,
      preHandler: [fastify.authenticate, requirePermission("stock:consultar"), validateQuery(listarItensQuerySchema)],
    },
    listarItensController
  );

  fastify.get<{ Params: { id: string } }>(
    "/itens/:id",
    { ...obterItemDocs, preHandler: [fastify.authenticate, requirePermission("stock:consultar")] },
    obterItemController
  );

  fastify.post<{ Body: ItemStockCreateInput }>(
    "/itens",
    {
      ...criarItemDocs,
      preHandler: [fastify.authenticate, requirePermission("stock:gerir"), validateBody(itemStockCreateSchema)],
    },
    criarItemController
  );

  fastify.put<{ Params: { id: string }; Body: ItemStockUpdateInput }>(
    "/itens/:id",
    {
      ...atualizarItemDocs,
      preHandler: [fastify.authenticate, requirePermission("stock:gerir"), validateBody(itemStockUpdateSchema)],
    },
    atualizarItemController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/itens/:id",
    { ...removerItemDocs, preHandler: [fastify.authenticate, requirePermission("stock:gerir")] },
    removerItemController
  );

  // ─── Alertas ───
  fastify.get(
    "/alertas",
    { ...listarAlertasDocs, preHandler: [fastify.authenticate, requirePermission("stock:consultar")] },
    listarAlertasController
  );

  // ─── Movimentos ───
  fastify.get<{ Querystring: ListarMovimentosQuery }>(
    "/movimentos",
    {
      ...listarMovimentosDocs,
      preHandler: [fastify.authenticate, requirePermission("stock:consultar"), validateQuery(listarMovimentosQuerySchema)],
    },
    listarMovimentosController
  );

  fastify.post<{ Body: MovimentoStockCreateInput }>(
    "/movimentos",
    {
      ...criarMovimentoDocs,
      preHandler: [fastify.authenticate, requirePermission("stock:gerir"), validateBody(movimentoStockCreateSchema)],
    },
    criarMovimentoController
  );
}   