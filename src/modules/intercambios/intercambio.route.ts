import type { FastifyInstance } from "fastify";
import {
  enviarIntercambioController,
  listarIntercambiosController,
  confirmarRecepcaoController,
  uploadDocumentoController,
  obterDocumentoController,
} from "./intercambio.controller.js";
import { enviarIntercambioSchema, listarIntercambiosQuerySchema } from "./intercambio.schema.js";
import type { EnviarIntercambioInput, ListarIntercambiosQuery } from "./intercambio.schema.js";
import {
  enviarIntercambioDocs,
  listarIntercambiosDocs,
  confirmarRecepcaoDocs,
  uploadDocumentoIntercambioDocs,
  obterDocumentoIntercambioDocs,
} from "./intercambio.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function intercambiosRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: EnviarIntercambioInput }>(
    "/intercambios",
    {
      ...enviarIntercambioDocs,
      preHandler: [fastify.authenticate, requirePermission("intercambios:enviar"), validateBody(enviarIntercambioSchema)],
    },
    enviarIntercambioController
  );

  fastify.get<{ Querystring: ListarIntercambiosQuery }>(
    "/intercambios",
    {
      ...listarIntercambiosDocs,
      preHandler: [fastify.authenticate, requirePermission("intercambios:consultar"), validateQuery(listarIntercambiosQuerySchema)],
    },
    listarIntercambiosController
  );

  fastify.post<{ Params: { id: string } }>(
    "/intercambios/:id/confirmar",
    { ...confirmarRecepcaoDocs, preHandler: [fastify.authenticate, requirePermission("intercambios:confirmar")] },
    confirmarRecepcaoController
  );

  fastify.post(
    "/intercambios/upload-documento",
    { ...uploadDocumentoIntercambioDocs, preHandler: [fastify.authenticate, requirePermission("intercambios:enviar")] },
    uploadDocumentoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/intercambios/:id/documento",
    { ...obterDocumentoIntercambioDocs, preHandler: [fastify.authenticate, requirePermission("intercambios:consultar")] },
    obterDocumentoController
  );
} 