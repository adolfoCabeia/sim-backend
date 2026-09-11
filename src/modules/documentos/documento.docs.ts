const pastaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    pastaPaiId: { type: "string", format: "uuid", nullable: true },
    direcaoId: { type: "string", format: "uuid", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
  },
};

const documentoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    nomeOriginal: { type: "string", nullable: true },
    tipo: { type: "string", nullable: true },
    descricao: { type: "string", nullable: true },
    pastaId: { type: "string", format: "uuid", nullable: true },
    direcaoId: { type: "string", format: "uuid", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
  },
};

export const criarPastaDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Criar pasta",
    description: "Secção 8.1 do documento técnico — organização livre do arquivo digital pelo utilizador.",
    body: {
      type: "object",
      required: ["nome"],
      properties: {
        nome: { type: "string" },
        pastaPaiId: { type: "string", format: "uuid" },
        direcaoId: { type: "string", format: "uuid" },
      },
    },
    response: { 201: pastaObject },
  },
};

export const listarPastasDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Listar pastas (por omissão, as da raiz)",
    querystring: {
      type: "object",
      properties: { pastaPaiId: { type: "string", format: "uuid" }, direcaoId: { type: "string", format: "uuid" } },
    },
    response: { 200: { type: "array", items: pastaObject } },
  },
};

export const obterPastaDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Obter uma pasta (com sub-pastas e documentos)",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: pastaObject, 404: { type: "object", properties: { error: { type: "string" } } } },
  },
};

export const atualizarPastaDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Renomear pasta",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: pastaObject },
  },
};

export const removerPastaDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Remover pasta (documentos ficam soltos, não são apagados)",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" } },
  },
};

export const uploadDocumentoDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Enviar um documento (digitalização de arquivo físico)",
    description: "multipart/form-data — campo 'documento' obrigatório; 'pastaId' opcional.",
    response: { 201: documentoObject },
  },
};

export const listarDocumentosDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Listar documentos (por omissão, os sem pasta)",
    querystring: {
      type: "object",
      properties: {
        pastaId: { type: "string", format: "uuid" },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: {
      200: { type: "object", properties: { data: { type: "array", items: documentoObject }, total: { type: "integer" } } },
    },
  },
};

export const obterDocumentoDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Obter metadados de um documento",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: documentoObject, 404: { type: "object", properties: { error: { type: "string" } } } },
  },
};

export const visualizarDocumentoDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Obter URL temporária de visualização/download",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: { type: "object", properties: { url: { type: "string" } } } },
  },
};

export const atualizarDocumentoDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Actualizar metadados ou mover documento de pasta",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: documentoObject },
  },
};

export const removerDocumentoDocs = {
  schema: {
    tags: ["Arquivo Digital"],
    summary: "Remover documento",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" } },
  },
};