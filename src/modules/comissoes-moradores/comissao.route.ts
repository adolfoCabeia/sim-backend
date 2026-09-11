import type { FastifyInstance } from "fastify";
import * as controller from "./comissao.controller.js";
import * as docs from "./comissao.docs.js";
import {
  comissaoCreateSchema,
  comissaoUpdateSchema,
  adicionarMembroSchema,
} from "./comissao.schema.js";
import type {
  ComissaoCreateInput,
  ComissaoUpdateInput,
  ListarComissoesQuery,
  AdicionarMembroInput,
} from "./comissao.schema.js";
import { validateBody } from "../../utils/validate.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function comissoesModeradoresRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarComissoesQuery }>(
    "/comissoes-moradores",
    {
      ...docs.listarComissoesDocs,
      preHandler: [fastify.authenticate, requirePermission("comissoes-moradores:consultar")],
    },
    controller.listarController
  );

  fastify.get<{ Params: { id: string } }>(
    "/comissoes-moradores/:id",
    {
      ...docs.obterComissaoDocs,
      preHandler: [fastify.authenticate, requirePermission("comissoes-moradores:consultar")],
    },
    controller.obterController
  );

  fastify.post<{ Body: ComissaoCreateInput }>(
    "/comissoes-moradores",
    {
      ...docs.criarComissaoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("comissoes-moradores:gerir"),
        validateBody(comissaoCreateSchema),
      ],
    },
    controller.criarController
  );

  fastify.patch<{ Params: { id: string }; Body: ComissaoUpdateInput }>(
    "/comissoes-moradores/:id",
    {
      ...docs.atualizarComissaoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("comissoes-moradores:gerir"),
        validateBody(comissaoUpdateSchema),
      ],
    },
    controller.atualizarController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/comissoes-moradores/:id",
    {
      ...docs.removerComissaoDocs,
      preHandler: [fastify.authenticate, requirePermission("comissoes-moradores:gerir")],
    },
    controller.removerController
  );

  fastify.post<{ Params: { id: string }; Body: AdicionarMembroInput }>(
    "/comissoes-moradores/:id/membros",
    {
      ...docs.adicionarMembroDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("comissoes-moradores:gerir"),
        validateBody(adicionarMembroSchema),
      ],
    },
    controller.adicionarMembroController
  );

  fastify.delete<{ Params: { id: string; membroId: string } }>(
    "/comissoes-moradores/:id/membros/:membroId",
    {
      ...docs.removerMembroDocs,
      preHandler: [fastify.authenticate, requirePermission("comissoes-moradores:gerir")],
    },
    controller.removerMembroController
  );
}