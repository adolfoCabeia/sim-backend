export const listarDocs = {
  schema: {
    tags: ["Serviços Contínuos"],
    summary: "Listar serviços contínuos",
    querystring: {
      type: "object",
      properties: {
        municipioId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["ENERGIA", "INTERNET", "VOZ", "TELEVISAO"] },
        estado: { type: "string", enum: ["ACTIVO", "SUSPENSO", "CANCELADO"] },
        proximoVencimento: { type: "string", enum: ["true", "false"] },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const obterDocs = {
  schema: {
    tags: ["Serviços Contínuos"],
    summary: "Obter serviço por ID",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: { type: "object" }, 404: { type: "object" } },
  },
};

export const criarDocs = {
  schema: {
    tags: ["Serviços Contínuos"],
    summary: "Criar serviço contínuo",
    body: {
      type: "object",
      required: ["tipo", "designacao"],
      properties: {
        tipo: { type: "string", enum: ["ENERGIA", "INTERNET", "VOZ", "TELEVISAO"] },
        designacao: { type: "string" },
        fornecedor: { type: "string", nullable: true },
        numeroContrato: { type: "string", nullable: true },
        estado: { type: "string", enum: ["ACTIVO", "SUSPENSO", "CANCELADO"], default: "ACTIVO" },
        dataUltimoCarregamento: { type: "string", format: "date-time", nullable: true },
        valorUltimoCarregamento: { type: "number", nullable: true },
        consumoEstimadoDias: { type: "integer", nullable: true },
        dataPrevistaEsgotamento: { type: "string", format: "date-time", nullable: true },
        dataProximoCarregamento: { type: "string", format: "date-time", nullable: true },
        alertaDiasAntes: { type: "integer", default: 7 },
      },
    },
    response: { 201: { type: "object" } },
  },
};

export const atualizarDocs = {
  schema: {
    tags: ["Serviços Contínuos"],
    summary: "Atualizar serviço contínuo",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      properties: {
        designacao: { type: "string" },
        fornecedor: { type: "string", nullable: true },
        numeroContrato: { type: "string", nullable: true },
        estado: { type: "string", enum: ["ACTIVO", "SUSPENSO", "CANCELADO"] },
        dataUltimoCarregamento: { type: "string", format: "date-time", nullable: true },
        valorUltimoCarregamento: { type: "number", nullable: true },
        consumoEstimadoDias: { type: "integer", nullable: true },
        dataPrevistaEsgotamento: { type: "string", format: "date-time", nullable: true },
        dataProximoCarregamento: { type: "string", format: "date-time", nullable: true },
        alertaDiasAntes: { type: "integer" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const removerDocs = {
  schema: {
    tags: ["Serviços Contínuos"],
    summary: "Remover serviço contínuo",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" } },
  },
};

export const recargaDocs = {
  schema: {
    tags: ["Serviços Contínuos"],
    summary: "Registrar recarga e recalcular datas",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["dataCarregamento", "valor"],
      properties: {
        dataCarregamento: { type: "string", format: "date-time" },
        valor: { type: "number", minimum: 0 },
        consumoEstimadoDias: { type: "integer", nullable: true },
        alertaDiasAntes: { type: "integer" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const alertasDocs = {
  schema: {
    tags: ["Serviços Contínuos"],
    summary: "Listar alertas de vencimento (15 e 7 dias)",
    querystring: {
      type: "object",
      properties: { municipioId: { type: "string", format: "uuid" } },
    },
    response: { 200: { type: "array" } },
  },
};