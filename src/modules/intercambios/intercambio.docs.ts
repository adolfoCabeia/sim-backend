const intercambioObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    direcaoOrigemId: { type: "string", format: "uuid" },
    municipioDestinoId: { type: "string", format: "uuid" },
    numeroProtocolo: { type: "string" },
    assunto: { type: "string" },
    estado: { type: "string", enum: ["ENVIADO", "RECEBIDO", "CONFIRMADO"] },
    documentoStorageKey: { type: "string", nullable: true },
    enviadoEm: { type: "string", format: "date-time" },
    recebidoEm: { type: "string", format: "date-time", nullable: true },
    confirmadoEm: { type: "string", format: "date-time", nullable: true },
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


export const enviarIntercambioDocs = {
  schema: {
    tags: ["Intercâmbios"],
    summary: "Enviar um intercâmbio a outro município",
    description:
      "Envia um ofício/documento oficial da direcção do utilizador para outro município, gerando um número de " +
      "protocolo único. Requer a permissão intercambios:enviar.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["municipioDestinoId", "assunto"],
      properties: {
        municipioDestinoId: { type: "string", format: "uuid" },
        assunto: { type: "string", minLength: 5, maxLength: 300 },
        documentoStorageKey: { type: "string", description: "Chave do documento previamente carregado no storage" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: intercambioObject } },
      400: errorResponse("Dados inválidos"),
      404: errorResponse("Município de destino não encontrado"),
    },
  },
};

export const listarIntercambiosDocs = {
  schema: {
    tags: ["Intercâmbios"],
    summary: "Listar intercâmbios enviados ou recebidos",
    description:
      "Lista os intercâmbios enviados pela direcção do utilizador ou recebidos pelo seu município, consoante o " +
      "parâmetro 'direcao'. Requer a permissão intercambios:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        direcao: { type: "string", enum: ["ENVIADOS", "RECEBIDOS"], default: "RECEBIDOS" },
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
              items: { type: "array", items: intercambioObject },
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

export const confirmarRecepcaoDocs = {
  schema: {
    tags: ["Intercâmbios"],
    summary: "Confirmar a recepção de um intercâmbio",
    description:
      "O município destinatário confirma que recebeu o ofício/documento, registando a data de confirmação. " +
      "Requer a permissão intercambios:confirmar.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: intercambioObject } },
      404: errorResponse("Intercâmbio não encontrado"),
      409: errorResponse("Intercâmbio já foi confirmado"),
    },
  },
};

export const uploadDocumentoIntercambioDocs = {
  schema: {
    tags: ["Intercâmbios"],
    summary: "Enviar o documento a anexar a um intercâmbio (passo 1 de 2)",
    description:
      "multipart/form-data — campo 'documento' obrigatório (PDF ou Word). Devolve o 'storageKey' a passar em " +
      "'documentoStorageKey' no POST /intercambios seguinte. Requer a permissão intercambios:enviar.",
    security: [{ bearerAuth: [] }],
    response: {
      201: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: { storageKey: { type: "string" }, mimeType: { type: "string" }, nomeOriginal: { type: "string" } },
          },
        },
      },
      400: errorResponse("Ficheiro inválido"),
    },
  },
};

export const obterDocumentoIntercambioDocs = {
  schema: {
    tags: ["Intercâmbios"],
    summary: "Obter URL de download do documento anexado a um intercâmbio",
    description:
      "Acessível a quem pertença ao município de origem OU de destino do intercâmbio. Requer a permissão " +
      "intercambios:consultar.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { url: { type: "string" } } } } },
      403: errorResponse("Intercâmbio não pertence ao seu município"),
      404: errorResponse("Intercâmbio ou documento não encontrado"),
    },
  },
};