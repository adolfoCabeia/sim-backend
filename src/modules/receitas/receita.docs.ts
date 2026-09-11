const receitaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    direcaoId: { type: "string", format: "uuid" },
    direcao: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "string", format: "uuid" },
        nome: { type: "string" },
        sigla: { type: "string" },
      },
    },
    data: { type: "string", format: "date" },
    orgaoArrecadador: { type: "string" },
    servicoNome: { type: "string" },
    servicoCodigo: { type: "string", nullable: true },
    numeroDli: { type: "string", nullable: true },
    valorCobradoDli: { type: "number", description: "Valor liquidado/cobrado (DLI), em Kwanzas" },
    numeroDar: { type: "string", nullable: true },
    valorPagoDar: { type: "number", description: "Valor efectivamente arrecadado (DAR/RUPE), em Kwanzas" },
    numeroRupe: { type: "string", nullable: true },
    observacao: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
});

const periodoQuerystring = {
  tipo: {
    type: "string",
    enum: [
      "HOJE",
      "ONTEM",
      "ULTIMOS_7_DIAS",
      "ESTE_MES",
      "MES_ANTERIOR",
      "TRIMESTRE_ATUAL",
      "TRIMESTRE_ANTERIOR",
      "SEMESTRE_ATUAL",
      "SEMESTRE_ANTERIOR",
      "ESTE_ANO",
      "ANO_ANTERIOR",
      "PERSONALIZADO",
    ],
    default: "ESTE_MES",
  },
  dataInicio: { type: "string", format: "date", description: "Obrigatório quando tipo=PERSONALIZADO" },
  dataFim: { type: "string", format: "date", description: "Obrigatório quando tipo=PERSONALIZADO" },
  direcaoId: { type: "string", format: "uuid" },
};

export const criarReceitaDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Lançar um registo de receita (DLI/DAR/RUPE)",
    description: "Cria um lançamento manual de arrecadação. Requer a permissão RECEITAS:CREATE.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["data", "orgaoArrecadador", "servicoNome", "valorCobradoDli", "valorPagoDar"],
      properties: {
        direcaoId: { type: "string", format: "uuid", description: "Opcional — por omissão usa a direcção do utilizador autenticado." },
        data: { type: "string", format: "date" },
        orgaoArrecadador: { type: "string" },
        servicoNome: { type: "string" },
        servicoCodigo: { type: "string" },
        numeroDli: { type: "string" },
        valorCobradoDli: { type: "number" },
        numeroDar: { type: "string" },
        valorPagoDar: { type: "number" },
        numeroRupe: { type: "string" },
        observacao: { type: "string" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: receitaObject } },
      400: errorResponse("Dados inválidos."),
      403: errorResponse("Sem permissão para lançar receita nesta direcção."),
    },
  },
};

export const actualizarReceitaDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Editar um registo de receita",
    description: "Actualiza um lançamento manual existente. Requer a permissão RECEITAS:CREATE.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: receitaObject } },
      403: errorResponse("Sem permissão sobre a direcção deste registo."),
      404: errorResponse("Registo não encontrado."),
    },
  },
};

export const removerReceitaDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Remover um registo de receita",
    description: "Requer a permissão RECEITAS:CREATE.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" } } },
      404: errorResponse("Registo não encontrado."),
    },
  },
};

export const listarReceitasDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Listar lançamentos de receita (tabela de introdução/edição)",
    description: "Requer a permissão RECEITAS:READ.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 200, default: 20 },
        direcaoId: { type: "string", format: "uuid" },
        dataInicio: { type: "string", format: "date" },
        dataFim: { type: "string", format: "date" },
        servicoNome: { type: "string" },
        ordenarPor: { type: "string", enum: ["data", "valorPagoDar"], default: "data" },
        ordem: { type: "string", enum: ["asc", "desc"], default: "desc" },
      },
    },
  },
};

export const obterResumoFinanceiroDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Resumo financeiro do período (dashboard)",
    description: "Totais, arrecadação por serviço/órgão, melhor/pior dia e melhor/pior serviço. Requer RECEITAS:READ.",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: periodoQuerystring },
  },
};

export const obterComparacaoDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Comparação com o período anterior equivalente",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: periodoQuerystring },
  },
};

export const obterEvolucaoDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Evolução da arrecadação ao longo do tempo (série diária ou mensal)",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: { ...periodoQuerystring, granularidade: { type: "string", enum: ["dia", "mes"], default: "dia" } } },
  },
};

export const obterRankingDiasDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Ranking dos dias com mais/menos arrecadação",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: { ...periodoQuerystring, ordem: { type: "string", enum: ["maior", "menor"], default: "maior" }, limite: { type: "integer", default: 10 } },
    },
  },
};

export const obterVisaoDiariaDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Visão diária (hoje vs. ontem) e evolução do mês",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: { direcaoId: { type: "string", format: "uuid" } } },
  },
};

export const obterResumoPorDirecaoDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Resumo consolidado por direcção (visão geral do Secretário-Geral)",
    description: "Apenas para perfis com visão global (SUPER_ADMIN, ADMINISTRADOR_MUNICIPAL, SECRETARIO_GERAL, ADMINISTRADOR_ADJUNTO_ECONOMICA, DIRECTOR_GEPE).",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: periodoQuerystring },
    response: { 403: errorResponse("Sem permissão para o resumo global por direcção.") },
  },
};

export const exportarReceitasDocs = {
  schema: {
    tags: ["Receitas"],
    summary: "Exportar dados financeiros do período filtrado (Excel ou PDF)",
    security: [{ bearerAuth: [] }],
    querystring: { type: "object", properties: { ...periodoQuerystring, formato: { type: "string", enum: ["xlsx", "pdf"] } }, required: ["formato"] },
  },
};
