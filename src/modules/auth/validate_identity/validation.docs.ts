const pedidoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    estado: {
      type: "string",
      enum: [
        "AGUARDANDO_DOCUMENTO",
        "EM_REVISAO",
        "AGUARDANDO_NIVEL_2",
        "CORRECAO_SOLICITADA",
        "APROVADO",
        "REJEITADO",
      ],
    },
    documentoTipo: { type: "string", nullable: true },
    documentoNomeOriginal: { type: "string", nullable: true, example: "BI_Joao_Silva.pdf" },
    documentoNumero: { type: "string", nullable: true },
    motivoRejeicao: { type: "string", nullable: true },
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

export const submeterDocumentoDocs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Submeter documento de identidade",
    description:
      "Passo 1-2 do fluxograma da secção 5.3: o utilizador autenticado anexa o " +
      "Bilhete de Identidade ou Documento Fiscal (multipart/form-data, campo " +
      "'documento') para iniciar ou retomar o processo de validação. Se já existir " +
      "um pedido em CORRECAO_SOLICITADA, este é actualizado em vez de criar um novo.",
    consumes: ["multipart/form-data"],
    security: [{ bearerAuth: [] }],
    response: {
      201: {
        type: "object",
        properties: { success: { type: "boolean", example: true }, data: pedidoObject },
      },
      400: errorResponse("Ficheiro ausente ou tipo de ficheiro não suportado (só JPEG/PNG/PDF)"),
    },
  },
};

export const listarPedidosPendentesDocs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Listar pedidos pendentes de revisão",
    description:
      "Lista os pedidos em EM_REVISAO ou AGUARDANDO_NIVEL_2 do município do utilizador " +
      "autenticado. Requer a permissão validacao_identidade:aprovar_nivel_1.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "array", items: pedidoObject },
        },
      },
    },
  },
};

export const obterPedidoDocs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Obter detalhe de um pedido",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoObject } },
      404: errorResponse("Pedido não encontrado"),
    },
  },
};

export const obterUrlDocumentoDocs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Obter URL temporária do documento anexado",
    description:
      "Gera uma URL assinada (válida por 5 minutos) para o revisor visualizar o " +
      "documento de identidade no MinIO. Nunca expõe o documento publicamente.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object", properties: { url: { type: "string" } } },
        },
      },
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido ainda não tem documento anexado"),
    },
  },
};

export const solicitarCorrecaoDocs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Solicitar correcção do documento (nível 1)",
    description:
      "Devolve o pedido ao utilizador para reenvio do documento (ilegível, " +
      "inconsistente, etc.) — não é uma rejeição definitiva da conta.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      required: ["motivoRejeicao"],
      properties: { motivoRejeicao: { type: "string", minLength: 10, maxLength: 500 } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoObject } },
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido não está em estado EM_REVISAO"),
    },
  },
};

export const rejeitarDefinitivamenteDocs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Rejeitar definitivamente um pedido",
    description:
      "Encerra o pedido sem possibilidade de reenvio — usar quando o documento é " +
      "fraudulento ou os dados não correspondem de forma irrecuperável.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      required: ["motivoRejeicao"],
      properties: { motivoRejeicao: { type: "string", minLength: 10, maxLength: 500 } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoObject } },
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido já aprovado, não pode ser rejeitado"),
    },
  },
};

export const aprovarNivel1Docs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Aprovar pedido — nível 1",
    description:
      "Aprova a revisão de nível 1. Se o perfil solicitado não exigir dupla " +
      "aprovação (ver PERFIS_QUE_EXIGEM_DUPLA_APROVACAO), o pedido fica logo " +
      "APROVADO e a conta é activada. Caso contrário, avança para AGUARDANDO_NIVEL_2. " +
      "O executor nunca pode ser o próprio titular do pedido.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoObject } },
      403: errorResponse("Tentativa de auto-aprovação"),
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido não está em estado EM_REVISAO"),
    },
  },
};

export const aprovarNivel2Docs = {
  schema: {
    tags: ["Validação de Identidade"],
    summary: "Aprovar pedido — nível 2 (perfis críticos)",
    description:
      "Segundo nível de aprovação, obrigatório para perfis críticos (secção 5.4). " +
      "O executor tem de ser diferente de quem aprovou o nível 1, e diferente do " +
      "próprio titular do pedido.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: pedidoObject } },
      403: errorResponse("Auto-aprovação ou mesmo executor do nível 1"),
      404: errorResponse("Pedido não encontrado"),
      409: errorResponse("Pedido não está em estado AGUARDANDO_NIVEL_2"),
    },
  },
};
