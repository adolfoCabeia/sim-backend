import type { FastifyInstance } from "fastify";
import {
  listarMinhasNotificacoesController,
  contarNaoLidasController,
  marcarComoLidaController,
  marcarTodasComoLidasController,
} from "./notificacao.controller.js";
import { listarNotificacoesQuerySchema } from "./notificacao.schema.js";
import type { ListarNotificacoesQuery } from "./notificacao.schema.js";
import {
  listarMinhasNotificacoesDocs,
  contarNaoLidasDocs,
  marcarComoLidaDocs,
  marcarTodasComoLidasDocs,
} from "./notificacao.docs.js";
import { validateQuery } from "../../utils/validateQuery.js";

export async function notificacoesRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarNotificacoesQuery }>(
    "/notificacoes",
    {
      ...listarMinhasNotificacoesDocs,
      preHandler: [fastify.authenticate, validateQuery(listarNotificacoesQuerySchema)],
    },
    listarMinhasNotificacoesController
  );

  fastify.get(
    "/notificacoes/nao-lidas/contagem",
    { ...contarNaoLidasDocs, preHandler: [fastify.authenticate] },
    contarNaoLidasController
  );

  fastify.post<{ Params: { id: string } }>(
    "/notificacoes/:id/lida",
    { ...marcarComoLidaDocs, preHandler: [fastify.authenticate] },
    marcarComoLidaController
  );

  fastify.post(
    "/notificacoes/marcar-todas-lidas",
    { ...marcarTodasComoLidasDocs, preHandler: [fastify.authenticate] },
    marcarTodasComoLidasController
  );
}