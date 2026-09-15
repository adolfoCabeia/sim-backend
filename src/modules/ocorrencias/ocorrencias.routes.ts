import type { FastifyInstance } from "fastify";
import {
  criarOcorrenciaController,
  listarMinhasOcorrenciasController,
  listarOcorrenciasController,
  obterOcorrenciaController,
  responderOcorrenciaController,
  mudarEstadoOcorrenciaController,
  listarOcorrenciasPublicasController
} from "./ocorrencias.controller.js";
import {
  criarOcorrenciaSchema,
  responderOcorrenciaSchema,
  mudarEstadoOcorrenciaSchema,
} from "./ocorrencias.schema.js";
import type {
  CriarOcorrenciaInput,
  ResponderOcorrenciaInput,
  MudarEstadoOcorrenciaInput,
} from "./ocorrencias.schema.js";
import {
  criarOcorrenciaDocs,
  listarMinhasOcorrenciasDocs,
  listarOcorrenciasDocs,
  obterOcorrenciaDocs,
  responderOcorrenciaDocs,
  mudarEstadoOcorrenciaDocs,
  listarOcorrenciasPublicasDocs
} from "./ocorrencias.docs.js";
import { validateBody } from "../../utils/validate.js";
import { requireAnyPermission } from "../../middleware/hasPermission.js";

export async function ocorrenciasRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/ocorrencias",
    {
      ...criarOcorrenciaDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("ocorrencias:criar")],
    },
    criarOcorrenciaController,
  );
  fastify.get<{
    Querystring: {
      municipioId: string;
      page?: string;
      pageSize?: string;
      categoria?: string;
      bairroZona?: string;
    };
  }>("/publico/ocorrencias", { ...listarOcorrenciasPublicasDocs }, listarOcorrenciasPublicasController);

  fastify.get<{ Querystring: { page?: string; pageSize?: string; estado?: string } }>(
    "/ocorrencias/minhas",
    { ...listarMinhasOcorrenciasDocs, preHandler: [fastify.authenticate] },
    listarMinhasOcorrenciasController,
  );

  fastify.get<{ Querystring: { page?: string; pageSize?: string; estado?: string } }>(
    "/ocorrencias",
    {
      ...listarOcorrenciasDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("ocorrencias:consultar")],
    },
    listarOcorrenciasController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/ocorrencias/:id",
    { ...obterOcorrenciaDocs, preHandler: [fastify.authenticate] },
    obterOcorrenciaController,
  );

  fastify.post<{ Params: { id: string }; Body: ResponderOcorrenciaInput }>(
    "/ocorrencias/:id/mensagens",
    {
      ...responderOcorrenciaDocs,
      preHandler: [fastify.authenticate, validateBody(responderOcorrenciaSchema)],
    },
    responderOcorrenciaController,
  );

  fastify.patch<{ Params: { id: string }; Body: MudarEstadoOcorrenciaInput }>(
    "/ocorrencias/:id/estado",
    {
      ...mudarEstadoOcorrenciaDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("ocorrencias:gerir"),
        validateBody(mudarEstadoOcorrenciaSchema),
      ],
    },
    mudarEstadoOcorrenciaController,
  );
}