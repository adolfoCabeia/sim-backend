import type { FastifyInstance } from "fastify";
import {
  listarPedidosApoioController,
  obterPedidoApoioController,
  criarPedidoApoioController,
  resolverPedidoApoioController,
  cancelarPedidoApoioController,
} from "./pedido-apoio.controller.js";
import {
  criarPedidoApoioSchema,
  resolverPedidoApoioSchema,
} from "./pedido-apoio.schema.js";
import type {
  CriarPedidoApoioInput,
  ResolverPedidoApoioInput,
  ListarPedidosApoioQuery,
} from "./pedido-apoio.schema.js";
import {
  listarPedidosApoioDocs,
  obterPedidoApoioDocs,
  criarPedidoApoioDocs,
  resolverPedidoApoioDocs,
  cancelarPedidoApoioDocs,
} from "./pedido-apoio.docs.js";
import { validateBody } from "../../../utils/validate.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function pedidosApoioRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarPedidosApoioQuery }>(
    "/pedidos-apoio",
    {
      ...listarPedidosApoioDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:pedidos:consultar"),
      ],
    },
    listarPedidosApoioController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/pedidos-apoio/:id",
    { ...obterPedidoApoioDocs, preHandler: [fastify.authenticate] },
    obterPedidoApoioController,
  );

  fastify.post<{ Body: CriarPedidoApoioInput }>(
    "/pedidos-apoio",
    {
      ...criarPedidoApoioDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:pedidos:gerir"),
        validateBody(criarPedidoApoioSchema),
      ],
    },
    criarPedidoApoioController,
  );

  fastify.put<{ Params: { id: string }; Body: ResolverPedidoApoioInput }>(
    "/pedidos-apoio/:id/resolver",
    {
      ...resolverPedidoApoioDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:pedidos:resolver"),
        validateBody(resolverPedidoApoioSchema),
      ],
    },
    resolverPedidoApoioController,
  );

  fastify.delete<{ Params: { id: string } }>(
    "/pedidos-apoio/:id",
    {
      ...cancelarPedidoApoioDocs,
      preHandler: [fastify.authenticate],
    },
    cancelarPedidoApoioController,
  );
}