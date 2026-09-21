import type { FastifyInstance } from "fastify";
import * as controller from "./biblioteca.controller.js";
import * as docs from "./biblioteca.docs.js";
import { criarDiplomaSchema, atualizarDiplomaSchema } from "./biblioteca.schema.js";
import type { CriarDiplomaInput, AtualizarDiplomaInput, PesquisarDiplomasQuery } from "./biblioteca.schema.js";
import { validateBody } from "../../utils/validate.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function bibliotecaJuridicaRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CriarDiplomaInput }>(
    "/biblioteca-juridica",
    {
      ...docs.criarDiplomaDocs,
      preHandler: [fastify.authenticate, requirePermission("juridico:editar"), validateBody(criarDiplomaSchema)],
    },
    controller.criarController
  );

  fastify.get<{ Querystring: PesquisarDiplomasQuery }>(
    "/biblioteca-juridica",
    { ...docs.pesquisarDiplomasDocs, preHandler: [fastify.authenticate, requirePermission("juridico:consultar")] },
    controller.pesquisarController
  );

  fastify.get<{ Params: { id: string } }>(
    "/biblioteca-juridica/:id",
    { ...docs.obterDiplomaDocs, preHandler: [fastify.authenticate, requirePermission("juridico:consultar")] },
    controller.obterController
  );

  fastify.patch<{ Params: { id: string }; Body: AtualizarDiplomaInput }>(
    "/biblioteca-juridica/:id",
    {
      ...docs.atualizarDiplomaDocs,
      preHandler: [fastify.authenticate, requirePermission("juridico:editar"), validateBody(atualizarDiplomaSchema)],
    },
    controller.atualizarController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/biblioteca-juridica/:id",
    { ...docs.removerDiplomaDocs, preHandler: [fastify.authenticate, requirePermission("juridico:editar")] },
    controller.removerController
  );
}