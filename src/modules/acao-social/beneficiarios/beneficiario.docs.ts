const zonaSensivelResumoObject = {
  type: "object",
  nullable: true,
  properties: {
    id: { type: "string", format: "uuid" },
    bairro: { type: "string" },
    nivelRisco: { type: "string", enum: ["BAIXO", "MEDIO", "ALTO"] },
  },
};

const beneficiarioObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    nome: { type: "string" },
    bairro: { type: "string" },
    contacto: { type: "string", nullable: true },
    numeroMembrosAgregado: { type: "integer", nullable: true },
    zonaSensivelId: { type: "string", format: "uuid", nullable: true },
    zonaSensivel: zonaSensivelResumoObject,
    criancasSemRegistoCivil: { type: "integer" },
    ativo: { type: "boolean" },
    observacoes: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const zonaSensivelObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    bairro: { type: "string" },
    nivelRisco: { type: "string", enum: ["BAIXO", "MEDIO", "ALTO"] },
    latitude: { type: "number", nullable: true },
    longitude: { type: "number", nullable: true },
    descricao: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarZonaSensivelDocs = {
  schema: {
    tags: ["Ação Social", "Zonas Sensíveis"],
    summary: "Mapear zona sensível",
    description: "Requer a permissão acao-social:beneficiarios:gerir. Dado geográfico — não identifica pessoas.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["bairro", "nivelRisco"],
      properties: {
        bairro: { type: "string" },
        nivelRisco: { type: "string", enum: ["BAIXO", "MEDIO", "ALTO"] },
        latitude: { type: "number" },
        longitude: { type: "number" },
        descricao: { type: "string" },
      },
    },
    response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: zonaSensivelObject } } },
  },
};

export const listarZonasSensiveisDocs = {
  schema: {
    tags: ["Ação Social", "Zonas Sensíveis"],
    summary: "Listar zonas sensíveis mapeadas",
    security: [{ bearerAuth: [] }],
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: zonaSensivelObject } } },
    },
  },
};

export const criarBeneficiarioDocs = {
  schema: {
    tags: ["Ação Social", "Beneficiários"],
    summary: "Cadastrar beneficiário (pessoa/família vulnerável)",
    description: "Requer a permissão acao-social:beneficiarios:gerir.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nome", "bairro"],
      properties: {
        nome: { type: "string" },
        bairro: { type: "string" },
        contacto: { type: "string" },
        numeroMembrosAgregado: { type: "integer" },
        zonaSensivelId: { type: "string", format: "uuid" },
        criancasSemRegistoCivil: { type: "integer", default: 0 },
        observacoes: { type: "string" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: beneficiarioObject } },
      400: errorResponse("Zona sensível indicada não existe"),
    },
  },
};

export const obterBeneficiarioDocs = {
  schema: {
    tags: ["Ação Social", "Beneficiários"],
    summary: "Obter beneficiário",
    description: "Requer a permissão acao-social:beneficiarios:consultar.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: beneficiarioObject } },
      404: errorResponse("Beneficiário não encontrado"),
    },
  },
};

export const atualizarBeneficiarioDocs = {
  schema: {
    tags: ["Ação Social", "Beneficiários"],
    summary: "Atualizar beneficiário",
    description: "Requer a permissão acao-social:beneficiarios:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: beneficiarioObject } },
      404: errorResponse("Beneficiário não encontrado"),
    },
  },
};

export const listarBeneficiariosDocs = {
  schema: {
    tags: ["Ação Social", "Beneficiários"],
    summary: "Listar beneficiários",
    description: "Requer a permissão acao-social:beneficiarios:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 20 },
        bairro: { type: "string" },
        zonaSensivelId: { type: "string", format: "uuid" },
        pesquisa: { type: "string" },
        ativo: { type: "boolean" },
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
              items: { type: "array", items: beneficiarioObject },
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
