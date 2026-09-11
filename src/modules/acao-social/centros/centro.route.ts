import type { FastifyInstance } from "fastify";
import {
  listarCentrosController,
  obterCentroController,
  criarCentroController,
  atualizarCentroController,
} from "./centro.controller.js";
import {
  criarCentroSchema,
  atualizarCentroSchema,
} from "./centro.schema.js";
import type {
  CriarCentroInput,
  AtualizarCentroInput,
  ListarCentrosQuery,
} from "./centro.schema.js";
import {
  listarCentrosDocs,
  obterCentroDocs,
  criarCentroDocs,
  atualizarCentroDocs,
} from "./centro.docs.js";
import { validateBody } from "../../../utils/validate.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function centrosRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarCentrosQuery }>(
    "/centros",
    {
      ...listarCentrosDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:centros:consultar"),
      ],
    },
    listarCentrosController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/centros/:id",
    { ...obterCentroDocs, preHandler: [fastify.authenticate] },
    obterCentroController,
  );

  fastify.post<{ Body: CriarCentroInput }>(
    "/centros",
    {
      ...criarCentroDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:centros:gerir"),
        validateBody(criarCentroSchema),
      ],
    },
    criarCentroController,
  );

  fastify.put<{ Params: { id: string }; Body: AtualizarCentroInput }>(
    "/centros/:id",
    {
      ...atualizarCentroDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:centros:gerir"),
        validateBody(atualizarCentroSchema),
      ],
    },
    atualizarCentroController,
  );
}