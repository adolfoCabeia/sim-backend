const registoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    funcionarioId: { type: "string", format: "uuid" },
    tipo: { type: "string", enum: ["ENTRADA", "SAIDA"] },
    metodo: { type: "string", enum: ["BIOMETRICO", "MANUAL"] },
    registadoEm: { type: "string", format: "date-time" },
    ipOrigem: { type: "string", nullable: true },
    observacoes: { type: "string", nullable: true },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { message: { type: "string" } },
});

export const registarPontoDocs = {
  schema: {
    tags: ["Ponto Biométrico"],
    summary: "Registar entrada/saída biométrica",
    description:
      "Secção 9.1 do documento técnico. Pensado para ser chamado pelo dispositivo/terminal " +
      "biométrico instalado em cada direcção/secção. Só é permitido um registo de cada tipo " +
      "(ENTRADA/SAIDA) por funcionário por dia.",
    body: {
      type: "object",
      required: ["funcionarioId", "tipo"],
      properties: {
        funcionarioId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["ENTRADA", "SAIDA"] },
        metodo: { type: "string", enum: ["BIOMETRICO", "MANUAL"], default: "BIOMETRICO" },
        observacoes: { type: "string", nullable: true },
      },
    },
    response: {
      201: registoObject,
      404: errorResponse("Funcionário não encontrado"),
      409: errorResponse("Já existe um registo deste tipo hoje para este funcionário"),
    },
  },
};

export const registarPontoManualDocs = {
  schema: {
    tags: ["Ponto Biométrico"],
    summary: "Registar ponto manualmente (RH)",
    description:
      "Para quando o dispositivo biométrico falha ou o funcionário está em serviço externo. " +
      "Exige `observacoes` (justificação) — reservado à permissão funcionarios:gerir. Mesma regra " +
      "de um registo por tipo por dia que o registo biométrico.",
    body: {
      type: "object",
      required: ["funcionarioId", "tipo", "metodo", "observacoes"],
      properties: {
        funcionarioId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["ENTRADA", "SAIDA"] },
        metodo: { type: "string", enum: ["MANUAL"] },
        observacoes: { type: "string" },
      },
    },
    response: {
      201: registoObject,
      404: errorResponse("Funcionário não encontrado"),
      409: errorResponse("Já existe um registo deste tipo hoje para este funcionário"),
    },
  },
};

export const listarRegistosPontoDocs = {
  schema: {
    tags: ["Ponto Biométrico"],
    summary: "Listar registos de ponto",
    querystring: {
      type: "object",
      properties: {
        funcionarioId: { type: "string", format: "uuid" },
        tipo: { type: "string", enum: ["ENTRADA", "SAIDA"] },
        desde: { type: "string", format: "date-time" },
        ate: { type: "string", format: "date-time" },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "50" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          data: { type: "array", items: registoObject },
          total: { type: "integer" },
        },
      },
    },
  },
};

export const obterUltimoRegistoDocs = {
  schema: {
    tags: ["Ponto Biométrico"],
    summary: "Obter o último registo de ponto de hoje para um funcionário",
    params: {
      type: "object",
      properties: { funcionarioId: { type: "string", format: "uuid" } },
      required: ["funcionarioId"],
    },
    response: { 200: { ...registoObject, nullable: true } },
  },
};