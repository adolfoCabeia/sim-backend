import type { FastifyInstance } from "fastify";
import {
  criarConteudoPublicoController,
  editarConteudoPublicoController,
  publicarConteudoPublicoController,
  despublicarConteudoPublicoController,
  eliminarConteudoPublicoController,
  listarConteudosPublicosAdminController,
  obterConteudoPublicoAdminController,
  listarConteudosPublicosController,
  obterConteudoPublicoPorChaveController,
  listarConteudosRestritosController,
} from "./conteudo-publico.controller.js";
import {
  criarConteudoPublicoSchema,
  editarConteudoPublicoSchema,
  publicarConteudoPublicoSchema,
  listarConteudosPublicosQuerySchema,
  listarConteudosPublicosPublicoQuerySchema,
} from "./conteudo-publico.schema.js";
import type {
  CriarConteudoPublicoInput,
  EditarConteudoPublicoInput,
  PublicarConteudoPublicoInput,
  ListarConteudosPublicosQuery,
  ListarConteudosPublicosPublicoQuery,
} from "./conteudo-publico.schema.js";
import {
  criarConteudoPublicoDocs,
  editarConteudoPublicoDocs,
  publicarConteudoPublicoDocs,
  despublicarConteudoPublicoDocs,
  eliminarConteudoPublicoDocs,
  listarConteudosPublicosAdminDocs,
  obterConteudoPublicoAdminDocs,
  listarConteudosPublicosDocs,
  obterConteudoPublicoPorChaveDocs,
  listarConteudosRestritosDocs,
} from "./conteudo-publico.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";


export async function conteudoPublicoRoutes(fastify: FastifyInstance) {

  fastify.post<{ Body: CriarConteudoPublicoInput }>(
    "/admin/conteudos-publicos",
    {
      ...criarConteudoPublicoDocs,
      preHandler: [fastify.authenticate, requirePermission("conteudo_publico:gerir"), validateBody(criarConteudoPublicoSchema)],
    },
    criarConteudoPublicoController
  );

  fastify.get<{ Querystring: ListarConteudosPublicosQuery }>(
    "/admin/conteudos-publicos",
    {
      ...listarConteudosPublicosAdminDocs,
      preHandler: [fastify.authenticate, requirePermission("conteudo_publico:consultar"), validateQuery(listarConteudosPublicosQuerySchema)],
    },
    listarConteudosPublicosAdminController
  );

  fastify.get<{ Params: { id: string } }>(
    "/admin/conteudos-publicos/:id",
    { ...obterConteudoPublicoAdminDocs, preHandler: [fastify.authenticate, requirePermission("conteudo_publico:consultar")] },
    obterConteudoPublicoAdminController
  );

  fastify.patch<{ Params: { id: string }; Body: EditarConteudoPublicoInput }>(
    "/admin/conteudos-publicos/:id",
    {
      ...editarConteudoPublicoDocs,
      preHandler: [fastify.authenticate, requirePermission("conteudo_publico:gerir"), validateBody(editarConteudoPublicoSchema)],
    },
    editarConteudoPublicoController
  );

  fastify.post<{ Params: { id: string }; Body: PublicarConteudoPublicoInput }>(
    "/admin/conteudos-publicos/:id/publicar",
    {
      ...publicarConteudoPublicoDocs,
      preHandler: [fastify.authenticate, requirePermission("conteudo_publico:gerir"), validateBody(publicarConteudoPublicoSchema)],
    },
    publicarConteudoPublicoController
  );

  fastify.post<{ Params: { id: string } }>(
    "/admin/conteudos-publicos/:id/despublicar",
    { ...despublicarConteudoPublicoDocs, preHandler: [fastify.authenticate, requirePermission("conteudo_publico:gerir")] },
    despublicarConteudoPublicoController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/conteudos-publicos/:id",
    { ...eliminarConteudoPublicoDocs, preHandler: [fastify.authenticate, requirePermission("conteudo_publico:gerir")] },
    eliminarConteudoPublicoController
  );

  fastify.get<{ Querystring: ListarConteudosPublicosPublicoQuery & { municipioId?: string } }>(
    "/conteudos-publicos",
    { ...listarConteudosPublicosDocs, preHandler: [validateQuery(listarConteudosPublicosPublicoQuerySchema)] },
    listarConteudosPublicosController
  );

  fastify.get<{ Params: { chave: string }; Querystring: { municipioId?: string } }>(
    "/conteudos-publicos/:chave",
    { ...obterConteudoPublicoPorChaveDocs },
    obterConteudoPublicoPorChaveController
  );


  fastify.get<{ Querystring: ListarConteudosPublicosPublicoQuery }>(
    "/portal/conteudos-restritos",
    { ...listarConteudosRestritosDocs, preHandler: [fastify.authenticate, validateQuery(listarConteudosPublicosPublicoQuerySchema)] },
    listarConteudosRestritosController
  );
}