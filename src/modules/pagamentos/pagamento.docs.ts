const pagamentoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    processoId: { type: "string", format: "uuid" },
    referencia: { type: "string", description: "Referência única de pagamento (ex.: RUPE)" },
    entidade: { type: "string" },
    valor: { type: "number", description: "Valor em Kwanzas" },
    estado: { type: "string", enum: ["PENDENTE", "PAGO", "EXPIRADO", "CANCELADO"] },
    criadoPorId: { type: "string", format: "uuid", nullable: true },
    expiraEm: { type: "string", format: "date-time", nullable: true },
    pagoEm: { type: "string", format: "date-time", nullable: true },
    metadadosConfirmacao: { type: "object", nullable: true, additionalProperties: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
    processo: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "string", format: "uuid" },
        numero: { type: "string" },
        tipo: { type: "string" },
        assunto: { type: "string" },
      },
    },
  },
};

const paginado = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: pagamentoObject },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
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


export const listarMeusPagamentosDocs = {
  schema: {
    tags: ["Pagamentos"],
    summary: "Listar os meus pagamentos",
    description: "Lista os pagamentos associados aos processos do utilizador autenticado. Requer a permissão pagamentos:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        estado: { type: "string", enum: ["PENDENTE", "PAGO", "EXPIRADO", "CANCELADO"] },
      },
    },
    response: { 200: paginado },
  },
};

export const listarPagamentosDocs = {
  schema: {
    tags: ["Pagamentos"],
    summary: "Listar pagamentos do município (staff)",
    description: "Lista todos os pagamentos do município, com filtro por estado. Requer a permissão pagamentos:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        estado: { type: "string", enum: ["PENDENTE", "PAGO", "EXPIRADO", "CANCELADO"] },
      },
    },
    response: { 200: paginado },
  },
};

export const listarPagamentosDoProcessoDocs = {
  schema: {
    tags: ["Pagamentos"],
    summary: "Listar pagamentos de um processo",
    description:
      "Lista todos os pagamentos (RUPE) associados a um processo genérico específico. Requer a permissão " +
      "pagamentos:consultar ou processos_genericos:consultar.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid", description: "Id do processo genérico" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: pagamentoObject } } },
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const confirmarPagamentoDocs = {
  schema: {
    tags: ["Pagamentos"],
    summary: "Confirmar um pagamento",
    description: "Regista a confirmação de pagamento de uma referência PENDENTE, passando o estado para PAGO. Requer a permissão pagamentos:confirmar.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      properties: {
        meioPagamento: { type: "string", maxLength: 100 },
        observacao: { type: "string", maxLength: 1000 },
        metadados: { type: "object", additionalProperties: true },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pagamentoObject } },
      404: errorResponse("Pagamento não encontrado"),
      409: errorResponse("Pagamento não está em estado PENDENTE"),
    },
  },
};

export const ajustarValorPagamentoDocs = {
  schema: {
    tags: ["Pagamentos"],
    summary: "Ajustar o valor de um pagamento",
    description: "Corrige o valor de uma referência de pagamento ainda PENDENTE (ex.: taxa mal calculada), registando o motivo do ajuste. Requer a permissão pagamentos:gerar_rupe.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      required: ["valor", "motivo"],
      properties: {
        valor: { type: "number", exclusiveMinimum: 0, maximum: 999999999 },
        motivo: { type: "string", minLength: 3, maxLength: 500 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pagamentoObject } },
      404: errorResponse("Pagamento não encontrado"),
      409: errorResponse("Pagamento não está em estado PENDENTE"),
    },
  },
};

export const cancelarPagamentoDocs = {
  schema: {
    tags: ["Pagamentos"],
    summary: "Cancelar um pagamento",
    description: "Cancela uma referência de pagamento PENDENTE, registando o motivo. Requer a permissão pagamentos:gerir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      required: ["motivo"],
      properties: {
        motivo: { type: "string", minLength: 3, maxLength: 500 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pagamentoObject } },
      404: errorResponse("Pagamento não encontrado"),
      409: errorResponse("Pagamento não está em estado PENDENTE"),
    },
  },
};

export const obterResumoPagamentosDocs = {
  schema: {
    tags: ["Pagamentos"],
    summary: "Resumo de pagamentos por estado (para o dashboard)",
    description:
      "Contagens agregadas — internos veem o município todo, contas externas só os seus próprios pagamentos.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              porEstado: { type: "object", additionalProperties: { type: "integer" } },
              total: { type: "integer" },
            },
          },
        },
      },
    },
  },
};