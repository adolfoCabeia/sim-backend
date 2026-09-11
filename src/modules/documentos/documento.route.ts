import type { FastifyInstance } from "fastify";
import * as controller from "./documento.controller.js";
import * as docs from "./documento.docs.js";
import { criarPastaSchema, atualizarPastaSchema, atualizarDocumentoSchema } from "./documento.schema.js";
import type {
  CriarPastaInput,
  AtualizarPastaInput,
  ListarPastasQuery,
  ListarDocumentosQuery,
  AtualizarDocumentoInput,
} from "./documento.schema.js";
import { validateBody } from "../../utils/validate.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function documentosRoutes(fastify: FastifyInstance) {
  // Pastas
  fastify.post<{ Body: CriarPastaInput }>(
    "/documentos/pastas",
    {
      ...docs.criarPastaDocs,
      preHandler: [fastify.authenticate, requirePermission("documentos:criar"), validateBody(criarPastaSchema)],
    },
    controller.criarPastaController
  );

  fastify.get<{ Querystring: ListarPastasQuery }>(
    "/documentos/pastas",
    { ...docs.listarPastasDocs, preHandler: [fastify.authenticate, requirePermission("documentos:consultar")] },
    controller.listarPastasController
  );

  fastify.get<{ Params: { id: string } }>(
    "/documentos/pastas/:id",
    { ...docs.obterPastaDocs, preHandler: [fastify.authenticate, requirePermission("documentos:consultar")] },
    controller.obterPastaController
  );

  fastify.patch<{ Params: { id: string }; Body: AtualizarPastaInput }>(
    "/documentos/pastas/:id",
    {
      ...docs.atualizarPastaDocs,
      preHandler: [fastify.authenticate, requirePermission("documentos:editar"), validateBody(atualizarPastaSchema)],
    },
    controller.atualizarPastaController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/documentos/pastas/:id",
    { ...docs.removerPastaDocs, preHandler: [fastify.authenticate, requirePermission("documentos:editar")] },
    controller.removerPastaController
  );

  // Documentos
  fastify.post(
    "/documentos",
    { ...docs.uploadDocumentoDocs, preHandler: [fastify.authenticate, requirePermission("documentos:criar")] },
    controller.uploadDocumentoController
  );

  fastify.get<{ Querystring: ListarDocumentosQuery }>(
    "/documentos",
    { ...docs.listarDocumentosDocs, preHandler: [fastify.authenticate, requirePermission("documentos:consultar")] },
    controller.listarDocumentosController
  );

  fastify.get<{ Params: { id: string } }>(
    "/documentos/:id",
    { ...docs.obterDocumentoDocs, preHandler: [fastify.authenticate, requirePermission("documentos:consultar")] },
    controller.obterDocumentoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/documentos/:id/visualizar",
    { ...docs.visualizarDocumentoDocs, preHandler: [fastify.authenticate, requirePermission("documentos:consultar")] },
    controller.visualizarDocumentoController
  );

  fastify.patch<{ Params: { id: string }; Body: AtualizarDocumentoInput }>(
    "/documentos/:id",
    {
      ...docs.atualizarDocumentoDocs,
      preHandler: [fastify.authenticate, requirePermission("documentos:editar"), validateBody(atualizarDocumentoSchema)],
    },
    controller.atualizarDocumentoController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/documentos/:id",
    { ...docs.removerDocumentoDocs, preHandler: [fastify.authenticate, requirePermission("documentos:editar")] },
    controller.removerDocumentoController
  );
}