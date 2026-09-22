const distribuicaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    beneficiarioId: { type: "string", format: "uuid" },
    centroAcolhimentoId: { type: "string", format: "uuid", nullable: true },
    quantidadeKits: { type: "integer" },
    requisicaoId: { type: "string", format: "uuid", nullable: true },
    distribuidoPorId: { type: "string", format: "uuid" },
    observacoes: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
  },
};

// Item da listagem: o service faz include de beneficiario e centroAcolhimento.
const distribuicaoListadaObject = {
  ...distribuicaoObject,
  properties: {
    ...distribuicaoObject.properties,
    beneficiario: {
      type: "object",
      properties: {
        nome: { type: "string" },
        bairro: { type: "string", nullable: true },
      },
    },
    centroAcolhimento: {
      type: "object",
      nullable: true,
      properties: {
        nome: { type: "string" },
      },
    },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarDistribuicaoKitDocs = {
  schema: {
    tags: ["Ação Social", "Distribuição de Kits"],
    summary: "Registar distribuição de kit de cesta básica",
    description:
      "Requer a permissão acao-social:distribuicao:gerir. `requisicaoId` é um ponto de ligação leve e opcional " +
      "à Logística — ver README para o TODO de integração de stock.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["beneficiarioId"],
      properties: {
        beneficiarioId: { type: "string", format: "uuid" },
        centroAcolhimentoId: { type: "string", format: "uuid" },
        quantidadeKits: { type: "integer", default: 1 },
        requisicaoId: { type: "string", format: "uuid" },
        observacoes: { type: "string" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: distribuicaoObject } },
      404: errorResponse("Beneficiário não encontrado"),
    },
  },
};

export const listarDistribuicoesDocs = {
  schema: {
    tags: ["Ação Social", "Distribuição de Kits"],
    summary: "Listar distribuições",
    description: "Requer a permissão acao-social:distribuicao:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 20 },
        beneficiarioId: { type: "string", format: "uuid" },
        centroAcolhimentoId: { type: "string", format: "uuid" },
        desde: { type: "string", format: "date-time" },
        ate: { type: "string", format: "date-time" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              items: { type: "array", items: distribuicaoListadaObject },
              page: { type: "integer" },
              pageSize: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
    },
  },
};