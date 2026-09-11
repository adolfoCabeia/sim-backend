const programaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    nome: { type: "string" },
    tipo: { type: "string", enum: ["EMPODERAMENTO_GENERO", "MICROCREDITO_COLETIVO", "OUTRO"] },
    descricao: { type: "string", nullable: true },
    dataInicio: { type: "string", format: "date-time" },
    dataFim: { type: "string", format: "date-time", nullable: true },
    estado: { type: "string", enum: ["ATIVO", "CONCLUIDO", "CANCELADO"] },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarProgramaDocs = {
  schema: {
    tags: ["Ação Social", "Programas"],
    summary: "Criar programa social (ex.: empoderamento de género)",
    description: "Requer a permissão acao-social:programas:gerir.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nome", "tipo", "dataInicio"],
      properties: {
        nome: { type: "string" },
        tipo: { type: "string", enum: ["EMPODERAMENTO_GENERO", "MICROCREDITO_COLETIVO", "OUTRO"] },
        descricao: { type: "string" },
        dataInicio: { type: "string", format: "date-time" },
        dataFim: { type: "string", format: "date-time" },
      },
    },
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: programaObject } } },
  },
};

export const obterProgramaDocs = {
  schema: {
    tags: ["Ação Social", "Programas"],
    summary: "Obter programa e os seus participantes",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: programaObject } },
      404: errorResponse("Programa não encontrado"),
    },
  },
};

export const atualizarProgramaDocs = {
  schema: {
    tags: ["Ação Social", "Programas"],
    summary: "Atualizar programa",
    description: "Requer a permissão acao-social:programas:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: programaObject } },
      404: errorResponse("Programa não encontrado"),
    },
  },
};

export const inscreverParticipanteDocs = {
  schema: {
    tags: ["Ação Social", "Programas"],
    summary: "Inscrever beneficiário no programa",
    description: "Requer a permissão acao-social:programas:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["beneficiarioId"],
      properties: { beneficiarioId: { type: "string", format: "uuid" }, observacoes: { type: "string" } },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" } } },
      404: errorResponse("Programa ou beneficiário não encontrado"),
      409: errorResponse("Beneficiário já inscrito"),
    },
  },
};

export const removerParticipanteDocs = {
  schema: {
    tags: ["Ação Social", "Programas"],
    summary: "Remover participante do programa",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id", "participanteId"],
      properties: { id: { type: "string", format: "uuid" }, participanteId: { type: "string", format: "uuid" } },
    },
    response: { 200: { type: "object", properties: { success: { type: "boolean" } } } },
  },
};

export const listarProgramasDocs = {
  schema: {
    tags: ["Ação Social", "Programas"],
    summary: "Listar programas",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 20 },
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
              items: { type: "array", items: programaObject },
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
