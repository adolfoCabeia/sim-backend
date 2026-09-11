import type { FastifyInstance } from "fastify";
import {
  listarDistribuicoesController,
  criarDistribuicaoKitController,
} from "./distribuicao-kit.controller.js";
import { criarDistribuicaoKitSchema } from "./distribuicao-kit.schema.js";
import type {
  CriarDistribuicaoKitInput,
  ListarDistribuicoesQuery,
} from "./distribuicao-kit.schema.js";
import {
  listarDistribuicoesDocs,
  criarDistribuicaoKitDocs,
} from "./distribuicao-kit.docs.js";
import { validateBody } from "../../../utils/validate.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function distribuicaoKitRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarDistribuicoesQuery }>(
    "/distribuicao-kits",
    {
      ...listarDistribuicoesDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:distribuicao:consultar"),
      ],
    },
    listarDistribuicoesController,
  );

  fastify.post<{ Body: CriarDistribuicaoKitInput }>(
    "/distribuicao-kits",
    {
      ...criarDistribuicaoKitDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:distribuicao:gerir"),
        validateBody(criarDistribuicaoKitSchema),
      ],
    },
    criarDistribuicaoKitController,
  );
}