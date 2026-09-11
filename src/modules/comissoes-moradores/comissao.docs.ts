const membroObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    cargo: { type: "string" },
    contacto: { type: "string", nullable: true },
  },
};

const comissaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    bairro: { type: "string" },
    coordenadasLat: { type: "number", nullable: true },
    coordenadasLng: { type: "number", nullable: true },
    presidenteNome: { type: "string" },
    presidenteContacto: { type: "string", nullable: true },
    documentacaoLegalUrl: { type: "string", nullable: true },
    estado: { type: "string", enum: ["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"] },
    observacoes: { type: "string", nullable: true },
    membros: { type: "array", items: membroObject },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

export const listarComissoesDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Listar comissões de moradores",
    description: "Secção 10.5 do documento técnico.",
    querystring: {
      type: "object",
      properties: {
        bairro: { type: "string" },
        estado: { type: "string", enum: ["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"] },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: { data: { type: "array", items: comissaoObject }, total: { type: "integer" } },
      },
    },
  },
};

export const obterComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Obter uma comissão de moradores",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: comissaoObject, 404: { type: "object", properties: { error: { type: "string" } } } },
  },
};

export const criarComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Cadastrar comissão de moradores",
    body: {
      type: "object",
      required: ["bairro", "presidenteNome"],
      properties: {
        bairro: { type: "string" },
        coordenadasLat: { type: "number" },
        coordenadasLng: { type: "number" },
        presidenteNome: { type: "string" },
        presidenteContacto: { type: "string" },
        documentacaoLegalUrl: { type: "string" },
        estado: { type: "string", enum: ["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"] },
        observacoes: { type: "string" },
        membros: { type: "array", items: membroObject },
      },
    },
    response: { 201: comissaoObject },
  },
};

export const atualizarComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Actualizar comissão de moradores",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: comissaoObject },
  },
};

export const removerComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Remover comissão de moradores",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" } },
  },
};

export const adicionarMembroDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Adicionar membro a uma comissão",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["nome", "cargo"],
      properties: { nome: { type: "string" }, cargo: { type: "string" }, contacto: { type: "string" } },
    },
    response: { 201: membroObject },
  },
};

export const removerMembroDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Remover membro de uma comissão",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" }, membroId: { type: "string", format: "uuid" } },
      required: ["id", "membroId"],
    },
    response: { 204: { type: "null" } },
  },
};