import type { FastifyInstance } from "fastify";
import * as controller from "./assinatura.controller.js";
import * as docs from "./assinatura.docs.js";
import { assinarDocumentoSchema } from "./assinatura.schema.js";
import type { AssinarDocumentoInput, ListarAssinaturasQuery } from "./assinatura.schema.js";
import { validateBody } from "../../utils/validate.js";

export async function assinaturasRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: AssinarDocumentoInput }>(
    "/assinaturas",
    {
      ...docs.assinarDocumentoDocs,
      preHandler: [fastify.authenticate, validateBody(assinarDocumentoSchema)],
    },
    controller.assinarController
  );

  fastify.get<{ Querystring: ListarAssinaturasQuery }>(
    "/assinaturas",
    {
      ...docs.listarAssinaturasDocs,
      preHandler: [fastify.authenticate],
    },
    controller.listarController
  );

  fastify.post<{ Params: { id: string }; Body: { conteudo: string } }>(
    "/assinaturas/:id/verificar",
    {
      ...docs.verificarAssinaturaDocs,
      preHandler: [fastify.authenticate],
    },
    controller.verificarController
  );
}