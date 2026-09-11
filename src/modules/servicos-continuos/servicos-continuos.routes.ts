import type { FastifyInstance } from "fastify";
import {
  listarController,
  obterController,
  criarController,
  atualizarController,
  removerController,
  recarregarController,
  alertasController,
} from "./servicos-continuos.controller.js";
import {
  servicoContinuoCreateSchema,
  servicoContinuoUpdateSchema,
  listarServicosQuerySchema,
  recargaSchema,
} from "./servicos-continuos.schema.js";
import type {
  ServicoContinuoCreateInput,
  ServicoContinuoUpdateInput,
  ListarServicosQuery,
  RecargaInput,
} from "./servicos-continuos.schema.js";
import { requirePermission } from "../../middleware/hasPermission.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import {
  listarDocs,
  obterDocs,
  criarDocs,
  atualizarDocs,
  removerDocs,
  recargaDocs,
  alertasDocs,
} from "./servicos-continuos.docs.js";

export async function servicosContinuosRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarServicosQuery }>(
    "/servicos-continuos",
    {
      ...listarDocs,
      preHandler: [fastify.authenticate, requirePermission("servicos-continuos:consultar"), validateQuery(listarServicosQuerySchema)],
    },
    listarController
  );

  fastify.get(
    "/servicos-continuos/alertas",
    { ...alertasDocs, preHandler: [fastify.authenticate, requirePermission("servicos-continuos:consultar")] },
    alertasController
  );

  fastify.get<{ Params: { id: string } }>(
    "/servicos-continuos/:id",
    { ...obterDocs, preHandler: [fastify.authenticate, requirePermission("servicos-continuos:consultar")] },
    obterController
  );

  fastify.post<{ Body: ServicoContinuoCreateInput }>(
    "/servicos-continuos/",
    {
      ...criarDocs,
      preHandler: [fastify.authenticate, requirePermission("servicos-continuos:gerir"), validateBody(servicoContinuoCreateSchema)],
    },
    criarController
  );

  fastify.put<{ Params: { id: string }; Body: ServicoContinuoUpdateInput }>(
    "/servicos-continuos/:id",
    {
      ...atualizarDocs,
      preHandler: [fastify.authenticate, requirePermission("servicos-continuos:gerir"), validateBody(servicoContinuoUpdateSchema)],
    },
    atualizarController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/servicos-continuos/:id",
    { ...removerDocs, preHandler: [fastify.authenticate, requirePermission("servicos-continuos:gerir")] },
    removerController
  );

  fastify.post<{ Params: { id: string }; Body: RecargaInput }>(
    "/servicos-continuos/:id/recarga",
    {
      ...recargaDocs,
      preHandler: [fastify.authenticate, requirePermission("servicos-continuos:gerir"), validateBody(recargaSchema)],
    },
    recarregarController
  );
}