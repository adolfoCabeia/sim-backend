const planoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    tipo: { type: "string", enum: ["PDM", "PLANO_ANUAL_ACTIVIDADES"] },
    titulo: { type: "string" },
    ano: { type: "integer", nullable: true },
    estado: { type: "string", enum: ["RASCUNHO", "SUBMETIDO", "APROVADO", "REJEITADO"] },
    documentoId: { type: "string", format: "uuid", nullable: true },
    submetidoEm: { type: "string", format: "date-time", nullable: true },
    aprovadoEm: { type: "string", format: "date-time", nullable: true },
    observacoesAdministrador: { type: "string", nullable: true },
  },
};

const conflictResponse = { type: "object", properties: { error: { type: "string" } } };

export const criarPlanoDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Criar plano (PDM ou Plano Anual de Actividades) em rascunho",
    description: "Secção 11 do documento técnico.",
    body: {
      type: "object",
      required: ["tipo", "titulo"],
      properties: {
        tipo: { type: "string", enum: ["PDM", "PLANO_ANUAL_ACTIVIDADES"] },
        titulo: { type: "string" },
        ano: { type: "integer" },
        periodoInicio: { type: "string", format: "date-time" },
        periodoFim: { type: "string", format: "date-time" },
        objectivos: { type: "string" },
        documentoId: { type: "string", format: "uuid" },
      },
    },
    response: { 201: planoObject },
  },
};

export const listarPlanosDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Listar planos",
    querystring: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["PDM", "PLANO_ANUAL_ACTIVIDADES"] },
        estado: { type: "string", enum: ["RASCUNHO", "SUBMETIDO", "APROVADO", "REJEITADO"] },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: {
      200: { type: "object", properties: { data: { type: "array", items: planoObject }, total: { type: "integer" } } },
    },
  },
};

export const obterPlanoDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Obter um plano",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: planoObject, 404: { type: "object", properties: { error: { type: "string" } } } },
  },
};

export const atualizarPlanoDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Editar plano (só em estado RASCUNHO)",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: planoObject, 409: conflictResponse },
  },
};

export const removerPlanoDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Remover plano (só em estado RASCUNHO)",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" }, 409: conflictResponse },
  },
};

export const submeterPlanoDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Submeter plano ao Administrador Municipal",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: planoObject, 409: conflictResponse },
  },
};

export const aprovarPlanoDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Aprovar plano (reservado ao Administrador)",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: planoObject, 409: conflictResponse },
  },
};

export const rejeitarPlanoDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Rejeitar plano (reservado ao Administrador)",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["observacoesAdministrador"],
      properties: { observacoesAdministrador: { type: "string" } },
    },
    response: { 200: planoObject, 409: conflictResponse },
  },
};

export const investimentosPublicosDocs = {
  schema: {
    tags: ["GEPE"],
    summary: "Acompanhamento de investimentos públicos (vista sobre Empreitadas)",
    description: "Secção 11 — vista de leitura sobre ProcessoGenerico (tipo REQUISICAO_EMPREITADA); não duplica dados.",
    response: { 200: { type: "array", items: { type: "object" } } },
  },
};