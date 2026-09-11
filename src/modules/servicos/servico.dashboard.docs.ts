const periodoQuerystring = {
  tipo: {
    type: "string",
    enum: [
      "HOJE", "ONTEM", "ULTIMOS_7_DIAS", "ESTE_MES", "MES_ANTERIOR",
      "TRIMESTRE_ATUAL", "TRIMESTRE_ANTERIOR", "SEMESTRE_ATUAL", "SEMESTRE_ANTERIOR",
      "ESTE_ANO", "ANO_ANTERIOR", "PERSONALIZADO",
    ],
    default: "ESTE_MES",
  },
  dataInicio: { type: "string", format: "date" },
  dataFim: { type: "string", format: "date" },
  direcaoId: { type: "string", format: "uuid" },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const obterResumoPagamentosDocs = {
  schema: {
    tags: ["Dashboard Financeiro (Pagamentos)"],
    summary: "Resumo financeiro do período a partir de pagamentos reais (estado PAGO)",
    description: "Requer RECEITAS:READ (mesmo âmbito por direcção do dashboard de Receitas).",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: periodoQuerystring },
  },
};

export const obterComparacaoPagamentosDocs = {
  schema: {
    tags: ["Dashboard Financeiro (Pagamentos)"],
    summary: "Comparação com o período anterior equivalente (pagamentos reais)",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: periodoQuerystring },
  },
};

export const obterEvolucaoPagamentosDocs = {
  schema: {
    tags: ["Dashboard Financeiro (Pagamentos)"],
    summary: "Evolução da arrecadação real ao longo do tempo",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: { ...periodoQuerystring, granularidade: { type: "string", enum: ["dia", "mes"], default: "dia" } } },
  },
};

export const obterRankingDiasPagamentosDocs = {
  schema: {
    tags: ["Dashboard Financeiro (Pagamentos)"],
    summary: "Ranking dos dias com mais/menos arrecadação real",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: { ...periodoQuerystring, ordem: { type: "string", enum: ["maior", "menor"], default: "maior" }, limite: { type: "integer", default: 10 } },
    },
  },
};

export const obterResumoPorDirecaoPagamentosDocs = {
  schema: {
    tags: ["Dashboard Financeiro (Pagamentos)"],
    summary: "Resumo consolidado por direcção (apenas perfis com visão global)",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: periodoQuerystring },
    response: { 403: errorResponse("Sem permissão para o resumo global por direcção.") },
  },
};
