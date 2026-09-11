const conteudoPublicoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    chave: { type: "string" },
    titulo: { type: "string" },
    resumo: { type: "string", nullable: true },
    corpo: { type: "string" },
    categoria: {
      type: "string",
      enum: ["NOTICIA", "AVISO", "SERVICO", "TRANSPARENCIA", "LEGISLACAO", "EVENTO", "OUTRO"],
    },
    estadoPublicacao: {
      type: "string",
      enum: ["RASCUNHO", "PUBLICADO", "PUBLICADO_PARCIAL", "RESTRITO"],
    },
    gruposComAcesso: {
      type: "array",
      items: { type: "string", enum: ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"] },
    },
    criadoPorId: { type: "string", format: "uuid", nullable: true },
    publicadoPorId: { type: "string", format: "uuid", nullable: true },
    publicadoEm: { type: "string", format: "date-time", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const conteudoPublicoResumidoObject = {
  type: "object",
  description: "Versão reduzida devolvida ao público quando o conteúdo está PUBLICADO_PARCIAL ou RESTRITO (sem o campo corpo).",
  properties: {
    id: { type: "string", format: "uuid" },
    chave: { type: "string" },
    titulo: { type: "string" },
    resumo: { type: "string", nullable: true },
    categoria: { type: "string" },
    publicadoEm: { type: "string", format: "date-time", nullable: true },
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

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
});


export const criarConteudoPublicoDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Criar conteúdo público (admin)",
    description:
      "Cria um novo conteúdo (notícia, aviso, serviço, etc.) em estado RASCUNHO. A 'chave' é um slug único por " +
      "município usado na URL pública. Requer a permissão conteudo_publico:gerir.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["chave", "titulo", "corpo"],
      properties: {
        chave: { type: "string", minLength: 3, maxLength: 120, pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
        titulo: { type: "string", minLength: 3, maxLength: 200 },
        resumo: { type: "string", maxLength: 500 },
        corpo: { type: "string", minLength: 1, maxLength: 50000 },
        categoria: {
          type: "string",
          enum: ["NOTICIA", "AVISO", "SERVICO", "TRANSPARENCIA", "LEGISLACAO", "EVENTO", "OUTRO"],
          default: "OUTRO",
        },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: conteudoPublicoObject } },
      400: errorResponse("Dados inválidos ou chave já existente para o município"),
    },
  },
};

export const editarConteudoPublicoDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Editar conteúdo público (admin)",
    description: "Actualiza título, resumo, corpo e/ou categoria de um conteúdo existente. Requer a permissão conteudo_publico:gerir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      properties: {
        titulo: { type: "string", minLength: 3, maxLength: 200 },
        resumo: { type: "string", maxLength: 500 },
        corpo: { type: "string", minLength: 1, maxLength: 50000 },
        categoria: {
          type: "string",
          enum: ["NOTICIA", "AVISO", "SERVICO", "TRANSPARENCIA", "LEGISLACAO", "EVENTO", "OUTRO"],
        },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: conteudoPublicoObject } },
      404: errorResponse("Conteúdo não encontrado"),
    },
  },
};

export const publicarConteudoPublicoDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Publicar conteúdo público (admin)",
    description:
      "Muda o estado de publicação para PUBLICADO (todos veem tudo), PUBLICADO_PARCIAL (só o resumo é público) " +
      "ou RESTRITO (só os 'gruposComAcesso' indicados veem o conteúdo). 'gruposComAcesso' é obrigatório quando " +
      "estadoPublicacao é RESTRITO. Requer a permissão conteudo_publico:gerir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      required: ["estadoPublicacao"],
      properties: {
        estadoPublicacao: { type: "string", enum: ["PUBLICADO", "PUBLICADO_PARCIAL", "RESTRITO"] },
        gruposComAcesso: {
          type: "array",
          items: { type: "string", enum: ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"] },
        },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: conteudoPublicoObject } },
      400: errorResponse("Faltam grupos com acesso para publicação RESTRITO"),
      404: errorResponse("Conteúdo não encontrado"),
    },
  },
};

export const despublicarConteudoPublicoDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Despublicar conteúdo público (admin)",
    description: "Reverte o conteúdo para o estado RASCUNHO, deixando de estar visível no portal público. Requer a permissão conteudo_publico:gerir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: conteudoPublicoObject } },
      404: errorResponse("Conteúdo não encontrado"),
    },
  },
};

export const eliminarConteudoPublicoDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Eliminar conteúdo público (admin)",
    description: "Remove definitivamente um conteúdo. Requer a permissão conteudo_publico:gerir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" } } },
      404: errorResponse("Conteúdo não encontrado"),
    },
  },
};

export const listarConteudosPublicosAdminDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Listar conteúdos públicos (admin)",
    description: "Lista todos os conteúdos do município, incluindo rascunhos, com filtros por categoria e estado. Requer a permissão conteudo_publico:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        categoria: {
          type: "string",
          enum: ["NOTICIA", "AVISO", "SERVICO", "TRANSPARENCIA", "LEGISLACAO", "EVENTO", "OUTRO"],
        },
        estadoPublicacao: {
          type: "string",
          enum: ["RASCUNHO", "PUBLICADO", "PUBLICADO_PARCIAL", "RESTRITO"],
        },
      },
    },
    response: { 200: paginado(conteudoPublicoObject) },
  },
};

export const obterConteudoPublicoAdminDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Obter conteúdo público por id (admin)",
    description: "Devolve o conteúdo completo, incluindo rascunhos. Requer a permissão conteudo_publico:consultar.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: conteudoPublicoObject } },
      404: errorResponse("Conteúdo não encontrado"),
    },
  },
};

export const listarConteudosPublicosDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Listar conteúdos públicos (portal)",
    description:
      "Endpoint público (sem autenticação) que lista apenas conteúdos PUBLICADO ou PUBLICADO_PARCIAL. " +
      "Para PUBLICADO_PARCIAL apenas o resumo é devolvido, nunca o corpo completo.",
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        categoria: {
          type: "string",
          enum: ["NOTICIA", "AVISO", "SERVICO", "TRANSPARENCIA", "LEGISLACAO", "EVENTO", "OUTRO"],
        },
        municipioId: { type: "string" },
      },
    },
    response: { 200: paginado({ oneOf: [conteudoPublicoObject, conteudoPublicoResumidoObject] }) },
  },
};

export const obterConteudoPublicoPorChaveDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Obter conteúdo público pela chave (portal)",
    description: "Endpoint público (sem autenticação) que devolve um conteúdo publicado pela sua chave/slug (ex.: 'novo-horario-atendimento').",
    params: {
      type: "object",
      required: ["chave"],
      properties: { chave: { type: "string" } },
    },
    querystring: {
      type: "object",
      properties: { municipioId: { type: "string" } },
    },
    response: {
      200: {
        type: "object",
        properties: { success: { type: "boolean" }, data: { oneOf: [conteudoPublicoObject, conteudoPublicoResumidoObject] } },
      },
      404: errorResponse("Conteúdo não encontrado ou não publicado"),
    },
  },
};

export const listarConteudosRestritosDocs = {
  schema: {
    tags: ["Conteúdo Público"],
    summary: "Listar conteúdos restritos (portal autenticado)",
    description:
      "Lista conteúdos em estado RESTRITO cujo 'gruposComAcesso' inclui o tipo de conta do utilizador autenticado " +
      "(ex.: EMPRESA, INSTITUICAO, COMISSAO_MORADORES). Requer autenticação, sem permissão adicional.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        categoria: {
          type: "string",
          enum: ["NOTICIA", "AVISO", "SERVICO", "TRANSPARENCIA", "LEGISLACAO", "EVENTO", "OUTRO"],
        },
      },
    },
    response: { 200: paginado(conteudoPublicoObject) },
  },
};