  import type { FastifyInstance } from "fastify";
  import {
    listarRequisicoesController,
    obterRequisicaoController,
    criarRequisicaoController,
    alterarEstadoController,
    adicionarAnexoController,
    actualizarPercentagemController,
    actualizarRequisicaoController
  } from "./logistica.controller.js";
  import {
    criarRequisicaoSchema,
    alterarEstadoSchema,
    listarRequisicoesQuerySchema,
    
  } from "./logistica.schema.js";
  import type {
    CriarRequisicaoInput,
    AlterarEstadoInput,
    ListarRequisicoesQuery,
  } from "./logistica.schema.js";
  import { requirePermission } from "../../middleware/hasPermission.js";
  import { validateBody } from "../../utils/validate.js";
  import { validateQuery } from "../../utils/validateQuery.js";
  import {
    listarRequisicoesDocs,
    obterRequisicaoDocs,
    criarRequisicaoDocs,
    alterarEstadoDocs,
    adicionarAnexoDocs,
    actualizarPercentagemDocs,
    actualizarRequisicaoDocs
  } from "./logistica.docs.js";

  export async function logisticaRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: ListarRequisicoesQuery }>(
      "/requisicoes",
      {
        ...listarRequisicoesDocs,
        preHandler: [fastify.authenticate, requirePermission("logistica:consultar"), validateQuery(listarRequisicoesQuerySchema)],
      },
      listarRequisicoesController
    );

    fastify.get<{ Params: { id: string } }>(
      "/requisicoes/:id",
      { ...obterRequisicaoDocs, preHandler: [fastify.authenticate, requirePermission("logistica:consultar")] },
      obterRequisicaoController
    );

      fastify.post(
      "/requisicoes",
      {
        ...criarRequisicaoDocs,
        preHandler: [fastify.authenticate, requirePermission("logistica:gerir")],
      },
      criarRequisicaoController
    );

    fastify.post<{ Params: { id: string }; Body: AlterarEstadoInput }>(
      "/requisicoes/:id/estado",
      {
        ...alterarEstadoDocs,
        preHandler: [fastify.authenticate, requirePermission("logistica:aprovar"), validateBody(alterarEstadoSchema)],
      },
      alterarEstadoController
    );

    fastify.post<{ Params: { id: string } }>(
      "/requisicoes/:id/anexos",
      { ...adicionarAnexoDocs, preHandler: [fastify.authenticate, requirePermission("logistica:gerir")] },
      adicionarAnexoController
    );

    fastify.post<{ Params: { id: string }; Body: { percentagem: number } }>(
      "/requisicoes/:id/percentagem",
      { ...actualizarPercentagemDocs, preHandler: [fastify.authenticate, requirePermission("logistica:gerir")] },
      actualizarPercentagemController
    );


fastify.patch<{ Params: { id: string } }>(
  "/requisicoes/:id",
  { ...actualizarRequisicaoDocs, preHandler: [fastify.authenticate, requirePermission("logistica:gerir")] },
  actualizarRequisicaoController
);
  }