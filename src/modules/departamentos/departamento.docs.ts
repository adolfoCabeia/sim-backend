const departamentoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    direcaoId: { type: "string", format: "uuid" },
    nome: { type: "string" },
    descricao: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
    totalUtilizadores: { type: "integer" },
  },
};

const departamentoDetalheObject = {
  type: "object",
  properties: {
    ...departamentoObject.properties,
    direcao: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" }, nome: { type: "string" }, sigla: { type: "string" } },
    },
    _count: {
      type: "object",
      properties: { utilizadores: { type: "integer" } },
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

const paginadoDepartamentos = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: departamentoObject },
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

const respostaErro = {
  type: "object",
  properties: { success: { type: "boolean" }, message: { type: "string" } },
};

export const criarDepartamentoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Criar departamento numa direção",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["direcaoId", "nome"],
      properties: {
        direcaoId: { type: "string", format: "uuid" },
        nome: { type: "string", minLength: 2, maxLength: 150 },
        descricao: { type: "string", maxLength: 1000 },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: departamentoObject } },
      404: respostaErro,
      409: respostaErro,
    },
  },
};

export const listarDepartamentosDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Listar departamentos do município (opcionalmente filtrado por direção)",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        direcaoId: { type: "string", format: "uuid" },
        search: { type: "string" },
      },
    },
    response: { 200: paginadoDepartamentos },
  },
};

export const listarDepartamentosDaDirecaoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Listar departamentos de uma direção específica",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["direcaoId"], properties: { direcaoId: { type: "string", format: "uuid" } } },
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    },
    response: { 200: paginadoDepartamentos, 404: respostaErro },
  },
};

export const obterDepartamentoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Obter detalhe de um departamento",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: departamentoDetalheObject } },
      404: respostaErro,
    },
  },
};

export const atualizarDepartamentoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Atualizar departamento",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      properties: {
        nome: { type: "string", minLength: 2, maxLength: 150 },
        descricao: { type: "string", maxLength: 1000 },
        direcaoId: { type: "string", format: "uuid" },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: departamentoObject } },
      404: respostaErro,
      409: respostaErro,
    },
  },
};

export const eliminarDepartamentoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Eliminar departamento",
    description: "Só é possível eliminar departamentos sem utilizadores associados.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: { 204: { type: "null" }, 404: respostaErro, 409: respostaErro },
  },
};

export const listarUtilizadoresDoDepartamentoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Listar utilizadores de um departamento",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    },
    response: { 200: paginadoUtilizadores, 404: respostaErro },
  },
};

export const contarUtilizadoresDoDepartamentoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Contar utilizadores de um departamento",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: { departamentoId: { type: "string", format: "uuid" }, total: { type: "integer" } },
          },
        },
      },
      404: respostaErro,
    },
  },
};

export const estatisticasUtilizadoresPorDepartamentoDocs = {
  schema: {
    tags: ["Departamentos"],
    summary: "Contagem de utilizadores por departamento (todo o município, ou filtrado por direção)",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: { direcaoId: { type: "string", format: "uuid" } },
    },
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
                direcaoId: { type: "string", format: "uuid" },
                direcaoNome: { type: "string" },
                totalUtilizadores: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
};