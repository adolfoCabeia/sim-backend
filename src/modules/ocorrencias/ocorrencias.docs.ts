const responsavelResumoObject = { type: "object", properties: { nomeCompleto: { type: "string" } }, nullable: true };

const ocorrenciaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    numero: { type: "string" },
    municipioId: { type: "string", format: "uuid" },
    bairroZona: { type: "string" },
    categoria: { type: "string" },
    titulo: { type: "string" },
    descricao: { type: "string" },
    estado: { type: "string" },
    prioridade: { type: "string" },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
    naoLidas: { type: "integer" },
    responsavel: responsavelResumoObject,
  },
};
const autorResumoObject = {
  type: "object",
  properties: { nomeCompleto: { type: "string" } },
};

const ocorrenciaMensagemObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    mensagem: { type: "string" },
    criadoEm: { type: "string", format: "date-time" },
    autorId: { type: "string", format: "uuid" },
    lida: { type: "boolean" },
    lidaEm: { type: "string", format: "date-time", nullable: true },
    autor: autorResumoObject,
  },
};

const ocorrenciaAnexoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nomeFicheiro: { type: "string" },
    mimeType: { type: "string" },
    tamanhoBytes: { type: "integer" },
    url: { type: "string" },
  },
};

const ocorrenciaDetalheObject = {
  type: "object",
  properties: {
    ...ocorrenciaObject.properties,
    mensagens: { type: "array", items: ocorrenciaMensagemObject },
    anexos: { type: "array", items: ocorrenciaAnexoObject },
    criadoPor: autorResumoObject,
    responsavel: { ...autorResumoObject, nullable: true },
  },
};



const imagemPublicaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nomeFicheiro: { type: "string" },
    mimeType: { type: "string" },
    url: { type: "string", format: "uri" },
  },
};

const ocorrenciaPublicaObject = {
  type: "object",
  properties: {
    numero: { type: "string" },
    bairroZona: { type: "string" },
    categoria: { type: "string" },
    titulo: { type: "string" },
    descricao: { type: "string" },
    estado: { type: "string", enum: ["RESOLVIDA"] },
    registadoEm: { type: "string", format: "date-time" },
    resolvidoEm: { type: "string", format: "date-time" },
    reportadoPor: {
      type: "string",
      description: "Nunca inclui nomes pessoais — 'Cidadão' ou o nome de uma Comissão de Moradores.",
    },
    resolvidoPor: {
      type: "string",
      nullable: true,
      description: "Direcção/Departamento institucional responsável — nunca o nome do funcionário.",
    },
    imagens: { type: "array", items: imagemPublicaObject },
  },
};

export const listarOcorrenciasPublicasDocs = {
  schema: {
    tags: ["Transparência Pública"],
    summary: "Listar ocorrências resolvidas (página pública de transparência)",
    description:
      "Endpoint público, SEM autenticação. Só devolve ocorrências no estado RESOLVIDA. Por " +
      "desenho, nunca expõe o nome de quem reportou nem do funcionário que resolveu — só " +
      "entidades institucionais (Comissão de Moradores, Direcção/Departamento).",
    querystring: {
      type: "object",
      required: ["municipioId"],
      properties: {
        municipioId: { type: "string", format: "uuid" },
        page: { type: "string", default: "1" },
        pageSize: { type: "string", default: "20" },
        categoria: { type: "string" },
        bairroZona: { type: "string" },
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
              items: { type: "array", items: ocorrenciaPublicaObject },
              page: { type: "integer" },
              pageSize: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
      400: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};

const paginado = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: ocorrenciaObject },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
};

export const criarOcorrenciaDocs = {
  schema: {
    tags: ["Ocorrências"],
    summary: "Registar uma ocorrência (com até 4 imagens)",
    description:
      "Comissão de Moradores ou cidadão regista uma ocorrência com imagens como comprovativo. " +
      "Envio via multipart/form-data: campos de texto + até 4 ficheiros de imagem (JPEG, PNG ou WebP).",
    security: [{ bearerAuth: [] }],
    consumes: ["multipart/form-data"],
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: ocorrenciaObject } },
      400: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};

export const listarMinhasOcorrenciasDocs = {
  schema: {
    tags: ["Ocorrências"],
    summary: "Listar as minhas ocorrências",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        estado: { type: "string" },
      },
    },
    response: { 200: paginado },
  },
};

export const listarOcorrenciasDocs = {
  schema: {
    tags: ["Ocorrências"],
    summary: "Listar ocorrências do município (staff)",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        estado: { type: "string" },
      },
    },
    response: { 200: paginado },
  },
};

export const obterOcorrenciaDocs = {
  schema: {
    tags: ["Ocorrências"],
    summary: "Obter detalhe de uma ocorrência (com thread de mensagens)",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: ocorrenciaDetalheObject } },
      404: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};
export const responderOcorrenciaDocs = {
  schema: {
    tags: ["Ocorrências"],
    summary: "Responder numa ocorrência",
    description: "Adiciona uma mensagem à thread de comunicação — usado tanto pela Comissão como pela Administração.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["mensagem"],
      properties: { mensagem: { type: "string", minLength: 1, maxLength: 2000 } },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" } } },
      404: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};

export const mudarEstadoOcorrenciaDocs = {
  schema: {
    tags: ["Ocorrências"],
    summary: "Mudar estado de uma ocorrência (staff)",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["estado"],
      properties: {
        estado: { type: "string", enum: ["REGISTADA", "EM_ANALISE", "EM_RESOLUCAO", "RESOLVIDA", "ARQUIVADA"] },
        observacao: { type: "string", maxLength: 500 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: ocorrenciaObject } },
      404: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};