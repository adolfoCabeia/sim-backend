const notificacaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    utilizadorId: { type: "string", format: "uuid" },
    titulo: { type: "string" },
    mensagem: { type: "string" },
    lida: { type: "boolean" },
    lidaEm: { type: "string", format: "date-time", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
});


export const listarMinhasNotificacoesDocs = {
  schema: {
    tags: ["Notificações"],
    summary: "Listar as minhas notificações",
    description: "Lista as notificações do utilizador autenticado, com filtro opcional para mostrar apenas as não lidas.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        apenasNaoLidas: { type: "boolean", default: false },
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
              items: { type: "array", items: notificacaoObject },
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

export const contarNaoLidasDocs = {
  schema: {
    tags: ["Notificações"],
    summary: "Contar notificações não lidas",
    description: "Devolve o número de notificações por ler do utilizador autenticado (útil para o badge do sino de notificações).",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object", properties: { naoLidas: { type: "integer" } } },
        },
      },
    },
  },
};

export const marcarComoLidaDocs = {
  schema: {
    tags: ["Notificações"],
    summary: "Marcar uma notificação como lida",
    description: "Marca uma notificação específica do utilizador autenticado como lida.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: notificacaoObject } },
      404: errorResponse("Notificação não encontrada"),
    },
  },
};

export const marcarTodasComoLidasDocs = {
  schema: {
    tags: ["Notificações"],
    summary: "Marcar todas as notificações como lidas",
    description: "Marca todas as notificações não lidas do utilizador autenticado como lidas de uma só vez.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object", properties: { actualizadas: { type: "integer" } } },
        },
      },
    },
  },
};