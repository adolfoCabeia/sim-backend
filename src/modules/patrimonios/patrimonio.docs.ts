const erroResponse = {
  type: "object",
  properties: { success: { type: "boolean" }, message: { type: "string" } },
};

const bemResumoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    designacao: { type: "string" },
    categoria: { type: "string" },
    estado: { type: "string" },
    localizacao: { type: "string" },
    direcao: { type: "object", properties: { id: { type: "string" }, nome: { type: "string" } } },
    imagens: { type: "array", items: {} },
    regularizacaoJuridica: { type: "object", properties: { situacaoJuridica: { type: "string" }, alertaIrregularidade: { type: "boolean" } } },
  },
};

const paginado = (items: object) => ({
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
});

export const listarBensDocs = {
  schema: {
    tags: ["Património"],
    summary: "Listar bens",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 20 },
        categoria: { type: "string", enum: ["MOVEIS", "IMOVEL_DOMINIO_PUBLICO", "IMOVEL_DOMINIO_PRIVADO", "INTANGIVEIS", "VEICULO"] },
        estado: { type: "string", enum: ["OPERACIONAL", "TRANSFERIDO", "ABATIDO", "MAU", "OBSOLETO", "AVARIADO"] },
        direcaoId: { type: "string", format: "uuid" },
        search: { type: "string" },
      },
    },
    response: { 200: paginado(bemResumoObject), 403: erroResponse },
  },
};

export const obterBemDocs = {
  schema: {
    tags: ["Património"],
    summary: "Obter ficha de bem",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    // "data" é a entidade Bem completa (forma variável por categoria) —
    // schema vazio faz passthrough em vez do fast-json-stringify apagar
    // tudo, como acontecia antes.
    response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: {} } }, 404: erroResponse },
  },
};

export const criarBemDocs = {
  schema: {
    tags: ["Património"],
    summary: "Registar novo bem",
    description: "Multipart: fachada_NORTE/SUL/SUDOESTE/LESTE (imóveis) e logotipo (intangíveis). Validação manual (Zod) no controller.",
    security: [{ bearerAuth: [] }],
    consumes: ["application/json", "multipart/form-data"],
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: {} } }, 403: erroResponse, 409: erroResponse },
  },
};

export const editarBemDocs = {
  schema: {
    tags: ["Património"],
    summary: "Editar bem",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: {} } }, 404: erroResponse },
  },
};

export const transferirBemDocs = {
  schema: {
    tags: ["Património"],
    summary: "Transferir bem entre gabinetes",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: { type: "object", required: ["direcaoDestinoId"], properties: { direcaoDestinoId: { type: "string", format: "uuid" }, observacao: { type: "string" } } },
    response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: {} } }, 404: erroResponse, 409: erroResponse },
  },
};

export const abaterBemDocs = {
  schema: {
    tags: ["Património"],
    summary: "Abater bem",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: { type: "object", required: ["motivo"], properties: { motivo: { type: "string" } } },
    // O controller sempre devolveu "data" além de "message" — faltava
    // aqui, e por isso era apagado da resposta.
    response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: {} } }, 404: erroResponse, 409: erroResponse },
  },
};

export const adicionarFachadaDocs = {
  schema: {
    tags: ["Património"],
    summary: "Adicionar fachada a imóvel",
    description: "Multipart: campo 'imagem' (ficheiro), 'direcao', 'descricao' opcional. Máximo 4 fachadas por imóvel.",
    consumes: ["multipart/form-data"],
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: {} } }, 404: erroResponse, 409: erroResponse },
  },
};

export const adicionarImagemDocs = {
  schema: {
    tags: ["Património"],
    summary: "Anexar imagem ao bem",
    description: "Multipart: campo 'imagem' (ficheiro), 'legenda' opcional.",
    consumes: ["multipart/form-data"],
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: {} } }, 404: erroResponse },
  },
};

export const criarMovimentoDocs = {
  schema: {
    tags: ["Património"],
    summary: "Registar movimento do bem",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: { type: "object", required: ["tipo", "descricao"], properties: { tipo: { type: "string", enum: ["AQUISICAO", "TRANSFERENCIA", "ABATIMENTO", "MANUTENCAO"] }, descricao: { type: "string" }, direcaoOrigemId: { type: "string" }, direcaoDestinoId: { type: "string" }, valor: { type: "number" }, observacao: { type: "string" } } },
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: {} } }, 404: erroResponse },
  },
};

export const actualizarRegularizacaoDocs = {
  schema: {
    tags: ["Património"],
    summary: "Actualizar regularização jurídica (imóveis)",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["situacaoJuridica", "estadoOcupacao"],
      properties: {
        situacaoJuridica: { type: "string", enum: ["REGULAR", "IRREGULAR", "EM_REGULARIZACAO"] },
        estadoOcupacao: { type: "string", enum: ["LIVRE", "OCUPADO", "OCUPADO_ILEGALMENTE"] },
        historicoDocumental: { type: "string" },
        alertaIrregularidade: { type: "boolean" },
        processos: { type: "array", items: {} },
      },
    },
    response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: {} } }, 404: erroResponse },
  },
};

export const obterAlertasDocs = {
  schema: {
    tags: ["Património"],
    summary: "Listar alertas de irregularidade",
    security: [{ bearerAuth: [] }],
    response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: {} } } }, 403: erroResponse },
  },
};