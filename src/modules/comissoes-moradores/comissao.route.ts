import type { FastifyInstance } from "fastify";
import * as controller from "./comissao.controller.js";
import * as docs from "./comissao.docs.js";
import {
  comissaoCreateSchema,
  comissaoUpdateSchema,
  alterarEstadoComissaoSchema,
  adicionarMembroSchema,
} from "./comissao.schema.js";
import type {
  ComissaoCreateInput,
  ComissaoUpdateInput,
  AlterarEstadoComissaoInput,
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

  // NOVO: transição de estado isolada da actualização de dados operacionais.
  fastify.patch<{ Params: { id: string }; Body: AlterarEstadoComissaoInput }>(
    "/comissoes-moradores/:id/estado",
    {
      ...docs.alterarEstadoComissaoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("comissoes-moradores:gerir"),
        validateBody(alterarEstadoComissaoSchema),
      ],
    },
    controller.alterarEstadoController
  );

  // Agora é uma desactivação (soft-delete) internamente — ver comissao.service.ts.
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