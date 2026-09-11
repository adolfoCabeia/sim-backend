const diplomaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    categoria: { type: "string" },
    numero: { type: "string", nullable: true },
    titulo: { type: "string" },
    dataPublicacao: { type: "string", format: "date-time", nullable: true },
    estado: { type: "string", enum: ["VIGENTE", "REVOGADO"] },
    documentoId: { type: "string", format: "uuid", nullable: true },
  },
};

export const criarDiplomaDocs = {
  schema: {
    tags: ["Biblioteca Jurídica"],
    summary: "Registar diploma na Biblioteca Jurídica Digital",
    description:
      "Secção 10.1 do documento técnico. Faça primeiro o upload do PDF via POST /documentos e passe o " +
      "'documentoId' resultante aqui.",
    body: {
      type: "object",
      required: ["categoria", "titulo"],
      properties: {
        categoria: { type: "string" },
        numero: { type: "string" },
        titulo: { type: "string" },
        dataPublicacao: { type: "string", format: "date-time" },
        documentoId: { type: "string", format: "uuid" },
      },
    },
    response: { 201: diplomaObject },
  },
};

export const pesquisarDiplomasDocs = {
  schema: {
    tags: ["Biblioteca Jurídica"],
    summary: "Pesquisar diplomas (por título/número, categoria, estado)",
    querystring: {
      type: "object",
      properties: {
        q: { type: "string" },
        categoria: { type: "string" },
        estado: { type: "string", enum: ["VIGENTE", "REVOGADO"] },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: {
      200: { type: "object", properties: { data: { type: "array", items: diplomaObject }, total: { type: "integer" } } },
    },
  },
};

export const obterDiplomaDocs = {
  schema: {
    tags: ["Biblioteca Jurídica"],
    summary: "Obter um diploma",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: diplomaObject, 404: { type: "object", properties: { error: { type: "string" } } } },
  },
};

export const atualizarDiplomaDocs = {
  schema: {
    tags: ["Biblioteca Jurídica"],
    summary: "Actualizar diploma (ex.: marcar como revogado)",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: diplomaObject },
  },
};

export const removerDiplomaDocs = {
  schema: {
    tags: ["Biblioteca Jurídica"],
    summary: "Remover diploma do acervo",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" } },
  },
};