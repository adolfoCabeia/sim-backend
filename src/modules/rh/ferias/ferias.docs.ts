const pedidoFeriasObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    funcionarioId: { type: "string", format: "uuid" },
    dataInicio: { type: "string", format: "date-time" },
    dataFim: { type: "string", format: "date-time" },
    diasUteis: { type: "integer" },
    motivo: { type: "string", nullable: true },
    estado: { type: "string", enum: ["SOLICITADO", "APROVADO", "REJEITADO", "CANCELADO"] },
    aprovadoPorId: { type: "string", format: "uuid", nullable: true },
    motivoRejeicao: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    resolvidoEm: { type: "string", format: "date-time", nullable: true },
  },
};

const saldoFeriasObject = {
  type: "object",
  properties: {
    diasDisponiveis: { type: "integer" },
    diasUsados: { type: "integer" },
    diasRestantes: { type: "integer" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarPedidoFeriasDocs = {
  schema: {
    tags: ["Férias"],
    summary: "Pedir férias",
    description:
      "O próprio funcionário submete um pedido para si. Valida antecedência mínima, ausência de sobreposição " +
      "com outro pedido activo, saldo anual disponível, e que o período não ultrapassa o fim do vínculo (para " +
      "Contrato/Estágio).",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["dataInicio", "dataFim"],
      properties: {
        dataInicio: { type: "string", format: "date-time" },
        dataFim: { type: "string", format: "date-time" },
        motivo: { type: "string", maxLength: 500 },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: pedidoFeriasObject } },
      404: errorResponse("Não existe ficha de funcionário associada a esta conta"),
      409: errorResponse("Sobreposição com outro pedido activo"),
      422: errorResponse("Saldo insuficiente, antecedência insuficiente, ou período inválido/fora do vínculo"),
    },
  },
};

export const responderPedidoFeriasDocs = {
  schema: {
    tags: ["Férias"],
    summary: "Aprovar ou rejeitar um pedido de férias",
    description:
      "Revalida saldo e sobreposição no momento da resposta (podem ter mudado desde a submissão). Requer a " +
      "permissão ferias:aprovar.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["aprovar"],
      properties: { aprovar: { type: "boolean" }, motivoRejeicao: { type: "string", maxLength: 500 } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoFeriasObject } },
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido não está SOLICITADO, ou passou a haver sobreposição"),
      422: errorResponse("Saldo deixou de ser suficiente entretanto"),
    },
  },
};

export const cancelarPedidoFeriasDocs = {
  schema: {
    tags: ["Férias"],
    summary: "Cancelar o meu pedido de férias",
    description: "Só o próprio funcionário, e só antes de as férias começarem.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoFeriasObject } },
      403: errorResponse("Só o próprio funcionário pode cancelar"),
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido não está num estado cancelável"),
    },
  },
};

export const listarMeusPedidosFeriasDocs = {
  schema: {
    tags: ["Férias"],
    summary: "Os meus pedidos de férias e saldo",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: { items: { type: "array", items: pedidoFeriasObject }, saldo: saldoFeriasObject },
          },
        },
      },
    },
  },
};

export const listarPedidosFeriasDocs = {
  schema: {
    tags: ["Férias"],
    summary: "Listar pedidos de férias (staff)",
    description: "Requer a permissão ferias:aprovar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        estado: { type: "string", enum: ["SOLICITADO", "APROVADO", "REJEITADO", "CANCELADO"] },
        funcionarioId: { type: "string", format: "uuid" },
        departamentoId: { type: "string", format: "uuid" },
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
              items: { type: "array", items: pedidoFeriasObject },
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
