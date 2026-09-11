import type { FastifyInstance } from "fastify";
import {
  registarPontoController,
  registarPontoManualController,
  listarRegistosPontoController,
  obterUltimoRegistoController,
} from "./ponto.controller.js";
import {
  registarPontoDocs,
  registarPontoManualDocs,
  listarRegistosPontoDocs,
  obterUltimoRegistoDocs,
} from "./ponto.docs.js";
import { registarPontoSchema, registarPontoManualSchema } from "./ponto.schema.js";
import type { RegistarPontoInput, RegistarPontoManualInput, ListarRegistosPontoQuery } from "./ponto.schema.js";
import { validateBody } from "../../../utils/validate.js";
import { requirePermission } from "../../../middleware/hasPermission.js";

export async function pontoRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegistarPontoInput }>(
    "/rh/ponto",
    {
      ...registarPontoDocs,
      preHandler: [fastify.authenticate, validateBody(registarPontoSchema)],
    },
    registarPontoController
  );

  fastify.post<{ Body: RegistarPontoManualInput }>(
    "/rh/ponto/manual",
    {
      ...registarPontoManualDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("funcionarios:gerir"),
        validateBody(registarPontoManualSchema),
      ],
    },
    registarPontoManualController
  );

  fastify.get<{ Querystring: ListarRegistosPontoQuery }>(
    "/rh/ponto",
    {
      ...listarRegistosPontoDocs,
      preHandler: [fastify.authenticate, requirePermission("funcionarios:consultar")],
    },
    listarRegistosPontoController
  );

  fastify.get<{ Params: { funcionarioId: string } }>(
    "/rh/ponto/:funcionarioId/ultimo-hoje",
    {
      ...obterUltimoRegistoDocs,
      preHandler: [fastify.authenticate, requirePermission("funcionarios:consultar")],
    },
    obterUltimoRegistoController
  );
}