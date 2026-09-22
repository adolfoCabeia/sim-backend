const directorObject = {
  type: "object",
  nullable: true,
  properties: {
    id: { type: "string", format: "uuid" },
    nomeCompleto: { type: "string" },
    email: { type: "string" },
    funcao: { type: "string", nullable: true },
  },
};

const respostaErro = {
  type: "object",
  properties: { success: { type: "boolean" }, message: { type: "string" } },
};

export const listarCandidatosADirectorDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Listar funcionários da direção que podem ser director",
    description:
      "Devolve os utilizadores internos e activos que pertencem à direção, para escolher o director. " +
      "Requer a permissão direcoes:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    querystring: { type: "object", properties: { search: { type: "string" } } },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              directorActualId: { type: "string", format: "uuid", nullable: true },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    nomeCompleto: { type: "string" },
                    email: { type: "string" },
                    funcao: { type: "string", nullable: true },
                    ehDirectorActual: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
      404: respostaErro,
    },
  },
};

export const definirDirectorDocs = {
  schema: {
    tags: ["Direções"],
    summary: "Definir (ou remover) o director de uma direção",
    description:
      "O director tem de pertencer à direção, ter conta interna e activa. Envia utilizadorId = null para remover. " +
      "É o director quem sobe as respostas da direção e distribui os processos. Requer direcoes:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["utilizadorId"],
      properties: { utilizadorId: { type: "string", format: "uuid", nullable: true } },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              nome: { type: "string" },
              sigla: { type: "string" },
              directorId: { type: "string", format: "uuid", nullable: true },
              director: directorObject,
            },
          },
        },
      },
      404: respostaErro,
      422: respostaErro,
    },
  },
};