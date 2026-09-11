export const listarDocs = { schema: { tags: ["Frota"] } };
export const obterDocs = { schema: { tags: ["Frota"] } };
export const criarDocs = { schema: { tags: ["Frota"] } };
export const atualizarDocs = { schema: { tags: ["Frota"] } };
export const removerDocs = { schema: { tags: ["Frota"] } };

export const registrarUsoDocs = {
  schema: {
    tags: ["Frota"],
    summary: "Registrar uso / quilometragem",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["kmPercorridos"],
      properties: {
        kmPercorridos: { type: "integer", minimum: 0 },
        alocacaoActual: { type: "string", nullable: true },
        data: { type: "string", format: "date-time" },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const registrarRevisaoDocs = {
  schema: {
    tags: ["Frota"],
    summary: "Registrar revisão e recalcular próxima",
    description: "Regista a data da revisão e define o novo limite de km para a próxima. Recalcula automaticamente a próxima data de revisão (+6 meses).",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["dataRevisao", "kmProximaRevisao"],
      properties: {
        dataRevisao: { type: "string", format: "date-time" },
        kmProximaRevisao: { type: "integer", minimum: 0 },
        observacoes: { type: "string", nullable: true },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const registrarAbastecimentoDocs = {
  schema: {
    tags: ["Frota"],
    summary: "Registrar abastecimento e recalcular consumo médio",
    description: "Regista abastecimento, atualiza km actual e recalcula consumo médio (km/l). Alerta automaticamente se consumo anómalo.",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["data", "quantidadeLitros", "valor", "kmAtual"],
      properties: {
        data: { type: "string", format: "date-time" },
        quantidadeLitros: { type: "number", exclusiveMinimum: 0 },
        valor: { type: "number", minimum: 0 },
        kmAtual: { type: "integer", minimum: 0 },
      },
    },
    response: { 200: { type: "object" } },
  },
};

export const alertasDocs = {
  schema: {
    tags: ["Frota"],
    summary: "Listar alertas de frota (revisão / abastecimento)",
    description: "Retorna alertas preventivos de frota ordenados por criticidade. Inclui revisões atrasadas, km excedido, revisão iminente (≤7d) e próxima (≤15d).",
    querystring: {
      type: "object",
      properties: { municipioId: { type: "string", format: "uuid" } },
    },
    response: { 200: { type: "array" } },
  },
};