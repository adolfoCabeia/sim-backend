const casoSensivelObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    beneficiarioId: { type: "string", format: "uuid", nullable: true },
    tipo: { type: "string", enum: ["VIOLENCIA_ABUSO", "SEM_REGISTO_CIVIL", "OUTRO"] },
    descricao: { type: "string" },
    estado: { type: "string", enum: ["ABERTO", "EM_ACOMPANHAMENTO", "ENCAMINHADO", "ENCERRADO"] },
    dataDeteccao: { type: "string", format: "date-time" },
    encaminhadoPara: { type: "string", nullable: true },
    registadoPorId: { type: "string", format: "uuid" },
    eliminadoEm: { type: "string", format: "date-time", nullable: true },
    eliminadoPorId: { type: "string", format: "uuid", nullable: true },
    motivoEliminacao: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const acessoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    casoSensivelId: { type: "string", format: "uuid" },
    utilizadorId: { type: "string", format: "uuid" },
    acao: { type: "string", enum: ["VISUALIZACAO", "CRIACAO", "EDICAO", "ELIMINACAO", "RESTAURACAO"] },
    criadoEm: { type: "string", format: "date-time" },
    utilizador: {
      type: "object",
      nullable: true,
      properties: { nomeCompleto: { type: "string" }, email: { type: "string" } },
    },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarCasoSensivelDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Registar caso sensível — ACESSO RESTRITO",
    description:
      "Crianças em situação de violência/abuso, ou sem registo civil com acompanhamento activo. Cada criação " +
      "fica registada no trilho de auditoria do caso. Requer a permissão acao-social:casos-sensiveis:gerir " +
      "(atribuir com critério — não é a mesma coisa que gerir beneficiários em geral).",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["tipo", "descricao", "dataDeteccao"],
      properties: {
        beneficiarioId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["VIOLENCIA_ABUSO", "SEM_REGISTO_CIVIL", "OUTRO"] },
        descricao: { type: "string", minLength: 10 },
        dataDeteccao: { type: "string", format: "date-time" },
        encaminhadoPara: { type: "string" },
      },
    },
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: casoSensivelObject } } },
  },
};

export const obterCasoSensivelDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Obter caso sensível — ACESSO RESTRITO E AUDITADO",
    description:
      "Cada leitura fica registada no trilho de auditoria (quem, quando). Requer a permissão " +
      "acao-social:casos-sensiveis:consultar.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: casoSensivelObject } },
      404: errorResponse("Caso não encontrado"),
    },
  },
};

export const atualizarCasoSensivelDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Atualizar caso sensível",
    description: "Requer a permissão acao-social:casos-sensiveis:gerir. Cada edição fica auditada.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      properties: {
        estado: { type: "string", enum: ["ABERTO", "EM_ACOMPANHAMENTO", "ENCAMINHADO", "ENCERRADO"] },
        descricao: { type: "string" },
        encaminhadoPara: { type: "string" },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: casoSensivelObject } },
      404: errorResponse("Caso não encontrado"),
    },
  },
};

export const listarCasosSensiveisDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Listar casos sensíveis — ACESSO RESTRITO E AUDITADO",
    description:
      "Cada caso devolvido nesta listagem gera uma linha de auditoria de visualização. Requer a permissão " +
      "acao-social:casos-sensiveis:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 20, maximum: 50 },
        tipo: { type: "string", enum: ["VIOLENCIA_ABUSO", "SEM_REGISTO_CIVIL", "OUTRO"] },
        estado: { type: "string", enum: ["ABERTO", "EM_ACOMPANHAMENTO", "ENCAMINHADO", "ENCERRADO"] },
        beneficiarioId: { type: "string", format: "uuid" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              items: { type: "array", items: casoSensivelObject },
              page: { type: "integer" },
              pageSize: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
    },
  },
};

export const listarAcessosDoCasoDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Trilho de auditoria de um caso — ACESSO AINDA MAIS RESTRITO",
    description:
      "Quem acedeu a este caso, quando, e que acção fez. Requer a permissão " +
      "acao-social:casos-sensiveis:auditoria — recomenda-se atribuir só a supervisão, não à mesma equipa que " +
      "regista os casos.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: acessoObject } } },
      404: errorResponse("Caso não encontrado"),
    },
  },
};

export const eliminarCasoSensivelDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Eliminar caso sensível (soft delete)",
    description:
      "Nunca apaga a linha a sério — marca como eliminado, com motivo obrigatório, e fica de fora das " +
      "listagens normais. Fica sempre disponível a quem tiver acao-social:casos-sensiveis:eliminados. Requer " +
      "a permissão acao-social:casos-sensiveis:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["motivo"],
      properties: { motivo: { type: "string", minLength: 10, maxLength: 500 } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: casoSensivelObject } },
      404: errorResponse("Caso não encontrado"),
      409: errorResponse("Caso já está eliminado"),
    },
  },
};

export const restaurarCasoSensivelDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Restaurar caso sensível eliminado",
    description: "Requer a permissão acao-social:casos-sensiveis:eliminados.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: casoSensivelObject } },
      404: errorResponse("Caso não encontrado, ou não está eliminado"),
    },
  },
};

export const listarCasosSensiveisEliminadosDocs = {
  schema: {
    tags: ["Ação Social", "Casos Sensíveis"],
    summary: "Listar casos sensíveis eliminados — ACESSO MAIS RESTRITO DE TODOS",
    description: "Requer a permissão acao-social:casos-sensiveis:eliminados. Cada item devolvido fica auditado.",
    security: [{ bearerAuth: [] }],
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: casoSensivelObject } } },
    },
  },
};
