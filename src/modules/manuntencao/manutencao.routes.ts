import type { FastifyInstance } from "fastify";
import {
  listarController,
  obterController,
  criarController,
  atualizarController,
  removerController,
  concluirController,
  alertasController,
} from "./manutencao.controller.js";
import {
  manutencaoCreateSchema,
  manutencaoUpdateSchema,
  listarManutencaoQuerySchema,
  concluirManutencaoSchema,
} from "./manutencao.schema.js";
import type {
  ManutencaoCreateInput,
  ManutencaoUpdateInput,
  ListarManutencaoQuery,
  ConcluirManutencaoInput,
} from "./manutencao.schema.js";
import { requirePermission } from "../../middleware/hasPermission.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import {
  listarDocs,
  obterDocs,
  criarDocs,
  atualizarDocs,
  removerDocs,
  concluirDocs,
  alertasDocs,
} from "./manutencao.docs.js";

export async function manutencaoRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarManutencaoQuery }>(
    "/manutencao",
    {
      ...listarDocs,
      preHandler: [fastify.authenticate, requirePermission("manutencao:consultar"), validateQuery(listarManutencaoQuerySchema)],
    },
    listarController
  );

  fastify.get(
    "/manutencao/alertas",
    { ...alertasDocs, preHandler: [fastify.authenticate, requirePermission("manutencao:consultar")] },
    alertasController
  );

  fastify.get<{ Params: { id: string } }>(
    "/manutencao/:id",
    { ...obterDocs, preHandler: [fastify.authenticate, requirePermission("manutencao:consultar")] },
    obterController
  );

  fastify.post<{ Body: ManutencaoCreateInput }>(
    "/manutencao",
    {
      ...criarDocs,
      preHandler: [fastify.authenticate, requirePermission("manutencao:gerir"), validateBody(manutencaoCreateSchema)],
    },
    criarController
  );

  fastify.put<{ Params: { id: string }; Body: ManutencaoUpdateInput }>(
    "/manutencao/:id",
    {
      ...atualizarDocs,
      preHandler: [fastify.authenticate, requirePermission("manutencao:gerir"), validateBody(manutencaoUpdateSchema)],
    },
    atualizarController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/manutencao/:id",
    { ...removerDocs, preHandler: [fastify.authenticate, requirePermission("manutencao:gerir")] },
    removerController
  );

  fastify.post<{ Params: { id: string }; Body: ConcluirManutencaoInput }>(
    "/manutencao/:id/concluir",
    {
      ...concluirDocs,
      preHandler: [fastify.authenticate, requirePermission("manutencao:gerir"), validateBody(concluirManutencaoSchema)],
    },
    concluirController
  );
}