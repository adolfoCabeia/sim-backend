import type { FastifyInstance } from "fastify";
import {
  listarUtilizadoresController,
  obterUtilizadorController,
  criarUtilizadorController,
  editarUtilizadorController,
  alterarEstadoController,
  desactivarUtilizadorController,
  obterMeuPerfilController,
  editarMeuPerfilController,
  changePasswordController,
  redefinirPasswordController,
  listarPerfisDoUtilizadorController,
  atribuirPerfilController,
  revogarPerfilController,
  listarPerfisDisponiveisController,
  listarPermissoesDisponiveisController,
} from "./user.controller.js";
import {
  listarUtilizadoresQuerySchema,
  criarUtilizadorSchema,
  editarUtilizadorSchema,
  editarMeuPerfilSchema,
  alterarEstadoSchema,
  changePasswordSchema,
  atribuirPerfilSchema,
} from "./user.schema.js";
import type {
  ListarUtilizadoresQuery,
  CriarUtilizadorInput,
  EditarUtilizadorInput,
  EditarMeuPerfilInput,
  AlterarEstadoInput,
  ChangePasswordInput,
  AtribuirPerfilInput,
} from "./user.schema.js";
import {
  listarUtilizadoresDocs,
  obterUtilizadorDocs,
  criarUtilizadorDocs,
  editarUtilizadorDocs,
  alterarEstadoDocs,
  desactivarUtilizadorDocs,
  obterMeuPerfilDocs,
  editarMeuPerfilDocs,
  changePasswordDocs,
  redefinirPasswordDocs,
  listarPerfisDoUtilizadorDocs,
  atribuirPerfilDocs,
  revogarPerfilDocs,
  listarPerfisDisponiveisDocs,
  listarPermissoesDisponiveisDocs,
} from "./user.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";


export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/utilizadores/me",
    { ...obterMeuPerfilDocs, preHandler: [fastify.authenticate] },
    obterMeuPerfilController
  );

  fastify.patch<{ Body: EditarMeuPerfilInput }>(
    "/utilizadores/me",
    {
      ...editarMeuPerfilDocs,
      preHandler: [fastify.authenticate, validateBody(editarMeuPerfilSchema)],
    },
    editarMeuPerfilController
  );

  fastify.post<{ Body: ChangePasswordInput }>(
    "/utilizadores/me/change-password",
    {
      ...changePasswordDocs,
      preHandler: [fastify.authenticate, validateBody(changePasswordSchema)],
    },
    changePasswordController
  );
  fastify.get(
    "/utilizadores/perfis-disponiveis",
    { ...listarPerfisDisponiveisDocs, preHandler: [fastify.authenticate] },
    listarPerfisDisponiveisController
  );

  fastify.get(
    "/utilizadores/permissoes-disponiveis",
    { ...listarPermissoesDisponiveisDocs, preHandler: [fastify.authenticate] },
    listarPermissoesDisponiveisController
  );

  fastify.get<{ Querystring: ListarUtilizadoresQuery }>(
    "/utilizadores",
    {
      ...listarUtilizadoresDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("utilizadores:editar"),
        validateQuery(listarUtilizadoresQuerySchema),
      ],
    },
    listarUtilizadoresController
  );

  fastify.post<{ Body: CriarUtilizadorInput }>(
    "/utilizadores",
    {
      ...criarUtilizadorDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("utilizadores:criar"),
        validateBody(criarUtilizadorSchema),
      ],
    },
    criarUtilizadorController
  );

  fastify.get<{ Params: { id: string } }>(
    "/utilizadores/:id",
    {
      ...obterUtilizadorDocs,
      preHandler: [fastify.authenticate, requirePermission("utilizadores:editar")],
    },
    obterUtilizadorController
  );

  fastify.patch<{ Params: { id: string }; Body: EditarUtilizadorInput }>(
    "/utilizadores/:id",
    {
      ...editarUtilizadorDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("utilizadores:editar"),
        validateBody(editarUtilizadorSchema),
      ],
    },
    editarUtilizadorController
  );

  fastify.patch<{ Params: { id: string }; Body: AlterarEstadoInput }>(
    "/utilizadores/:id/estado",
    {
      ...alterarEstadoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("utilizadores:desactivar"),
        validateBody(alterarEstadoSchema),
      ],
    },
    alterarEstadoController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/utilizadores/:id",
    {
      ...desactivarUtilizadorDocs,
      preHandler: [fastify.authenticate, requirePermission("utilizadores:desactivar")],
    },
    desactivarUtilizadorController
  );

  fastify.post<{ Params: { id: string } }>(
    "/utilizadores/:id/redefinir-password",
    {
      ...redefinirPasswordDocs,
      preHandler: [fastify.authenticate, requirePermission("utilizadores:redefinir_password")],
    },
    redefinirPasswordController
  );

  fastify.get<{ Params: { id: string } }>(
    "/utilizadores/:id/perfis",
    {
      ...listarPerfisDoUtilizadorDocs,
      preHandler: [fastify.authenticate, requirePermission("utilizadores:editar")],
    },
    listarPerfisDoUtilizadorController
  );

  fastify.post<{ Params: { id: string }; Body: AtribuirPerfilInput }>(
    "/utilizadores/:id/perfis",
    {
      ...atribuirPerfilDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("utilizadores:atribuir_perfil"),
        validateBody(atribuirPerfilSchema),
      ],
    },
    atribuirPerfilController
  );

  fastify.delete<{ Params: { id: string; perfilId: string } }>(
    "/utilizadores/:id/perfis/:perfilId",
    {
      ...revogarPerfilDocs,
      preHandler: [fastify.authenticate, requirePermission("utilizadores:atribuir_perfil")],
    },
    revogarPerfilController
  );
}