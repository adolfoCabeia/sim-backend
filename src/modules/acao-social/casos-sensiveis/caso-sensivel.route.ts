import type { FastifyInstance } from "fastify";
import {
  listarCasosSensiveisController,
  obterCasoSensivelController,
  criarCasoSensivelController,
  atualizarCasoSensivelController,
  listarAcessosDoCasoController,
  eliminarCasoSensivelController,
  restaurarCasoSensivelController,
  listarCasosSensiveisEliminadosController,
} from "./caso-sensivel.controller.js";
import {
  criarCasoSensivelSchema,
  atualizarCasoSensivelSchema,
  eliminarCasoSensivelSchema,
} from "./caso-sensivel.schema.js";
import type {
  CriarCasoSensivelInput,
  AtualizarCasoSensivelInput,
  EliminarCasoSensivelInput,
  ListarCasosSensiveisQuery,
} from "./caso-sensivel.schema.js";
import {
  listarCasosSensiveisDocs,
  obterCasoSensivelDocs,
  criarCasoSensivelDocs,
  atualizarCasoSensivelDocs,
  listarAcessosDoCasoDocs,
  eliminarCasoSensivelDocs,
  restaurarCasoSensivelDocs,
  listarCasosSensiveisEliminadosDocs,
} from "./caso-sensivel.docs.js";
import { validateBody } from "../../../utils/validate.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function casosSensiveisRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarCasosSensiveisQuery }>(
    "/casos-sensiveis",
    {
      ...listarCasosSensiveisDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:consultar"),
      ],
    },
    listarCasosSensiveisController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/casos-sensiveis/:id",
    {
      ...obterCasoSensivelDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:consultar"),
      ],
    },
    obterCasoSensivelController,
  );

  fastify.post<{ Body: CriarCasoSensivelInput }>(
    "/casos-sensiveis",
    {
      ...criarCasoSensivelDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:gerir"),
        validateBody(criarCasoSensivelSchema),
      ],
    },
    criarCasoSensivelController,
  );

  fastify.put<{ Params: { id: string }; Body: AtualizarCasoSensivelInput }>(
    "/casos-sensiveis/:id",
    {
      ...atualizarCasoSensivelDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:gerir"),
        validateBody(atualizarCasoSensivelSchema),
      ],
    },
    atualizarCasoSensivelController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/casos-sensiveis/:id/acessos",
    {
      ...listarAcessosDoCasoDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:auditoria"),
      ],
    },
    listarAcessosDoCasoController,
  );

  fastify.delete<{ Params: { id: string }; Body: EliminarCasoSensivelInput }>(
    "/casos-sensiveis/:id",
    {
      ...eliminarCasoSensivelDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:gerir"),
        validateBody(eliminarCasoSensivelSchema),
      ],
    },
    eliminarCasoSensivelController,
  );

  fastify.post<{ Params: { id: string } }>(
    "/casos-sensiveis/:id/restaurar",
    {
      ...restaurarCasoSensivelDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:eliminados"),
      ],
    },
    restaurarCasoSensivelController,
  );

  fastify.get(
    "/casos-sensiveis/eliminados",
    {
      ...listarCasosSensiveisEliminadosDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:casos-sensiveis:eliminados"),
      ],
    },
    listarCasosSensiveisEliminadosController,
  );
}