import type { FastifyInstance } from "fastify";
import {
  criarReceitaController,
  actualizarReceitaController,
  removerReceitaController,
  listarReceitasController,
  obterResumoFinanceiroController,
  obterComparacaoController,
  obterEvolucaoController,
  obterRankingDiasController,
  obterVisaoDiariaController,
  obterResumoPorDirecaoController,
  exportarReceitasController,
} from "./receita.controller.js";
import {
  criarReceitaSchema,
  actualizarReceitaSchema,
  listarReceitasQuerySchema,
  resumoFinanceiroQuerySchema,
  comparacaoQuerySchema,
  evolucaoQuerySchema,
  rankingDiasQuerySchema,
  resumoPorDirecaoQuerySchema,
  exportarReceitasQuerySchema,
} from "./receita.schema.js";
import type {
  CriarReceitaInput,
  ActualizarReceitaInput,
  ListarReceitasQuery,
  ResumoFinanceiroQuery,
  ComparacaoQuery,
  EvolucaoQuery,
  RankingDiasQuery,
  ResumoPorDirecaoQuery,
  ExportarReceitasQuery,
} from "./receita.schema.js";
import {
  criarReceitaDocs,
  actualizarReceitaDocs,
  removerReceitaDocs,
  listarReceitasDocs,
  obterResumoFinanceiroDocs,
  obterComparacaoDocs,
  obterEvolucaoDocs,
  obterRankingDiasDocs,
  obterVisaoDiariaDocs,
  obterResumoPorDirecaoDocs,
  exportarReceitasDocs,
} from "./receita.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function receitasRoutes(fastify: FastifyInstance) {
  // --- Dashboard financeiro (leitura) ---
  fastify.get<{ Querystring: ResumoFinanceiroQuery }>(
    "/receitas/dashboard/resumo",
    { ...obterResumoFinanceiroDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar"), validateQuery(resumoFinanceiroQuerySchema)] },
    obterResumoFinanceiroController
  );

  fastify.get<{ Querystring: ComparacaoQuery }>(
    "/receitas/dashboard/comparacao",
    { ...obterComparacaoDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar"), validateQuery(comparacaoQuerySchema)] },
    obterComparacaoController
  );

  fastify.get<{ Querystring: EvolucaoQuery }>(
    "/receitas/dashboard/evolucao",
    { ...obterEvolucaoDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar"), validateQuery(evolucaoQuerySchema)] },
    obterEvolucaoController
  );

  fastify.get<{ Querystring: RankingDiasQuery }>(
    "/receitas/dashboard/ranking-dias",
    { ...obterRankingDiasDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar"), validateQuery(rankingDiasQuerySchema)] },
    obterRankingDiasController
  );

  fastify.get<{ Querystring: { direcaoId?: string } }>(
    "/receitas/dashboard/visao-diaria",
    { ...obterVisaoDiariaDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar")] },
    obterVisaoDiariaController
  );

  fastify.get<{ Querystring: ResumoPorDirecaoQuery }>(
    "/receitas/dashboard/por-direcao",
    { ...obterResumoPorDirecaoDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar"), validateQuery(resumoPorDirecaoQuerySchema)] },
    obterResumoPorDirecaoController
  );

  fastify.get<{ Querystring: ExportarReceitasQuery }>(
    "/receitas/dashboard/exportar",
    { ...exportarReceitasDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar"), validateQuery(exportarReceitasQuerySchema)] },
    exportarReceitasController
  );

  fastify.get<{ Querystring: ListarReceitasQuery }>(
    "/receitas",
    { ...listarReceitasDocs, preHandler: [fastify.authenticate, requirePermission("receitas:consultar"), validateQuery(listarReceitasQuerySchema)] },
    listarReceitasController
  );

  fastify.post<{ Body: CriarReceitaInput }>(
    "/receitas",
    { ...criarReceitaDocs, preHandler: [fastify.authenticate, requirePermission("receitas:criar"), validateBody(criarReceitaSchema)] },
    criarReceitaController
  );

  fastify.patch<{ Params: { id: string }; Body: ActualizarReceitaInput }>(
    "/receitas/:id",
    { ...actualizarReceitaDocs, preHandler: [fastify.authenticate, requirePermission("receitas:criar"), validateBody(actualizarReceitaSchema)] },
    actualizarReceitaController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/receitas/:id",
    { ...removerReceitaDocs, preHandler: [fastify.authenticate, requirePermission("receitas:criar")] },
    removerReceitaController
  );
}
