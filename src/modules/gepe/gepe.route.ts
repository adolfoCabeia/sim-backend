import type { FastifyInstance } from "fastify";
import * as controller from "./gepe.controller.js";
import * as docs from "./gepe.docs.js";
import { criarPlanoSchema, atualizarPlanoSchema, rejeitarPlanoSchema } from "./gepe.schema.js";
import type {
  CriarPlanoInput,
  AtualizarPlanoInput,
  RejeitarPlanoInput,
  ListarPlanosQuery,
} from "./gepe.schema.js";
import { validateBody } from "../../utils/validate.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function gepeRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CriarPlanoInput }>(
    "/gepe/planos",
    { ...docs.criarPlanoDocs, preHandler: [fastify.authenticate, requirePermission("gepe:criar"), validateBody(criarPlanoSchema)] },
    controller.criarController
  );

  fastify.get<{ Querystring: ListarPlanosQuery }>(
    "/gepe/planos",
    { ...docs.listarPlanosDocs, preHandler: [fastify.authenticate, requirePermission("gepe:consultar")] },
    controller.listarController
  );

  fastify.get<{ Params: { id: string } }>(
    "/gepe/planos/:id",
    { ...docs.obterPlanoDocs, preHandler: [fastify.authenticate, requirePermission("gepe:consultar")] },
    controller.obterController
  );

  fastify.patch<{ Params: { id: string }; Body: AtualizarPlanoInput }>(
    "/gepe/planos/:id",
    { ...docs.atualizarPlanoDocs, preHandler: [fastify.authenticate, requirePermission("gepe:criar"), validateBody(atualizarPlanoSchema)] },
    controller.atualizarController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/gepe/planos/:id",
    { ...docs.removerPlanoDocs, preHandler: [fastify.authenticate, requirePermission("gepe:criar")] },
    controller.removerController
  );

  fastify.post<{ Params: { id: string } }>(
    "/gepe/planos/:id/submeter",
    { ...docs.submeterPlanoDocs, preHandler: [fastify.authenticate, requirePermission("gepe:criar")] },
    controller.submeterController
  );
  fastify.post<{ Params: { id: string } }>(
    "/gepe/planos/:id/aprovar",
    { ...docs.aprovarPlanoDocs, preHandler: [fastify.authenticate, requirePermission("gepe:aprovar")] },
    controller.aprovarController
  );

  fastify.post<{ Params: { id: string }; Body: RejeitarPlanoInput }>(
    "/gepe/planos/:id/rejeitar",
    {
      ...docs.rejeitarPlanoDocs,
      preHandler: [fastify.authenticate, requirePermission("gepe:aprovar"), validateBody(rejeitarPlanoSchema)],
    },
    controller.rejeitarController
  );

  fastify.get(
    "/gepe/investimentos-publicos",
    { ...docs.investimentosPublicosDocs, preHandler: [fastify.authenticate, requirePermission("gepe:consultar")] },
    controller.investimentosPublicosController
  );
}