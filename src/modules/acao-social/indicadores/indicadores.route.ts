import type { FastifyInstance } from "fastify";
import { obterIndicadoresController } from "./indicadores.controller.js";
import { obterIndicadoresDocs } from "./indicadores.docs.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function indicadoresRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/indicadores",
    {
      ...obterIndicadoresDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:indicadores:consultar"),
      ],
    },
    obterIndicadoresController,
  );
}