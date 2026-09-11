const logObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    utilizadorId: { type: "string", format: "uuid", nullable: true },
    accao: { type: "string", example: "LOGIN" },
    entidade: { type: "string", example: "Utilizador" },
    entidadeId: { type: "string", nullable: true },
    detalhes: { type: "object", nullable: true, additionalProperties: true },
    ipOrigem: { type: "string", nullable: true },
    userAgent: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    utilizador: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "string", format: "uuid" },
        nomeCompleto: { type: "string" },
        email: { type: "string" },
      },
    },
  },
};

export const listarLogsDocs = {
  schema: {
    tags: ["Auditoria"],
    summary: "Listar logs de auditoria",
    description:
      "Perfil Auditor / Administrador (secção 5.2 e 20 do documento técnico): consulta " +
      "paginada e filtrável ao log de auditoria imutável do município. Só-leitura — " +
      "não existe nenhum endpoint de alteração ou remoção destes registos.",
    querystring: {
      type: "object",
      properties: {
        utilizadorId: { type: "string", format: "uuid" },
        entidade: { type: "string" },
        entidadeId: { type: "string" },
        accao: { type: "string" },
        desde: { type: "string", format: "date-time" },
        ate: { type: "string", format: "date-time" },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "50" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          data: { type: "array", items: logObject },
          total: { type: "integer" },
        },
      },
    },
  },
};

export const obterLogDocs = {
  schema: {
    tags: ["Auditoria"],
    summary: "Obter um registo de auditoria por id",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    response: {
      200: logObject,
      404: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
};

export const exportarLogsDocs = {
  schema: {
    tags: ["Auditoria"],
    summary: "Exportar logs de auditoria em CSV",
    description:
      "Perfil com a permissão AUDITORIA:EXPORT (tipicamente Auditor / Administrador). " +
      "Aplica os mesmos filtros de `/auditoria/logs`, sem paginação — capado a 10 000 " +
      "linhas por exportação; para períodos maiores, estreitar `desde`/`ate`.",
    querystring: {
      type: "object",
      properties: {
        utilizadorId: { type: "string", format: "uuid" },
        entidade: { type: "string" },
        entidadeId: { type: "string" },
        accao: { type: "string" },
        desde: { type: "string", format: "date-time" },
        ate: { type: "string", format: "date-time" },
      },
    },
  },
};