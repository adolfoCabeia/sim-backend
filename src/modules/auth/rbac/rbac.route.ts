import type { FastifyInstance } from "fastify";
import {
  listarPerfisController,
  criarPerfilController,
  desactivarPerfilController,
  definirAcessoIlimitadoPontoController,
  listarPermissoesController,
  criarPermissaoController,
  associarPermissaoController,
  desassociarPermissaoController,
} from "./rbac.controller.js";
import { criarPerfilSchema, criarPermissaoSchema, associarPermissaoSchema, definirAcessoIlimitadoPontoSchema } from "./rbac.schema.js";
import type { CriarPerfilInput, CriarPermissaoInput, AssociarPermissaoInput, DefinirAcessoIlimitadoPontoInput } from "./rbac.schema.js";
import { requirePermission } from "../../../middleware/hasPermission.js";
import { validateBody } from "../../../utils/validate.js";
import {
  criarPerfilDocs,
  desactivarPerfilDocs,
  definirAcessoIlimitadoPontoDocs,
  criarPermissaoDocs,
  associarPermissaoDocs,
  desassociarPermissaoDocs,
} from "./rbac.docs.js";

interface ListarQuerystring {
  page?: string;
  pageSize?: string;
}

export async function rbacRoutes(fastify: FastifyInstance) {
  // ─── PERFIS ───
  fastify.get<{ Querystring: ListarQuerystring }>(
    "/perfis",
    {
      preHandler: [fastify.authenticate, requirePermission("perfis:gerir")],
    },
    listarPerfisController
  );

  fastify.post<{ Body: CriarPerfilInput }>(
    "/perfis",
    {
      ...criarPerfilDocs,
      preHandler: [fastify.authenticate, requirePermission("perfis:gerir"), validateBody(criarPerfilSchema)],
    },
    criarPerfilController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/perfis/:id",
    {
      ...desactivarPerfilDocs,
      preHandler: [fastify.authenticate, requirePermission("perfis:gerir")],
    },
    desactivarPerfilController
  );

  fastify.patch<{ Params: { id: string }; Body: DefinirAcessoIlimitadoPontoInput }>(
    "/perfis/:id/acesso-ilimitado-ponto",
    {
      ...definirAcessoIlimitadoPontoDocs,
      preHandler: [fastify.authenticate, requirePermission("perfis:gerir"), validateBody(definirAcessoIlimitadoPontoSchema)],
    },
    definirAcessoIlimitadoPontoController
  );

  // ─── PERMISSÕES ───
  fastify.get<{ Querystring: ListarQuerystring }>(
    "/permissoes",
    {
      preHandler: [fastify.authenticate, requirePermission("perfis:gerir")],
    },
    listarPermissoesController
  );

  fastify.post<{ Body: CriarPermissaoInput }>(
    "/permissoes",
    {
      ...criarPermissaoDocs,
      preHandler: [fastify.authenticate, requirePermission("perfis:gerir"), validateBody(criarPermissaoSchema)],
    },
    criarPermissaoController
  );

  // ─── ASSOCIAÇÕES ───
  fastify.post<{ Params: { id: string }; Body: AssociarPermissaoInput }>(
    "/perfis/:id/permissoes",
    {
      ...associarPermissaoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("perfis:gerir"),
        validateBody(associarPermissaoSchema),
      ],
    },
    associarPermissaoController
  );

  fastify.delete<{ Params: { id: string; permissaoId: string } }>(
    "/perfis/:id/permissoes/:permissaoId",
    {
      ...desassociarPermissaoDocs,
      preHandler: [fastify.authenticate, requirePermission("perfis:gerir")],
    },
    desassociarPermissaoController
  );
}