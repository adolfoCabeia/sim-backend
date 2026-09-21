import type { FastifyInstance } from "fastify";
import {
  listarLogsController,
  obterLogController,
  exportarLogsController,
} from "./auditoria.controller.js";
import { requirePermission } from "../../middleware/hasPermission.js";
import { listarLogsDocs, obterLogDocs, exportarLogsDocs } from "./auditoria.docs.js";
import type { ListarLogsQuery, ExportarLogsQuery } from "./auditoria.schema.js";

export async function auditoriaRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarLogsQuery }>(
    "/auditoria/logs",
    {
      ...listarLogsDocs,
      preHandler: [fastify.authenticate, requirePermission("auditoria:consultar")],
    },
    listarLogsController
  );

  fastify.get<{ Params: { id: string } }>(
    "/auditoria/logs/:id",
    {
      ...obterLogDocs,
      preHandler: [fastify.authenticate, requirePermission("auditoria:consultar")],
    },
    obterLogController
  );

  fastify.get<{ Querystring: ExportarLogsQuery }>(
    "/auditoria/logs/exportar",
    {
      ...exportarLogsDocs,
      preHandler: [fastify.authenticate, requirePermission("auditoria:consultar")],
    },
    exportarLogsController
  );
}