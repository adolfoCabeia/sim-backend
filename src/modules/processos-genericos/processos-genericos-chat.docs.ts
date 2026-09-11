
import { idParam, errorResponse } from "./processos-genericos.docs.js";

const ESTADOS_PROCESSO_GENERICO = [
  "RECEBIDO", "EM_ANALISE", "EM_PARECER", "AGUARDANDO_DESPACHO",
  "DEFERIDO", "INDEFERIDO", "CONCLUIDO", "DEVOLVIDO",
] as const;

const participanteObject = {
  type: "object",
  additionalProperties: true,
  properties: {
    nomeCompleto: { type: "string" },
  },
};

const mensagemProcessoObject = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string", format: "uuid" },
    processoId: { type: "string", format: "uuid" },
    mensagem: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    autorId: { type: "string", format: "uuid" },
    lida: { type: "boolean" },
    lidaEm: { type: "string", format: "date-time", nullable: true },
    autor: participanteObject,
    anexoNomeFicheiro: { type: "string", nullable: true },
    anexoMimeType: { type: "string", nullable: true },
    anexoTamanhoBytes: { type: "integer", nullable: true },
    anexoUrl: { type: "string", nullable: true },
  },
};

const paginadoMensagens = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: mensagemProcessoObject },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
};



export const enviarMensagemProcessoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Enviar mensagem na conversa do processo",
    description:
      "Adiciona uma mensagem à conversa entre o requerente e o funcionário actualmente responsável pelo " +
      "processo. Só estes dois participantes têm acesso — a autorização é recalculada a cada pedido a partir " +
      "do responsavelActualId actual, nunca de um valor antigo. Não requer permissão específica, apenas ser " +
      "um dos dois participantes.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["mensagem"],
      properties: { mensagem: { type: "string", minLength: 1, maxLength: 2000 } },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: mensagemProcessoObject } },
      403: errorResponse("Utilizador não é o requerente nem o responsável actual deste processo"),
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo sem responsável/requerente associado, ou em Arquivo Morto"),
    },
  },
};

export const enviarAnexoMensagemProcessoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Enviar um documento (PDF) na conversa do processo",
    description:
      "Faz upload de um ficheiro PDF (multipart/form-data) e envia-o como mensagem na conversa entre o " +
      "requerente e o responsável actual. Campo 'documento' obrigatório, 'mensagem' opcional (legenda). " +
      "Mesma regra de acesso de enviarMensagemProcesso.",
    security: [{ bearerAuth: [] }],
    consumes: ["multipart/form-data"],
    params: idParam,
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: mensagemProcessoObject } },
      400: errorResponse("Ficheiro em falta ou tipo de ficheiro inválido — só PDF é aceite"),
      403: errorResponse("Utilizador não é o requerente nem o responsável actual deste processo"),
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo sem responsável/requerente associado, ou em Arquivo Morto"),
    },
  },
};

export const listarMensagensProcessoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Listar mensagens da conversa do processo",
    description:
      "Devolve a conversa paginada e marca como lidas as mensagens da contraparte. Mesma regra de acesso " +
      "de enviarMensagemProcesso.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      },
    },
    response: {
      200: paginadoMensagens,
      403: errorResponse("Utilizador não é o requerente nem o responsável actual deste processo"),
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const contarNaoLidasProcessoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Contar mensagens não lidas na conversa do processo",
    security: [{ bearerAuth: [] }],
    params: idParam,
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: { processoId: { type: "string", format: "uuid" }, total: { type: "integer" } },
          },
        },
      },
      403: errorResponse("Utilizador não é o requerente nem o responsável actual deste processo"),
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const listarConversasDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Listar as minhas conversas",
    description:
      "Lista os processos onde o utilizador autenticado é requerente ou responsável actual, com contagem " +
      "de mensagens não lidas por processo.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
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
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                  properties: {
                    id: { type: "string", format: "uuid" },
                    numero: { type: "string" },
                    assunto: { type: "string" },
                    estado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
                    requerente: { ...participanteObject, nullable: true },
                    responsavelActual: { ...participanteObject, nullable: true },
                    naoLidas: { type: "integer" },
                  },
                },
              },
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