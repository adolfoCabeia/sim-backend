export const listarItensDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Listar itens de stock",
    description: "Lista paginada de itens de stock. Filtros: categoria, abaixo do mínimo, municipioId.",
    querystring: {
      type: "object",
      properties: {
        municipioId: { type: "string", format: "uuid" },
        categoria: { type: "string" },
        abaixoMinimo: { type: "string", enum: ["true", "false"] },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const obterItemDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Obter item de stock por ID",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    response: { 200: { type: "object" }, 404: { type: "object" } },
  },
};

export const criarItemDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Criar item de stock",
    body: {
      type: "object",
      required: ["codigo", "designacao", "categoria", "unidadeMedida"],
      properties: {
        codigo: { type: "string" },
        designacao: { type: "string" },
        categoria: { type: "string" },
        unidadeMedida: { type: "string" },
        quantidadeActual: { type: "integer", default: 0 },
        quantidadeMinima: { type: "integer", default: 0 },
        pontoReposicao: { type: "integer", default: 0 },
        cicloReposicaoMeses: { type: "integer", nullable: true },
        fornecedorPadrao: { type: "string", nullable: true },
      },
    },
    response: { 201: { type: "object" } },
  },
};

export const atualizarItemDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Atualizar item de stock",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        designacao: { type: "string" },
        categoria: { type: "string" },
        unidadeMedida: { type: "string" },
        quantidadeMinima: { type: "integer" },
        pontoReposicao: { type: "integer" },
        cicloReposicaoMeses: { type: "integer", nullable: true },
        fornecedorPadrao: { type: "string", nullable: true },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const removerItemDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Remover item de stock",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    response: { 204: { type: "null" } },
  },
};

export const listarAlertasDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Listar alertas de reposição",
    description: "Retorna itens com quantidade ≤ pontoReposição ou com rutura prevista em ≤ 7 dias. 3 níveis: CRITICO, MEDIO, BAIXO.",
    querystring: {
      type: "object",
      properties: { municipioId: { type: "string", format: "uuid" } },
    },
    response: { 200: { type: "array" } },
  },
};

export const listarMovimentosDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Listar movimentos de stock",
    querystring: {
      type: "object",
      properties: {
        municipioId: { type: "string", format: "uuid" },
        itemStockId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["ENTRADA", "SAIDA", "AJUSTE"] },
        desde: { type: "string", format: "date-time" },
        ate: { type: "string", format: "date-time" },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const criarMovimentoDocs = {
  schema: {
    tags: ["Stock"],
    summary: "Registrar movimento de stock",
    body: {
      type: "object",
      required: ["itemStockId", "tipo", "quantidade", "motivo"],
      properties: {
        itemStockId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["ENTRADA", "SAIDA", "AJUSTE"] },
        quantidade: { type: "integer", minimum: 1 },
        motivo: { type: "string" },
        documentoRef: { type: "string", nullable: true },
      },
    },
    response: { 201: { type: "object" } },
  },
};