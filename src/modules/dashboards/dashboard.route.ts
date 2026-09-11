import type { FastifyInstance } from "fastify";
import * as controller from "./dashboard.controller.js";
import * as docs from "./dashboard.docs.js";
import type { DashboardDireccaoQuery } from "./dashboard.schema.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function dashboardsRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: DashboardDireccaoQuery }>(
    "/dashboards/minha-direccao",
    { ...docs.dashboardDireccaoDocs, preHandler: [fastify.authenticate] },
    controller.dashboardDireccaoController
  );

  fastify.get(
    "/dashboards/administrador",
    { ...docs.dashboardAdministradorDocs, preHandler: [fastify.authenticate, requirePermission("processos:despachar")] },
    controller.dashboardAdministradorController
  );

  fastify.get<{ Params: { municipioId: string } }>(
    "/dashboards/transparencia/:municipioId",
    { ...docs.painelTransparenciaDocs },
    controller.painelTransparenciaController
  );
}