import type { FastifyInstance } from "fastify";
import {
  criarContactoController,
  editarContactoController,
  eliminarContactoController,
  listarContactosAdminController,
  listarContactosPublicoController,
} from "./contacto.controller.js";
import { criarContactoSchema, editarContactoSchema, listarContactosQuerySchema, listarContactosPublicoQuerySchema } from "./contacto.schema.js";
import type { CriarContactoInput, EditarContactoInput, ListarContactosQuery, ListarContactosPublicoQuery } from "./contacto.schema.js";
import {
  criarContactoDocs,
  editarContactoDocs,
  eliminarContactoDocs,
  listarContactosAdminDocs,
  listarContactosPublicoDocs,
} from "./contacto.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function contactosInstitucionaisRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CriarContactoInput }>(
    "/admin/contactos-institucionais",
    {
      ...criarContactoDocs,
      preHandler: [fastify.authenticate, requirePermission("contactos_institucionais:gerir"), validateBody(criarContactoSchema)],
    },
    criarContactoController
  );

  fastify.get<{ Querystring: ListarContactosQuery }>(
    "/admin/contactos-institucionais",
    {
      ...listarContactosAdminDocs,
      preHandler: [fastify.authenticate, requirePermission("contactos_institucionais:consultar"), validateQuery(listarContactosQuerySchema)],
    },
    listarContactosAdminController
  );

  fastify.patch<{ Params: { id: string }; Body: EditarContactoInput }>(
    "/admin/contactos-institucionais/:id",
    {
      ...editarContactoDocs,
      preHandler: [fastify.authenticate, requirePermission("contactos_institucionais:gerir"), validateBody(editarContactoSchema)],
    },
    editarContactoController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/admin/contactos-institucionais/:id",
    { ...eliminarContactoDocs, preHandler: [fastify.authenticate, requirePermission("contactos_institucionais:gerir")] },
    eliminarContactoController
  );

  fastify.get<{ Querystring: ListarContactosPublicoQuery }>(
    "/contactos-institucionais",
    { ...listarContactosPublicoDocs, preHandler: [validateQuery(listarContactosPublicoQuerySchema)] },
    listarContactosPublicoController
  );
}