import type { FastifyInstance } from "fastify";
import {
  criarServicoController,
  actualizarServicoController,
  activarServicoController,
  desactivarServicoController,
  removerServicoController,
  listarServicosController,
  obterServicoController,
  listarServicosPublicoController,
} from "./servico.controller.js";
import {
  criarServicoSchema,
  actualizarServicoSchema,
  listarServicosQuerySchema,
  listarServicosPublicoQuerySchema,
} from "./servico.schema.js";
import type { CriarServicoInput, ActualizarServicoInput, ListarServicosQuery, ListarServicosPublicoQuery } from "./servico.schema.js";
import {
  criarServicoDocs,
  actualizarServicoDocs,
  activarServicoDocs,
  desactivarServicoDocs,
  removerServicoDocs,
  listarServicosDocs,
  obterServicoDocs,
  listarServicosPublicoDocs,
} from "./servico.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function servicosRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarServicosPublicoQuery }>(
    "/servicos/publico",
    { ...listarServicosPublicoDocs, preHandler: [validateQuery(listarServicosPublicoQuerySchema)] },
    listarServicosPublicoController
  );

  fastify.get<{ Querystring: ListarServicosQuery }>(
    "/servicos",
    { ...listarServicosDocs, preHandler: [fastify.authenticate, requirePermission("servicos:consultar"), validateQuery(listarServicosQuerySchema)] },
    listarServicosController
  );

  fastify.get<{ Params: { id: string } }>(
    "/servicos/:id",
    { ...obterServicoDocs, preHandler: [fastify.authenticate, requirePermission("servicos:consultar")] },
    obterServicoController
  );

  fastify.post<{ Body: CriarServicoInput }>(
    "/servicos",
    { ...criarServicoDocs, preHandler: [fastify.authenticate, requirePermission("servicos:gerir"), validateBody(criarServicoSchema)] },
    criarServicoController
  );

  fastify.patch<{ Params: { id: string }; Body: ActualizarServicoInput }>(
    "/servicos/:id",
    { ...actualizarServicoDocs, preHandler: [fastify.authenticate, requirePermission("servicos:gerir"), validateBody(actualizarServicoSchema)] },
    actualizarServicoController
  );

  fastify.post<{ Params: { id: string } }>(
    "/servicos/:id/activar",
    { ...activarServicoDocs, preHandler: [fastify.authenticate, requirePermission("servicos:gerir")] },
    activarServicoController
  );

  fastify.post<{ Params: { id: string } }>(
    "/servicos/:id/desactivar",
    { ...desactivarServicoDocs, preHandler: [fastify.authenticate, requirePermission("servicos:gerir")] },
    desactivarServicoController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/servicos/:id",
    { ...removerServicoDocs, preHandler: [fastify.authenticate, requirePermission("servicos:gerir")] },
    removerServicoController
  );
}