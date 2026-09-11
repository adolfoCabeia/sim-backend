import type { FastifyInstance } from "fastify";
import {
  obterResumoPagamentosController,
  obterComparacaoPagamentosController,
  obterEvolucaoPagamentosController,
  obterRankingDiasPagamentosController,
  obterResumoPorDirecaoPagamentosController,
} from "./servico.dashboard.controller.js";
import {
  resumoPagamentosQuerySchema,
  comparacaoPagamentosQuerySchema,
  evolucaoPagamentosQuerySchema,
  rankingDiasPagamentosQuerySchema,
  resumoPorDirecaoPagamentosQuerySchema,
} from "./servico.dashboard.schema.js";
import type {
  ResumoPagamentosQuery,
  ComparacaoPagamentosQuery,
  EvolucaoPagamentosQuery,
  RankingDiasPagamentosQuery,
  ResumoPorDirecaoPagamentosQuery,
} from "./servico.dashboard.schema.js";
import {
  obterResumoPagamentosDocs,
  obterComparacaoPagamentosDocs,
  obterEvolucaoPagamentosDocs,
  obterRankingDiasPagamentosDocs,
  obterResumoPorDirecaoPagamentosDocs,
} from "./servico.dashboard.docs.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function servicosDashboardRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ResumoPagamentosQuery }>(
    "/servicos/dashboard/resumo",
    { ...obterResumoPagamentosDocs, preHandler: [fastify.authenticate, requirePermission("receitas:read"), validateQuery(resumoPagamentosQuerySchema)] },
    obterResumoPagamentosController
  );

  fastify.get<{ Querystring: ComparacaoPagamentosQuery }>(
    "/servicos/dashboard/comparacao",
    { ...obterComparacaoPagamentosDocs, preHandler: [fastify.authenticate, requirePermission("receitas:read"), validateQuery(comparacaoPagamentosQuerySchema)] },
    obterComparacaoPagamentosController
  );

  fastify.get<{ Querystring: EvolucaoPagamentosQuery }>(
    "/servicos/dashboard/evolucao",
    { ...obterEvolucaoPagamentosDocs, preHandler: [fastify.authenticate, requirePermission("receitas:read"), validateQuery(evolucaoPagamentosQuerySchema)] },
    obterEvolucaoPagamentosController
  );

  fastify.get<{ Querystring: RankingDiasPagamentosQuery }>(
    "/servicos/dashboard/ranking-dias",
    { ...obterRankingDiasPagamentosDocs, preHandler: [fastify.authenticate, requirePermission("receitas:read"), validateQuery(rankingDiasPagamentosQuerySchema)] },
    obterRankingDiasPagamentosController
  );

  fastify.get<{ Querystring: ResumoPorDirecaoPagamentosQuery }>(
    "/servicos/dashboard/por-direcao",
    {
      ...obterResumoPorDirecaoPagamentosDocs,
      preHandler: [fastify.authenticate, requirePermission("receitas:read"), validateQuery(resumoPorDirecaoPagamentosQuerySchema)],
    },
    obterResumoPorDirecaoPagamentosController
  );
}
