const TIPOS_PROCESSO_GENERICO = [
  "EXPEDIENTE",
  "PARECER_JURIDICO",
  "REQUISICAO_BEM_SERVICO",
  "REQUISICAO_EMPREITADA",
  "PEDIDO_AUDIENCIA",
  "RECLAMACAO",
  "DENUNCIA",
  "LICENCIAMENTO",
  "SUGESTAO",
  "DOACAO",
];

const ESTADOS_PROCESSO_GENERICO = [
  "RECEBIDO",
  "EM_ANALISE",
  "EM_PARECER",
  "AGUARDANDO_DESPACHO",
  "DEFERIDO",
  "INDEFERIDO",
  "CONCLUIDO",
  "DEVOLVIDO",
];

const servicoObject = {
  type: "object",
  description: "Serviço do catálogo, já filtrado consoante o tipo de conta do utilizador autenticado",
  additionalProperties: true,
  properties: {
    codigo: { type: "string" },
    nome: { type: "string" },
    tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
    direcaoSigla: { type: "string" },
    pago: { type: "boolean" },
  },
};

const processoPortalObject = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string", format: "uuid" },
    numeroProcesso: { type: "string" },
    tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
    assunto: { type: "string" },
    estado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
    criadoEm: { type: "string", format: "date-time" },
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


export const listarServicosDisponiveisDocs = {
  schema: {
    tags: ["Portal"],
    summary: "Listar serviços disponíveis no portal",
    description:
      "Lista os serviços do catálogo já filtrados pela origem/tipo de conta do utilizador autenticado " +
      "(munícipe, empresa, instituição, comissão de moradores). Requer a permissão processos_genericos:criar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
        direcaoSigla: { type: "string" },
        pago: { type: "boolean" },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: servicoObject } } },
    },
  },
};

export const obterCapacidadesPortalDocs = {
  schema: {
    tags: ["Portal"],
    summary: "Obter capacidades do portal",
    description:
      "Manifesto consolidado do que o portal do utilizador autenticado permite fazer: serviços do catálogo já " +
      "filtrados pela sua origem, mais os módulos transversais disponíveis (pagamentos, agendamentos, " +
      "intercâmbios, credenciais, etc.).",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object", additionalProperties: true },
        },
      },
    },
  },
};

export const criarPedidoPortalDocs = {
  schema: {
    tags: ["Portal"],
    summary: "Criar um pedido/processo via portal",
    description:
      "Abre um novo processo genérico (ex.: reclamação, pedido de audiência, licenciamento) em nome do " +
      "utilizador autenticado, opcionalmente ligado a um serviço específico do catálogo. Requer a permissão processos_genericos:criar.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["tipo", "assunto"],
      properties: {
        tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
        assunto: { type: "string", minLength: 5, maxLength: 300 },
        servicoCodigo: { type: "string" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: processoPortalObject } },
      400: errorResponse("Serviço incompatível com o tipo de processo indicado"),
      404: errorResponse("Serviço ou direcção não encontrados"),
    },
  },
};

export const listarMeusProcessosDocs = {
  schema: {
    tags: ["Portal"],
    summary: "Listar os meus processos",
    description: "Lista os processos genéricos abertos pelo utilizador autenticado via portal, com filtros por tipo e estado. Requer a permissão portal_municipe:consultar_processo.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
        estado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
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
              items: { type: "array", items: processoPortalObject },
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

export const obterMeuProcessoDocs = {
  schema: {
    tags: ["Portal"],
    summary: "Obter um processo meu (com timeline)",
    description: "Devolve o estado actual e a timeline (histórico de acções) de um processo pertencente ao utilizador autenticado. Requer a permissão portal_municipe:consultar_processo.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
      403: errorResponse("O processo não pertence ao utilizador autenticado"),
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const obterResumoMeusProcessosDocs = {
  schema: {
    tags: ["Portal"],
    summary: "Resumo dos meus processos por estado e tipo (para o dashboard)",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              porEstado: { type: "object", additionalProperties: { type: "integer" } },
              porTipo: { type: "object", additionalProperties: { type: "integer" } },
              total: { type: "integer" },
            },
          },
        },
      },
    },
  },
};

export const obterDocumentoFinalDocs = {
  schema: {
    tags: ["Portal"],
    summary: "Obter o documento final de um processo",
    description:
      "Devolve o documento final gerado para um processo concluído do utilizador autenticado (ex.: despacho, " +
      "licença). Requer a permissão portal_municipe:consultar_processo.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
      403: errorResponse("O processo não pertence ao utilizador autenticado"),
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Documento final ainda não está disponível"),
    },
  },
};