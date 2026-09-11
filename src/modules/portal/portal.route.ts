import type { FastifyInstance } from "fastify";
import {
  listarServicosDisponiveisController,
  obterCapacidadesPortalController,
  criarPedidoPortalController,
  listarMeusProcessosController,
  obterMeuProcessoController,
  obterDocumentoFinalController,
  obterResumoMeusProcessosController,
} from "./portal.controller.js";
import { criarPedidoPortalSchema, listarMeusProcessosQuerySchema, listarServicosPortalQuerySchema } from "./portal.schema.js";
import type { CriarPedidoPortalInput, ListarMeusProcessosQuery, ListarServicosPortalQuery } from "./portal.schema.js";
import {
  listarServicosDisponiveisDocs,
  obterCapacidadesPortalDocs,
  criarPedidoPortalDocs,
  listarMeusProcessosDocs,
  obterMeuProcessoDocs,
  obterDocumentoFinalDocs,
  obterResumoMeusProcessosDocs,
} from "./portal.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function portalRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarServicosPortalQuery }>(
    "/portal/servicos",
    {
      ...listarServicosDisponiveisDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:criar"),
        validateQuery(listarServicosPortalQuerySchema),
      ],
    },
    listarServicosDisponiveisController
  );

  fastify.get(
    "/portal/capacidades",
    { ...obterCapacidadesPortalDocs, preHandler: [fastify.authenticate] },
    obterCapacidadesPortalController
  );

  fastify.post<{ Body: CriarPedidoPortalInput }>(
    "/portal/processos",
    {
      ...criarPedidoPortalDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:criar"), validateBody(criarPedidoPortalSchema)],
    },
    criarPedidoPortalController
  );

  fastify.get<{ Querystring: ListarMeusProcessosQuery }>(
    "/portal/processos",
    {
      ...listarMeusProcessosDocs,
      preHandler: [fastify.authenticate, requirePermission("portal_municipe:consultar_processo"), validateQuery(listarMeusProcessosQuerySchema)],
    },
    listarMeusProcessosController
  );

  fastify.get<{ Params: { id: string } }>(
    "/portal/processos/:id",
    { ...obterMeuProcessoDocs, preHandler: [fastify.authenticate, requirePermission("portal_municipe:consultar_processo")] },
    obterMeuProcessoController
  );

  fastify.get(
  "/portal/processos/resumo",
  { ...obterResumoMeusProcessosDocs, preHandler: [fastify.authenticate] },
  obterResumoMeusProcessosController
);

  fastify.get<{ Params: { id: string } }>(
    "/portal/processos/:id/documento",
    { ...obterDocumentoFinalDocs, preHandler: [fastify.authenticate, requirePermission("portal_municipe:consultar_processo")] },
    obterDocumentoFinalController
  );
}