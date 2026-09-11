const municipioObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    codigo: { type: "string", example: "AO-LUA-VIANA" },
    provincia: { type: "string", nullable: true },
    activo: { type: "boolean" },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const direcaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    sigla: { type: "string" },
    tipo: { type: "string" },
  },
};

export const listarMunicipiosDocs = {
  schema: {
    tags: ["Municípios"],
    summary: "Listar todos os municípios activos na plataforma",
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: municipioObject } } },
    },
  },
};

export const listarDirecoesDoMunicipioDocs = {
  schema: {
    tags: ["Municípios"],
    summary: "Listar as direcções/unidades orgânicas de um município",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: direcaoObject } } },
    },
  },
};

export const criarMunicipioDocs = {
  schema: {
    tags: ["Municípios"],
    summary: "Criar um novo município (só SUPER_ADMIN)",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nome", "codigo"],
      properties: {
        nome: { type: "string", minLength: 3, maxLength: 100 },
        codigo: { type: "string", minLength: 3, maxLength: 30, example: "AO-LUA-VIANA" },
        provincia: { type: "string", minLength: 2, maxLength: 100 },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: municipioObject } },
      403: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
      409: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};


export const obterMunicipioDocs = {
  schema: {
    tags: ["Municípios"],
    summary: "Obter um município por id",
    description: "Público. Usado por ecrãs administrativos para mostrar o detalhe de um município específico.",
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: municipioObject,
        },
      },
      404: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};