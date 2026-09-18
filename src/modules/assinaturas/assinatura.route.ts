import type { FastifyInstance } from "fastify";
import * as controller from "./assinatura.controller.js";
import * as docs from "./assinatura.docs.js";
import { assinarDocumentoSchema } from "./assinatura.schema.js";
import type { AssinarDocumentoInput, ListarAssinaturasQuery } from "./assinatura.schema.js";
import { validateBody } from "../../utils/validate.js";
import { AssinaturaNaoEncontradaError, ConteudoNaoResolvivelError } from "./assinatura.errors.js";

export async function assinaturasRoutes(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, _req, reply) => {
    if (error instanceof AssinaturaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }
    if (error instanceof ConteudoNaoResolvivelError) {
      return reply.status(422).send({ message: error.message });
    }
    throw error; // cai no error handler global da aplicação
  });

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

  // Pública — sem fastify.authenticate. É o destino do QR code e da
  // verificação manual pelo código curto impresso no documento.
  fastify.get<{ Params: { codigo: string } }>(
    "/verificar/:codigo",
    { ...docs.verificarPublicoDocs },
    controller.verificarPublicoController
  );

    fastify.get<{ Params: { tipo: string; id: string } }>(
    "/assinaturas/:tipo/:id/pdf",
    {
      ...docs.gerarPdfDocs,
      preHandler: [fastify.authenticate], // gera o PDF oficial — não é a rota pública de verificação
    },
    controller.gerarPdfController
  );
}