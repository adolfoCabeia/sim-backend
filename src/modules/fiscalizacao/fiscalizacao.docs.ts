const detalheObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    processoId: { type: "string", format: "uuid" },
    tipoAccao: { type: "string", enum: ["AUTO_NOTICIA", "CONTRA_ORDENACAO", "VISTORIA"] },
    estabelecimentoNome: { type: "string", nullable: true },
    estabelecimentoEndereco: { type: "string", nullable: true },
    tipoInfraccao: { type: "string", nullable: true },
    descricaoInfraccao: { type: "string", nullable: true },
    valorCoima: { type: "number", nullable: true },
    coimaAplicadaEm: { type: "string", format: "date-time", nullable: true },
    dataVistoria: { type: "string", format: "date-time", nullable: true },
    fiscalResponsavelId: { type: "string", format: "uuid", nullable: true },
  },
};

export const criarAccaoDocs = {
  schema: {
    tags: ["Fiscalização"],
    summary: "Registar nova acção de fiscalização (auto de notícia, contra-ordenação ou vistoria)",
    description: "Secção 13 do documento técnico. Cria o processo genérico + os campos de domínio da fiscalização.",
    body: {
      type: "object",
      required: ["tipoAccao", "assunto"],
      properties: {
        tipoAccao: { type: "string", enum: ["AUTO_NOTICIA", "CONTRA_ORDENACAO", "VISTORIA"] },
        assunto: { type: "string" },
        estabelecimentoNome: { type: "string" },
        estabelecimentoEndereco: { type: "string" },
        tipoInfraccao: { type: "string" },
        descricaoInfraccao: { type: "string" },
        dataVistoria: { type: "string", format: "date-time" },
        fiscalResponsavelId: { type: "string", format: "uuid" },
      },
    },
    response: { 201: { type: "object", properties: { processo: { type: "object" }, detalhe: detalheObject } } },
  },
};

export const obterAccaoDocs = {
  schema: {
    tags: ["Fiscalização"],
    summary: "Obter uma acção de fiscalização pelo id do processo",
    params: { type: "object", properties: { processoId: { type: "string", format: "uuid" } }, required: ["processoId"] },
    response: { 200: detalheObject, 404: { type: "object", properties: { error: { type: "string" } } } },
  },
};

export const listarAccoesDocs = {
  schema: {
    tags: ["Fiscalização"],
    summary: "Listar acções de fiscalização",
    querystring: {
      type: "object",
      properties: {
        tipoAccao: { type: "string", enum: ["AUTO_NOTICIA", "CONTRA_ORDENACAO", "VISTORIA"] },
        estabelecimentoNome: { type: "string" },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: {
      200: { type: "object", properties: { data: { type: "array", items: detalheObject }, total: { type: "integer" } } },
    },
  },
};

export const historicoEstabelecimentoDocs = {
  schema: {
    tags: ["Fiscalização"],
    summary: "Histórico de fiscalizações de um estabelecimento",
    description: "Secção 13: 'Histórico de estabelecimentos — Vista consolidada por estabelecimento fiscalizado'.",
    params: { type: "object", properties: { nome: { type: "string" } }, required: ["nome"] },
    response: { 200: { type: "array", items: detalheObject } },
  },
};

export const registarCoimaDocs = {
  schema: {
    tags: ["Fiscalização"],
    summary: "Registar aplicação de coima",
    description:
      "Secção 13: 'Aplicação de coimas — Sujeita a despacho do Administrador'. Reservado à permissão " +
      "fiscalizacao:aplicar-coima (tipicamente só o Administrador Municipal).",
    params: { type: "object", properties: { processoId: { type: "string", format: "uuid" } }, required: ["processoId"] },
    body: { type: "object", required: ["valorCoima"], properties: { valorCoima: { type: "number" } } },
    response: { 200: detalheObject },
  },
};