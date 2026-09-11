import type { FastifyRequest, FastifyReply } from "fastify";
import * as dashboard from "./servico.dashboard.service.js";
import { DirecaoNaoAutorizadaError } from "../receitas/receita.service.js";
import { PeriodoInvalidoError } from "../receitas/receita.periodos.js";
import type {
  ResumoPagamentosQuery,
  ComparacaoPagamentosQuery,
  EvolucaoPagamentosQuery,
  RankingDiasPagamentosQuery,
  ResumoPorDirecaoPagamentosQuery,
} from "./servico.dashboard.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof DirecaoNaoAutorizadaError) {
    return reply.status(403).send({ success: false, message: error.message, code: "PERMISSAO_INSUFICIENTE" });
  }
  if (error instanceof PeriodoInvalidoError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function obterResumoPagamentosController(request: FastifyRequest<{ Querystring: ResumoPagamentosQuery }>, reply: FastifyReply) {
  try {
    const resumo = await dashboard.obterResumoPagamentos({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...request.query });
    return reply.send({ success: true, data: resumo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter resumo de pagamentos");
  }
}

export async function obterComparacaoPagamentosController(
  request: FastifyRequest<{ Querystring: ComparacaoPagamentosQuery }>,
  reply: FastifyReply
) {
  try {
    const comparacao = await dashboard.obterComparacaoPagamentos({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...request.query });
    return reply.send({ success: true, data: comparacao });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter comparação de pagamentos");
  }
}

export async function obterEvolucaoPagamentosController(
  request: FastifyRequest<{ Querystring: EvolucaoPagamentosQuery }>,
  reply: FastifyReply
) {
  try {
    const evolucao = await dashboard.obterEvolucaoPagamentos({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...request.query });
    return reply.send({ success: true, data: evolucao });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter evolução de pagamentos");
  }
}

export async function obterRankingDiasPagamentosController(
  request: FastifyRequest<{ Querystring: RankingDiasPagamentosQuery }>,
  reply: FastifyReply
) {
  try {
    const ranking = await dashboard.obterRankingDiasPagamentos({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...request.query });
    return reply.send({ success: true, data: ranking });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter ranking de dias de pagamentos");
  }
}

export async function obterResumoPorDirecaoPagamentosController(
  request: FastifyRequest<{ Querystring: ResumoPorDirecaoPagamentosQuery }>,
  reply: FastifyReply
) {
  try {
    const resumo = await dashboard.obterResumoPorDirecaoPagamentos({ municipioId: request.user.municipioId, utilizadorId: request.user.sub, ...request.query });
    return reply.send({ success: true, data: resumo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter resumo de pagamentos por direcção");
  }
}
