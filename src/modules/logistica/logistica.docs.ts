  const erroResponse = {
    type: "object",
    properties: { success: { type: "boolean" }, message: { type: "string" } },
  };

  const paginado = (items: object) => ({
    type: "object",
    properties: {
      success: { type: "boolean" },
      data: {
        type: "object",
        properties: {
          items: { type: "array", items },
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
    },
  });

  const requisicaoResumoObject = {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      numero: { type: "string" },
      categoria: { type: "string" },
      estado: { type: "string" },
      designacao: { type: "string", nullable: true },
      destinatario: { type: "string", nullable: true },
      direcao: { type: "object", properties: { id: { type: "string" }, nome: { type: "string" } }, nullable: true },
      requerente: { type: "object", properties: { id: { type: "string" }, nomeCompleto: { type: "string" } } },
      // "itens" tem forma variável (é só um preview, take: 3) — schema
      // vazio evita que o fast-json-stringify apague o conteúdo de cada item.
      itens: { type: "array", items: {} },
      _count: { type: "object", properties: { itens: { type: "integer" }, anexos: { type: "integer" } } },
    },
  };

  export const listarRequisicoesDocs = {
    schema: {
      tags: ["Logística"],
      summary: "Listar requisições",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          pageSize: { type: "integer", default: 20 },
          categoria: { type: "string", enum: ["BEM", "SERVICO", "EMPREITADA"] },
          estado: { type: "string", enum: ["RASCUNHO", "SUBMETIDA", "APROVADA", "REJEITADA", "EM_EXECUCAO", "CONCLUIDA"] },
          direcaoId: { type: "string", format: "uuid" },
        },
      },
      response: { 200: paginado(requisicaoResumoObject), 403: erroResponse },
    },
  };

  export const obterRequisicaoDocs = {
    schema: {
      tags: ["Logística"],
      summary: "Obter requisição por id",
      security: [{ bearerAuth: [] }],
      params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
      // "data" é a entidade Requisicao completa, com forma variável por
      // categoria (BEM/SERVICO/EMPREITADA) — schema vazio ({}) faz
      // passthrough em vez de descrever (e sem "properties" o
      // fast-json-stringify apagava tudo, devolvendo {}).
      response: {
        200: { type: "object", properties: { success: { type: "boolean" }, data: {} } },
        404: erroResponse,
      },
    },
  };

  export const criarRequisicaoDocs = {
    schema: {
      tags: ["Logística"],
      summary: "Criar requisição (Bem, Serviço ou Empreitada)",
      description: "Bem: enviar array de itens. Empreitada: anexar no mínimo 2 imagens (anexo_0, anexo_1, ...). Validação feita manualmente no controller (Zod), não via AJV.",
      security: [{ bearerAuth: [] }],
      consumes: ["application/json", "multipart/form-data"],
      response: {
        201: { type: "object", properties: { success: { type: "boolean" }, data: {} } },
        403: erroResponse,
        409: erroResponse,
      },
    },
  };

  export const alterarEstadoDocs = {
    schema: {
      tags: ["Logística"],
      summary: "Alterar estado da requisição",
      description: "Fluxo: RASCUNHO→SUBMETIDA→APROVADA→EM_EXECUCAO→CONCLUIDA. REJEITADA pode voltar a RASCUNHO.",
      security: [{ bearerAuth: [] }],
      params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
      body: { type: "object", required: ["estado"], properties: { estado: { type: "string" }, motivo: { type: "string" } } },
      // O controller também devolve "data" (a requisição actualizada),
      // além de "message" — o schema tinha de o declarar, senão era
      // apagado da resposta tal como aconteceu com obterRequisicaoDocs.
      response: {
        200: { type: "object", properties: { success: { type: "boolean" }, data: {}, message: { type: "string" } } },
        404: erroResponse,
        409: erroResponse,
      },
    },
  };

  export const adicionarAnexoDocs = {
    schema: {
      tags: ["Logística"],
      summary: "Adicionar imagem a empreitada",
      consumes: ["multipart/form-data"],
      security: [{ bearerAuth: [] }],
      params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
      response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: {} } } },
    },
  };

  export const actualizarPercentagemDocs = {
    schema: {
      tags: ["Logística"],
      summary: "Actualizar percentagem de execução (empreitada)",
      security: [{ bearerAuth: [] }],
      params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
      body: { type: "object", required: ["percentagem"], properties: { percentagem: { type: "integer", minimum: 0, maximum: 100 } } },
      response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: {} } } },
    },
  };

  export const actualizarRequisicaoDocs = {
    schema: {
      tags: ["Logística"],
      summary: "Actualizar requisição (só em RASCUNHO)",
      security: [{ bearerAuth: [] }],
      params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
      response: {
        200: { type: "object", properties: { success: { type: "boolean" }, data: {} } },
        404: erroResponse,
        409: erroResponse,
      },
    },
  };