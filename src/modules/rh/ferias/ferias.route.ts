import type { FastifyInstance } from "fastify";
import {
  criarPedidoFeriasController,
  responderPedidoFeriasController,
  cancelarPedidoFeriasController,
  listarMeusPedidosFeriasController,
  listarPedidosFeriasController,
} from "./ferias.controller.js";
import {
  criarPedidoFeriasDocs,
  responderPedidoFeriasDocs,
  cancelarPedidoFeriasDocs,
  listarMeusPedidosFeriasDocs,
  listarPedidosFeriasDocs,
} from "./ferias.docs.js";
import {
  criarPedidoFeriasSchema,
  responderPedidoFeriasSchema,
} from "./ferias.schema.js";
import type {
  CriarPedidoFeriasInput,
  ResponderPedidoFeriasInput,
  ListarPedidosFeriasQuery,
} from "./ferias.schema.js";
import { validateBody } from "../../../utils/validate.js";
import { requirePermission } from "../../../middleware/hasPermission.js";

export async function feriasRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarPedidosFeriasQuery }>(
    "/ferias",
    {
      ...listarPedidosFeriasDocs,
      preHandler: [fastify.authenticate, requirePermission("ferias:aprovar")],
    },
    listarPedidosFeriasController,
  );

  fastify.get(
    "/ferias/minhas",
    {
      ...listarMeusPedidosFeriasDocs,
      preHandler: [fastify.authenticate],
    },
    listarMeusPedidosFeriasController,
  );

  fastify.post<{ Body: CriarPedidoFeriasInput }>(
    "/ferias",
    {
      ...criarPedidoFeriasDocs,
      preHandler: [fastify.authenticate, validateBody(criarPedidoFeriasSchema)],
    },
    criarPedidoFeriasController,
  );

  fastify.post<{ Params: { id: string } }>(
    "/ferias/:id/cancelar",
    {
      ...cancelarPedidoFeriasDocs,
      preHandler: [fastify.authenticate],
    },
    cancelarPedidoFeriasController,
  );

  fastify.post<{ Params: { id: string }; Body: ResponderPedidoFeriasInput }>(
    "/ferias/:id/responder",
    {
      ...responderPedidoFeriasDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("ferias:aprovar"),
        validateBody(responderPedidoFeriasSchema),
      ],
    },
    responderPedidoFeriasController,
  );
}