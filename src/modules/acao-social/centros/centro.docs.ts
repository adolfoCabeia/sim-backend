const centroObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    departamentoId: { type: "string", format: "uuid" },
    nome: { type: "string" },
    tipo: { type: "string", enum: ["ACOLHIMENTO_INFANTIL", "ACOLHIMENTO_IDOSOS", "COZINHA_SOCIAL", "MISTO", "OUTRO"] },
    bairro: { type: "string" },
    endereco: { type: "string", nullable: true },
    latitude: { type: "number", nullable: true },
    longitude: { type: "number", nullable: true },
    capacidadeMaxima: { type: "integer", nullable: true },
    ocupacaoAtual: { type: "integer" },
    responsavelNome: { type: "string", nullable: true },
    responsavelContacto: { type: "string", nullable: true },
    estado: { type: "string", enum: ["ATIVO", "INATIVO", "EM_MANUTENCAO"] },
    observacoes: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarCentroDocs = {
  schema: {
    tags: ["Ação Social", "Centros"],
    summary: "Cadastrar centro de acolhimento",
    description: "Requer a permissão acao-social:centros:gerir.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["departamentoId", "nome", "tipo", "bairro"],
      properties: {
        departamentoId: { type: "string", format: "uuid" },
        nome: { type: "string" },
        tipo: { type: "string", enum: ["ACOLHIMENTO_INFANTIL", "ACOLHIMENTO_IDOSOS", "COZINHA_SOCIAL", "MISTO", "OUTRO"] },
        bairro: { type: "string" },
        endereco: { type: "string" },
        latitude: { type: "number" },
        longitude: { type: "number" },
        capacidadeMaxima: { type: "integer" },
        responsavelNome: { type: "string" },
        responsavelContacto: { type: "string" },
        observacoes: { type: "string" },
      },
    },
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: centroObject } } },
  },
};

export const obterCentroDocs = {
  schema: {
    tags: ["Ação Social", "Centros"],
    summary: "Obter centro",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: centroObject } },
      404: errorResponse("Centro não encontrado"),
    },
  },
};

export const atualizarCentroDocs = {
  schema: {
    tags: ["Ação Social", "Centros"],
    summary: "Atualizar centro (dados, estado, ocupação)",
    description: "Requer a permissão acao-social:centros:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: centroObject } },
      404: errorResponse("Centro não encontrado"),
      422: errorResponse("Ocupação indicada excede a capacidade máxima"),
    },
  },
};

export const listarCentrosDocs = {
  schema: {
    tags: ["Ação Social", "Centros"],
    summary: "Listar centros",
    description: "Requer a permissão acao-social:centros:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 20 },
        departamentoId: { type: "string", format: "uuid" },
        tipo: { type: "string" },
        estado: { type: "string" },
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
              items: { type: "array", items: centroObject },
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
