import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./receita.service.js";
import { exportarReceitasExcel, exportarReceitasPdf } from "./receita.export.js";
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
import { PeriodoInvalidoError, resolverPeriodo, formatarDataISO } from "./receita.periodos.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof service.ReceitaNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof service.DirecaoNaoAutorizadaError) {
    return reply.status(403).send({ success: false, message: error.message, code: "PERMISSAO_INSUFICIENTE" });
  }
  if (error instanceof service.DirecaoInvalidaError || error instanceof PeriodoInvalidoError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarReceitaController(
  request: FastifyRequest<{ Body: CriarReceitaInput }>,
  reply: FastifyReply
) {
  try {
    const receita = await service.criarReceita({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: receita });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar lançamento de receita");
  }
}

export async function actualizarReceitaController(
  request: FastifyRequest<{ Params: { id: string }; Body: ActualizarReceitaInput }>,
  reply: FastifyReply
) {
  try {
    const receita = await service.actualizarReceita({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      receitaId: request.params.id,
      input: request.body,
    });
    return reply.send({ success: true, data: receita });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao actualizar lançamento de receita");
  }
}

export async function removerReceitaController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await service.removerReceita({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      receitaId: request.params.id,
    });
    return reply.send({ success: true });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao remover lançamento de receita");
  }
}

export async function listarReceitasController(
  request: FastifyRequest<{ Querystring: ListarReceitasQuery }>,
  reply: FastifyReply
) {
  try {
    const resultado = await service.listarReceitas({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      query: request.query,
    });
    return reply.send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar receitas");
  }
}

export async function obterResumoFinanceiroController(
  request: FastifyRequest<{ Querystring: ResumoFinanceiroQuery }>,
  reply: FastifyReply
) {
  try {
    const resumo = await service.obterResumoFinanceiro({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      ...request.query,
    });
    return reply.send({ success: true, data: resumo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter resumo financeiro");
  }
}

export async function obterComparacaoController(
  request: FastifyRequest<{ Querystring: ComparacaoQuery }>,
  reply: FastifyReply
) {
  try {
    const comparacao = await service.obterComparacaoPeriodos({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      ...request.query,
    });
    return reply.send({ success: true, data: comparacao });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter comparação de períodos");
  }
}

export async function obterEvolucaoController(
  request: FastifyRequest<{ Querystring: EvolucaoQuery }>,
  reply: FastifyReply
) {
  try {
    const evolucao = await service.obterEvolucaoTemporal({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      ...request.query,
    });
    return reply.send({ success: true, data: evolucao });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter evolução temporal");
  }
}

export async function obterRankingDiasController(
  request: FastifyRequest<{ Querystring: RankingDiasQuery }>,
  reply: FastifyReply
) {
  try {
    const ranking = await service.obterRankingDias({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      ...request.query,
    });
    return reply.send({ success: true, data: ranking });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter ranking de dias");
  }
}

export async function obterVisaoDiariaController(request: FastifyRequest<{ Querystring: { direcaoId?: string } }>, reply: FastifyReply) {
  try {
    const visao = await service.obterVisaoDiaria({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      ...(request.query.direcaoId ? { direcaoId: request.query.direcaoId } : {}),
    });
    return reply.send({ success: true, data: visao });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter visão diária");
  }
}

export async function obterResumoPorDirecaoController(
  request: FastifyRequest<{ Querystring: ResumoPorDirecaoQuery }>,
  reply: FastifyReply
) {
  try {
    const resumo = await service.obterResumoPorDirecao({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      ...request.query,
    });
    return reply.send({ success: true, data: resumo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter resumo por direcção");
  }
}

export async function exportarReceitasController(
  request: FastifyRequest<{ Querystring: ExportarReceitasQuery }>,
  reply: FastifyReply
) {
  try {
    const { formato, ...queryPeriodo } = request.query;
    const periodo = resolverPeriodo(queryPeriodo);
    const dataInicio = formatarDataISO(periodo.atual.inicio);
    const dataFim = formatarDataISO(periodo.atual.fim);

    const [resumo, ranking, comparacao, listagem] = await Promise.all([
      service.obterResumoFinanceiro({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...queryPeriodo }),
      service.obterRankingDias({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...queryPeriodo, ordem: "maior", limite: 20 }),
      service.obterComparacaoPeriodos({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...queryPeriodo }),
      service.listarReceitas({
        municipioId: request.user.municipioId,
        utilizadorId: request.user.sub,
        query: {
          page: 1,
          pageSize: 5000,
          ...(queryPeriodo.direcaoId ? { direcaoId: queryPeriodo.direcaoId } : {}),
          dataInicio,
          dataFim,
          ordenarPor: "data",
          ordem: "asc",
        },
      }),
    ]);

    if (formato === "xlsx") {
      const buffer = await exportarReceitasExcel({ resumo, ranking, comparacao, registos: listagem.items });
      return reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", `attachment; filename="dashboard-financeiro-${resumo.periodo.inicio}_a_${resumo.periodo.fim}.xlsx"`)
        .send(buffer);
    }

    const buffer = await exportarReceitasPdf({ resumo, ranking, comparacao });
    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="dashboard-financeiro-${resumo.periodo.inicio}_a_${resumo.periodo.fim}.pdf"`)
      .send(buffer);
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao exportar dados financeiros");
  }
}
