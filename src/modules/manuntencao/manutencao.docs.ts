export const listarDocs = {
  schema: {
    tags: ["Manutenção Preventiva"],
    summary: "Listar manutenções programadas",
    querystring: {
      type: "object",
      properties: {
        municipioId: { type: "string", format: "uuid" },
        bemId: { type: "string", format: "uuid" },
        tipoManutencao: { type: "string" },
        estado: { type: "string" },
        proximas: { type: "string", enum: ["true", "false"] },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const obterDocs = {
  schema: {
    tags: ["Manutenção Preventiva"],
    summary: "Obter manutenção por ID",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: { type: "object" }, 404: { type: "object" } },
  },
};

export const criarDocs = {
  schema: {
    tags: ["Manutenção Preventiva"],
    summary: "Agendar manutenção preventiva",
    body: {
      type: "object",
      required: ["bemId", "tipoManutencao", "periodicidadeMeses"],
      properties: {
        bemId: { type: "string", format: "uuid" },
        tipoManutencao: { type: "string" },
        periodicidadeMeses: { type: "integer", minimum: 1 },
        dataUltima: { type: "string", format: "date-time", nullable: true },
        dataProxima: { type: "string", format: "date-time", nullable: true },
        especificacoesTecnicas: { type: "string", nullable: true },
        responsavelId: { type: "string", format: "uuid", nullable: true },
        estado: { type: "string", default: "AGENDADA" },
        observacoes: { type: "string", nullable: true },
      },
    },
    response: { 201: { type: "object" } },
  },
};

export const atualizarDocs = {
  schema: {
    tags: ["Manutenção Preventiva"],
    summary: "Atualizar manutenção",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      properties: {
        tipoManutencao: { type: "string" },
        periodicidadeMeses: { type: "integer" },
        dataUltima: { type: "string", format: "date-time", nullable: true },
        dataProxima: { type: "string", format: "date-time", nullable: true },
        especificacoesTecnicas: { type: "string", nullable: true },
        responsavelId: { type: "string", format: "uuid", nullable: true },
        estado: { type: "string" },
        observacoes: { type: "string", nullable: true },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const removerDocs = {
  schema: {
    tags: ["Manutenção Preventiva"],
    summary: "Remover manutenção",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" } },
  },
};

export const concluirDocs = {
  schema: {
    tags: ["Manutenção Preventiva"],
    summary: "Concluir manutenção e recalcular próxima data",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["dataRealizacao"],
      properties: {
        dataRealizacao: { type: "string", format: "date-time" },
        observacoes: { type: "string", nullable: true },
        responsavelId: { type: "string", format: "uuid" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const alertasDocs = {
  schema: {
    tags: ["Manutenção Preventiva"],
    summary: "Listar alertas de manutenção próxima",
    querystring: {
      type: "object",
      properties: { municipioId: { type: "string", format: "uuid" } },
    },
    response: { 200: { type: "array" } },
  },
};