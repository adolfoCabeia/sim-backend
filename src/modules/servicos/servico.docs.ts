const documentoExigidoObject = {
  type: "object",
  properties: {
    codigo: { type: "string" },
    nome: { type: "string" },
    obrigatorio: { type: "boolean" },
  },
};

const direcaoResponsavelObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    sigla: { type: "string" },
  },
};

const servicoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    codigo: { type: "string" },
    nome: { type: "string" },
    descricao: { type: "string" },
    tipoProcesso: { type: "string" },
    direcaoResponsavelSigla: { type: "string" },
    direcaoResponsavel: direcaoResponsavelObject,
    origensPermitidas: { type: "array", items: { type: "string" } },
    documentosExigidos: { type: "array", items: documentoExigidoObject },
    pago: { type: "boolean" },
    valorReferenciaKz: { type: "number", nullable: true },
    fonte: { type: "string", nullable: true },
    prazoDiasCorridos: { type: "integer", description: "Prazo legal de resposta, em dias corridos." },
    diasAlertaAntesPrazo: { type: "integer", description: "Dias antes do prazo em que o alerta é disparado." },
    activo: { type: "boolean" },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

/** Modelo público resumido — usado apenas na listagem pública. Não inclui campos
 * administrativos/internos (diasAlertaAntesPrazo, fonte, activo, timestamps). */
const servicoPublicoResumoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    codigo: { type: "string" },
    nome: { type: "string" },
    descricao: { type: "string" },
    tipoProcesso: { type: "string" },
    direcaoResponsavel: direcaoResponsavelObject,
    pago: { type: "boolean" },
    valorReferenciaKz: { type: "number", nullable: true },
    prazoDiasCorridos: { type: "integer" },
  },
};

/** Modelo público detalhado — usado no detalhe público, inclui documentosExigidos. */
const servicoPublicoDetalheObject = {
  type: "object",
  properties: {
    servico: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        codigo: { type: "string" },
        nome: { type: "string" },
        descricao: { type: "string" },
        tipoProcesso: { type: "string" },
      },
    },
    direcaoResponsavel: direcaoResponsavelObject,
    documentosExigidos: { type: "array", items: documentoExigidoObject },
    pago: { type: "boolean" },
    valorReferenciaKz: { type: "number", nullable: true },
    prazoDiasCorridos: { type: "integer" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

const servicoBodyProperties = {
  codigo: { type: "string", description: "Ex: LICENCA_EVENTO_CULTURAL. Único por município." },
  nome: { type: "string" },
  descricao: { type: "string" },
  tipoProcesso: { type: "string" },
  direcaoResponsavelSigla: { type: "string" },
  origensPermitidas: { type: "array", items: { type: "string" } },
  documentosExigidos: { type: "array", items: documentoExigidoObject },
  pago: { type: "boolean" },
  valorReferenciaKz: { type: "number" },
  fonte: { type: "string" },
  prazoDiasCorridos: {
    type: "integer",
    description: "Prazo legal de resposta, em dias corridos a partir da criação do processo.",
  },
  diasAlertaAntesPrazo: {
    type: "integer",
    description: "Quantos dias antes do vencimento o alerta é disparado. Tem de ser menor que prazoDiasCorridos.",
  },
};

export const criarServicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços"],
    summary: "Cadastrar um novo serviço no catálogo",
    description: "Requer a permissão CATALOGO_SERVICOS:MANAGE.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: [
        "codigo",
        "nome",
        "descricao",
        "tipoProcesso",
        "direcaoResponsavelSigla",
        "origensPermitidas",
        "prazoDiasCorridos",
        "diasAlertaAntesPrazo",
      ],
      properties: servicoBodyProperties,
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: servicoObject } },
      400: errorResponse("Código duplicado, direcção responsável inválida ou SLA inválido."),
    },
  },
};

export const actualizarServicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços"],
    summary: "Editar um serviço do catálogo",
    security: [{ bearerAuth: [] }],
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
    body: { type: "object", properties: servicoBodyProperties },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: servicoObject } },
      400: errorResponse("Código duplicado, direcção responsável inválida ou SLA inválido."),
      404: errorResponse("Serviço não encontrado."),
    },
  },
};

export const activarServicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços"],
    summary: "Reactivar um serviço",
    security: [{ bearerAuth: [] }],
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
  },
};

export const desactivarServicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços"],
    summary: "Desactivar um serviço (deixa de aparecer no portal, mas mantém o histórico)",
    security: [{ bearerAuth: [] }],
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
  },
};

export const removerServicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços"],
    summary: "Eliminar um serviço do catálogo",
    description: "Só é permitido se o serviço nunca tiver sido usado em nenhum processo — caso contrário, desactive-o.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
    response: { 409: errorResponse("Serviço já usado em processos existentes.") },
  },
};

export const listarServicosDocs = {
  schema: {
    tags: ["Catálogo de Serviços"],
    summary: "Listar o catálogo de serviços (vista administrativa)",
    description: "Requer a permissão CATALOGO_SERVICOS:READ.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        pageSize: { type: "integer", default: 50 },
        origem: { type: "string" },
        tipoProcesso: { type: "string" },
        direcaoResponsavelSigla: { type: "string" },
        pago: { type: "boolean" },
        activo: { type: "boolean" },
        pesquisa: { type: "string" },
      },
    },
  },
};

export const obterServicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços"],
    summary: "Obter um serviço por id",
    security: [{ bearerAuth: [] }],
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
  },
};

export const listarServicosPublicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços (Público)"],
    summary: "Listar todos os serviços activos do município (endpoint público, sem autenticação)",
    description:
      "Endpoint público para o portal do cidadão. Não requer Bearer Token nem permissões administrativas. municipioId é obrigatório. Devolve todos os serviços activos do município indicado, sem paginação e sem limite de quantidade. Serviços desactivados nunca são devolvidos, e não é possível obter dados de outro município.",
    querystring: {
      type: "object",
      required: ["municipioId"],
      properties: {
        municipioId: { type: "string", format: "uuid" },
        origem: { type: "string" },
        tipoProcesso: { type: "string" },
        direcaoResponsavelSigla: { type: "string" },
        pago: { type: "boolean" },
        pesquisa: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: { success: { type: "boolean" }, data: { type: "array", items: servicoPublicoResumoObject } },
      },
      400: errorResponse("municipioId em falta ou inválido."),
    },
  },
};

export const obterServicoPublicoDocs = {
  schema: {
    tags: ["Catálogo de Serviços (Público)"],
    summary: "Obter o detalhe público de um serviço pelo código (endpoint público, sem autenticação)",
    description:
      "Endpoint público para o portal do cidadão. Não requer Bearer Token nem permissões administrativas. municipioId é obrigatório na query. Identifica o serviço pelo código (não pelo UUID). Devolve 404 quando o serviço não existir, não pertencer ao município indicado ou estiver desactivado.",
    params: {
      type: "object",
      required: ["codigo"],
      properties: { codigo: { type: "string", description: "Código do serviço, ex: ATESTADO_RESIDENCIA" } },
    },
    querystring: {
      type: "object",
      required: ["municipioId"],
      properties: { municipioId: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: servicoPublicoDetalheObject } },
      404: errorResponse("Serviço não encontrado, desactivado ou não pertence ao município indicado."),
    },
  },
};