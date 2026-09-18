const signatarioAssinaturaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    signatarioId: { type: "string", format: "uuid" },
    tipoAssinatura: { type: "string", enum: ["PARECER_JURIDICO", "DESPACHO", "CONTRATO", "AUTO_FISCALIZACAO"] },
    algoritmo: { type: "string", enum: ["ED25519", "HMAC_LEGADO"] },
    assinaturaDigital: { type: "string", nullable: true },
    ipOrigem: { type: "string", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
  },
};

const emissaoDocumentoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    referenciaTipo: { type: "string", enum: ["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"] },
    referenciaId: { type: "string", format: "uuid" },
    versao: { type: "integer" },
    hashConteudo: { type: "string" },
    codigoVerificacao: { type: "string" },
    origemLegado: { type: "boolean" },
    substituidaPorId: { type: "string", format: "uuid", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    assinaturas: { type: "array", items: signatarioAssinaturaObject },
  },
};

export const assinarDocumentoDocs = {
  schema: {
    tags: ["Assinatura Electrónica"],
    summary: "Assinar electronicamente um documento/decisão",
    description:
      "Secções 5.4 e 20 do documento técnico. Assinatura Ed25519 por signatário, vinculada ao " +
      "tipo/id/versão do documento — não é reutilizável fora desse contexto (ver assinatura.crypto.ts). " +
      "O conteúdo é resolvido pelo servidor, nunca enviado pelo chamador.",
    body: {
      type: "object",
      required: ["referenciaTipo", "referenciaId", "tipoAssinatura"],
      properties: {
        referenciaTipo: { type: "string", enum: ["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"] },
        referenciaId: { type: "string", format: "uuid" },
        tipoAssinatura: { type: "string", enum: ["PARECER_JURIDICO", "DESPACHO", "CONTRATO", "AUTO_FISCALIZACAO"] },
      },
    },
    response: { 201: signatarioAssinaturaObject },
  },
};

export const listarAssinaturasDocs = {
  schema: {
    tags: ["Assinatura Electrónica"],
    summary: "Listar emissões e assinaturas de um documento (todas as versões)",
    querystring: {
      type: "object",
      required: ["referenciaTipo", "referenciaId"],
      properties: {
        referenciaTipo: { type: "string", enum: ["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"] },
        referenciaId: { type: "string", format: "uuid" },
      },
    },
    response: { 200: { type: "array", items: emissaoDocumentoObject } },
  },
};

export const verificarPublicoDocs = {
  schema: {
    tags: ["Assinatura Electrónica"],
    summary: "Verificar publicamente um documento pelo código impresso ou destino do QR code",
    description:
      "Rota pública, sem autenticação — é o destino do QR code impresso no documento e do " +
      "código curto de verificação manual. Resolve o conteúdo actual do documento a partir da " +
      "fonte de verdade e compara contra a emissão assinada; nunca aceita conteúdo por parâmetro.",
    params: {
      type: "object",
      required: ["codigo"],
      properties: { codigo: { type: "string", minLength: 6, maxLength: 20 } },
    },
    response: {
      200: {
        type: "object",
        properties: {
          valido: { type: "boolean" },
          conteudoAlterado: { type: "boolean" },
          origemLegado: { type: "boolean" },
          versao: { type: "integer" },
          versaoMaisRecente: { type: "boolean" },
          codigoVerificacao: { type: "string" },
          assinaturas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                signatarioId: { type: "string", format: "uuid" },
                valida: { type: "boolean" },
                algoritmo: { type: "string", enum: ["ED25519", "HMAC_LEGADO"] },
                motivo: { type: "string", nullable: true },
                tipoAssinatura: { type: "string", nullable: true },
                criadoEm: { type: "string", format: "date-time", nullable: true },
              },
            },
          },
        },
      },
      404: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      422: {
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  },
};

export const gerarPdfDocs = {
  schema: {
    tags: ["Assinatura Electrónica"],
    summary: "Gerar o PDF oficial da última versão assinada de um documento, com QR de verificação embutido",
    params: {
      type: "object",
      required: ["tipo", "id"],
      properties: {
        tipo: { type: "string", enum: ["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"] },
        id: { type: "string", format: "uuid" },
      },
    },
    response: {
      200: { type: "string", format: "binary", description: "Ficheiro PDF (application/pdf)" },
      404: { type: "object", properties: { message: { type: "string" } } },
    },
  },
};