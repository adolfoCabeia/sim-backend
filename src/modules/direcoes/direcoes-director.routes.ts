import type { FastifyInstance } from "fastify";
import {
  listarCandidatosADirectorController,
  definirDirectorController,
} from "./direcoes-director.controller.js";
import { definirDirectorSchema } from "./direcoes-diretor.schema.js";
import type { DefinirDirectorInput } from "./direcoes-diretor.schema.js";
import { listarCandidatosADirectorDocs, definirDirectorDocs } from "./direcoes-director.docs.js";
import { validateBody } from "../../utils/validate.js";
import { requireAnyPermission } from "../../middleware/hasPermission.js";

/** Registar junto do direcoesRoutes: fastify.register(direcoesDirectorRoutes). */
export async function direcoesDirectorRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string }; Querystring: { search?: string } }>(
    "/direcoes/:id/candidatos-a-director",
    {
      ...listarCandidatosADirectorDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("direcoes:gerir")],
    },
    listarCandidatosADirectorController
  );

  fastify.patch<{ Params: { id: string }; Body: DefinirDirectorInput }>(
    "/direcoes/:id/director",
    {
      ...definirDirectorDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("direcoes:gerir"),
        validateBody(definirDirectorSchema),
      ],
    },
    definirDirectorController
  );
}