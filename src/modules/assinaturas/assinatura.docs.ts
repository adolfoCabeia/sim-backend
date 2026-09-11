const assinaturaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    signatarioId: { type: "string", format: "uuid" },
    referenciaTipo: { type: "string" },
    referenciaId: { type: "string" },
    tipoAssinatura: { type: "string", enum: ["PARECER_JURIDICO", "DESPACHO", "CONTRATO", "AUTO_FISCALIZACAO"] },
    hashConteudo: { type: "string" },
    assinaturaHmac: { type: "string" },
    ipOrigem: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
  },
};

export const assinarDocumentoDocs = {
  schema: {
    tags: ["Assinatura Electrónica"],
    summary: "Assinar electronicamente um documento/decisão",
    description:
      "Secções 5.4 e 20 do documento técnico. Não é uma assinatura PKI qualificada — é um mecanismo " +
      "de hash + HMAC para integridade e não-repúdio (ver comentário no assinatura.service.ts).",
    body: {
      type: "object",
      required: ["referenciaTipo", "referenciaId", "tipoAssinatura", "conteudo"],
      properties: {
        referenciaTipo: { type: "string", enum: ["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"] },
        referenciaId: { type: "string", format: "uuid" },
        tipoAssinatura: { type: "string", enum: ["PARECER_JURIDICO", "DESPACHO", "CONTRATO", "AUTO_FISCALIZACAO"] },
        conteudo: { type: "string", description: "Texto exacto que o signatário está a confirmar." },
      },
    },
    response: { 201: assinaturaObject },
  },
};

export const listarAssinaturasDocs = {
  schema: {
    tags: ["Assinatura Electrónica"],
    summary: "Listar assinaturas de um documento/decisão",
    querystring: {
      type: "object",
      required: ["referenciaTipo", "referenciaId"],
      properties: {
        referenciaTipo: { type: "string", enum: ["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"] },
        referenciaId: { type: "string", format: "uuid" },
      },
    },
    response: { 200: { type: "array", items: assinaturaObject } },
  },
};

export const verificarAssinaturaDocs = {
  schema: {
    tags: ["Assinatura Electrónica"],
    summary: "Verificar a integridade de uma assinatura contra um conteúdo",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: { type: "object", required: ["conteudo"], properties: { conteudo: { type: "string" } } },
    response: {
      200: {
        type: "object",
        properties: { valida: { type: "boolean" }, assinatura: assinaturaObject },
      },
    },
  },
};