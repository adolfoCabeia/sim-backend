const contactoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    tipo: { type: "string", enum: ["INTERNO", "EXTERNO"] },
    nome: { type: "string" },
    cargo: { type: "string", nullable: true },
    instituicao: { type: "string", nullable: true },
    direcaoId: { type: "string", format: "uuid", nullable: true },
    telefone: { type: "string", nullable: true },
    email: { type: "string", nullable: true },
    endereco: { type: "string", nullable: true },
    notas: { type: "string", nullable: true },
    visivelPublico: { type: "boolean" },
    criadoPorId: { type: "string", format: "uuid", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const contactoPublicoObject = {
  type: "object",
  description: "Versão pública do contacto, devolvida apenas quando visivelPublico = true",
  properties: {
    id: { type: "string", format: "uuid" },
    tipo: { type: "string", enum: ["INTERNO", "EXTERNO"] },
    nome: { type: "string" },
    cargo: { type: "string", nullable: true },
    instituicao: { type: "string", nullable: true },
    telefone: { type: "string", nullable: true },
    email: { type: "string", nullable: true },
    endereco: { type: "string", nullable: true },
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

/**
 * Directório de Contactos Institucionais: registo de contactos internos
 * (por direcção) e externos (outras instituições/entidades), com um
 * directório público consultável pelo Portal Institucional.
 */
export const criarContactoDocs = {
  schema: {
    tags: ["Contactos Institucionais"],
    summary: "Criar um contacto institucional (admin)",
    description:
      "Regista um novo contacto institucional. Se 'tipo' for INTERNO é obrigatório indicar 'direcaoSigla'; " +
      "se for EXTERNO é obrigatório indicar 'instituicao'. É sempre exigido pelo menos um de 'telefone' ou " +
      "'email'. Requer a permissão contactos_institucionais:gerir.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["tipo", "nome"],
      properties: {
        tipo: { type: "string", enum: ["INTERNO", "EXTERNO"] },
        nome: { type: "string", minLength: 2, maxLength: 200 },
        cargo: { type: "string", maxLength: 150 },
        instituicao: { type: "string", maxLength: 200, description: "Obrigatório quando tipo = EXTERNO" },
        direcaoSigla: { type: "string", description: "Obrigatório quando tipo = INTERNO" },
        telefone: { type: "string", maxLength: 50 },
        email: { type: "string", format: "email" },
        endereco: { type: "string", maxLength: 300 },
        notas: { type: "string", maxLength: 1000 },
        visivelPublico: { type: "boolean", default: false },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: contactoObject } },
      400: errorResponse("Dados inválidos (ex.: falta direcaoSigla, instituicao, ou telefone/email)"),
      404: errorResponse("Direcção não encontrada"),
    },
  },
};

export const editarContactoDocs = {
  schema: {
    tags: ["Contactos Institucionais"],
    summary: "Editar um contacto institucional (admin)",
    description: "Actualiza os dados de um contacto existente. Requer a permissão contactos_institucionais:gerir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      properties: {
        nome: { type: "string", minLength: 2, maxLength: 200 },
        cargo: { type: "string", maxLength: 150 },
        instituicao: { type: "string", maxLength: 200 },
        telefone: { type: "string", maxLength: 50 },
        email: { type: "string", format: "email" },
        endereco: { type: "string", maxLength: 300 },
        notas: { type: "string", maxLength: 1000 },
        visivelPublico: { type: "boolean" },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: contactoObject } },
      404: errorResponse("Contacto não encontrado"),
    },
  },
};

export const eliminarContactoDocs = {
  schema: {
    tags: ["Contactos Institucionais"],
    summary: "Eliminar um contacto institucional (admin)",
    description: "Remove definitivamente um contacto institucional. Requer a permissão contactos_institucionais:gerir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" } } },
      404: errorResponse("Contacto não encontrado"),
    },
  },
};

export const listarContactosAdminDocs = {
  schema: {
    tags: ["Contactos Institucionais"],
    summary: "Listar contactos institucionais (admin)",
    description:
      "Lista todos os contactos do município (internos e externos, públicos e não públicos), com pesquisa " +
      "livre por nome/instituição e filtro por tipo. Requer a permissão contactos_institucionais:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        tipo: { type: "string", enum: ["INTERNO", "EXTERNO"] },
        pesquisa: { type: "string", maxLength: 200 },
      },
    },
    response: { 200: paginado(contactoObject) },
  },
};

export const listarContactosPublicoDocs = {
  schema: {
    tags: ["Contactos Institucionais"],
    summary: "Listar contactos institucionais (directório público)",
    description:
      "Endpoint público (sem autenticação), usado pelo Portal Institucional, que lista apenas os contactos " +
      "marcados como visivelPublico = true, com pesquisa livre por nome/instituição.",
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        pesquisa: { type: "string", maxLength: 200 },
        municipioId: { type: "string" },
      },
    },
    response: { 200: paginado(contactoPublicoObject) },
  },
};