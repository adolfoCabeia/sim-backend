const direcaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    nome: { type: "string" },
    sigla: { type: "string" },
    descricao: { type: "string", nullable: true },
    tipo: { type: "string" },
    areaResponsabilidade: { type: "string", nullable: true },
    responsavel: { type: "string", nullable: true },
    contacto: { type: "string", nullable: true },
    permiteIntercambioInterMunicipal: { type: "boolean" },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
    totalUtilizadores: { type: "integer" },
  },
};

const direcaoDetalheObject = {
  type: "object",
  properties: {
    ...direcaoObject.properties,
    _count: {
      type: "object",
      properties: {
        departamentos: { type: "integer" },
        funcionarios: { type: "integer" },
        utilizadores: { type: "integer" },
      },
    },
  },
};

const utilizadorResumoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nomeCompleto: { type: "string" },
    email: { type: "string" },
    tipoConta: { type: "string" },
    funcao: { type: "string", nullable: true },
    estado: { type: "string" },
    ativo: { type: "boolean" },
  },
};

const paginadoDirecoes = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: direcaoObject },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
};

const paginadoUtilizadores = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: utilizadorResumoObject },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
};

const respostaNaoEncontrada = {
  type: "object",
  properties: { success: { type: "boolean" }, message: { type: "string" } },
};

export const criarDirecaoDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Criar direção",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nome", "sigla"],
      properties: {
        nome: { type: "string", minLength: 2, maxLength: 150 },
        sigla: { type: "string", minLength: 2, maxLength: 20 },
        descricao: { type: "string", maxLength: 1000 },
        tipo: { type: "string" },
        areaResponsabilidade: { type: "string" },
        responsavel: { type: "string", maxLength: 150 },
        contacto: { type: "string", maxLength: 150 },
        permiteIntercambioInterMunicipal: { type: "boolean" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: direcaoObject } },
      409: respostaNaoEncontrada,
    },
  },
};

export const listarDirecoesDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Listar direções do município",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        search: { type: "string" },
        tipo: { type: "string" },
      },
    },
    response: { 200: paginadoDirecoes },
  },
};

export const obterDirecaoDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Obter detalhe de uma direção",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: direcaoDetalheObject } },
      404: respostaNaoEncontrada,
    },
  },
};

export const atualizarDirecaoDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Atualizar direção",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      properties: {
        nome: { type: "string", minLength: 2, maxLength: 150 },
        sigla: { type: "string", minLength: 2, maxLength: 20 },
        descricao: { type: "string", maxLength: 1000 },
        tipo: { type: "string" },
        areaResponsabilidade: { type: "string" },
        responsavel: { type: "string", maxLength: 150 },
        contacto: { type: "string", maxLength: 150 },
        permiteIntercambioInterMunicipal: { type: "boolean" },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: direcaoObject } },
      404: respostaNaoEncontrada,
      409: respostaNaoEncontrada,
    },
  },
};

export const eliminarDirecaoDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Eliminar direção",
    description: "Só é possível eliminar direções sem departamentos, funcionários ou utilizadores associados.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      204: { type: "null" },
      404: respostaNaoEncontrada,
      409: respostaNaoEncontrada,
    },
  },
};

export const listarUtilizadoresDaDirecaoDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Listar utilizadores de uma direção",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    },
    response: { 200: paginadoUtilizadores, 404: respostaNaoEncontrada },
  },
};

export const contarUtilizadoresDaDirecaoDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Contar utilizadores de uma direção",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: { direcaoId: { type: "string", format: "uuid" }, total: { type: "integer" } },
          },
        },
      },
      404: respostaNaoEncontrada,
    },
  },
};

export const estatisticasUtilizadoresPorDirecaoDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Contagem de utilizadores por direção (todas as direções do município)",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                nome: { type: "string" },
                sigla: { type: "string" },
                totalUtilizadores: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
};