
export const obterIndicadoresDocs = {
  schema: {
    tags: ["Ação Social", "Indicadores"],
    summary: "Painel de indicadores agregados",
    description:
      "Números para o relatório de impacto social — centros, beneficiários, pedidos de apoio, distribuição de " +
      "kits, programas. Casos sensíveis aparecem só como contagens por estado, nunca com descrição ou " +
      "identidade. Requer a permissão acao-social:indicadores:consultar.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              centros: {
                type: "object",
                properties: { total: { type: "integer" }, porTipo: { type: "object", additionalProperties: { type: "integer" } } },
              },
              beneficiarios: {
                type: "object",
                properties: {
                  total: { type: "integer" },
                  familiasEmZonasSensiveis: { type: "integer" },
                  criancasSemRegistoCivil: { type: "integer" },
                },
              },
              casosSensiveis: {
                type: "object",
                properties: { porEstado: { type: "object", additionalProperties: { type: "integer" } } },
              },
              pedidosApoio: {
                type: "array",
                items: {
                  type: "object",
                  properties: { tipo: { type: "string" }, estado: { type: "string" }, total: { type: "integer" } },
                },
              },
              distribuicaoKits: {
                type: "object",
                properties: { totalDistribuicoes: { type: "integer" }, totalKits: { type: "integer" } },
              },
              programasSociais: {
                type: "object",
                properties: { ativos: { type: "integer" }, participantesEmpoderamentoGenero: { type: "integer" } },
              },
              geradoEm: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
};
