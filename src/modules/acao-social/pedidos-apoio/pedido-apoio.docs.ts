const pedidoApoioObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    beneficiarioId: { type: "string", format: "uuid" },
    tipo: { type: "string", enum: ["MICROCREDITO", "HABITACAO", "APOIO_IDOSO", "CESTA_BASICA", "OUTRO"] },
    estado: { type: "string", enum: ["EM_ANALISE", "DEFERIDO", "INDEFERIDO", "CANCELADO"] },
    valorAprovado: { type: "number", nullable: true },
    motivoIndeferimento: { type: "string", nullable: true },
    observacoes: { type: "string", nullable: true },
    resolvidoPorId: { type: "string", format: "uuid", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    resolvidoEm: { type: "string", format: "date-time", nullable: true },
  },
};
const pedidoApoioListadoObject = {
  ...pedidoApoioObject,
  properties: {
    ...pedidoApoioObject.properties,
    beneficiario: {
      type: "object",
      properties: {
        nome: { type: "string" },
        bairro: { type: "string", nullable: true },
      },
    },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarPedidoApoioDocs = {
  schema: {
    tags: ["Ação Social", "Pedidos de Apoio"],
    summary: "Registar pedido de apoio (microcrédito, habitação, idoso, cesta básica)",
    description: "Requer a permissão acao-social:pedidos:gerir.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["beneficiarioId", "tipo"],
      properties: {
        beneficiarioId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["MICROCREDITO", "HABITACAO", "APOIO_IDOSO", "CESTA_BASICA", "OUTRO"] },
        valorAprovado: { type: "number" },
        observacoes: { type: "string" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: pedidoApoioObject } },
      404: errorResponse("Beneficiário não encontrado"),
    },
  },
};

export const obterPedidoApoioDocs = {
  schema: {
    tags: ["Ação Social", "Pedidos de Apoio"],
    summary: "Obter pedido de apoio",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoApoioObject } },
      404: errorResponse("Pedido não encontrado"),
    },
  },
};

export const resolverPedidoApoioDocs = {
  schema: {
    tags: ["Ação Social", "Pedidos de Apoio"],
    summary: "Deferir ou indeferir pedido de apoio",
    description: "Requer a permissão acao-social:pedidos:resolver.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["estado"],
      properties: {
        estado: { type: "string", enum: ["DEFERIDO", "INDEFERIDO"] },
        valorAprovado: { type: "number" },
        motivoIndeferimento: { type: "string" },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoApoioObject } },
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido não está EM_ANALISE"),
    },
  },
};

export const cancelarPedidoApoioDocs = {
  schema: {
    tags: ["Ação Social", "Pedidos de Apoio"],
    summary: "Cancelar pedido de apoio",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoApoioObject } },
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido não está EM_ANALISE"),
    },
  },
};

export const listarPedidosApoioDocs = {
  schema: {
    tags: ["Ação Social", "Pedidos de Apoio"],
    summary: "Listar pedidos de apoio",
    description: "Requer a permissão acao-social:pedidos:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 20 },
        tipo: { type: "string" },
        estado: { type: "string" },
        beneficiarioId: { type: "string", format: "uuid" },
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
              items: { type: "array", items: pedidoApoioListadoObject },
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
