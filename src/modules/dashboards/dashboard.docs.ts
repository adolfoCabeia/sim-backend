export const dashboardDireccaoDocs = {
  schema: {
    tags: ["Dashboards"],
    summary: "Dashboard da minha direcção/secção",
    description:
      "Secção 9.3/7 do documento técnico — cada funcionário vê o dashboard da sua própria direcção por " +
      "omissão; um Administrador/Auditor pode indicar 'direcaoId' para ver outra.",
    querystring: {
      type: "object",
      properties: { direcaoId: { type: "string", format: "uuid" } },
    },
    response: {
      200: {
        type: "object",
        properties: {
          direcao: {
            type: "object",
            properties: { id: { type: "string" }, nome: { type: "string" }, sigla: { type: "string" }, tipo: { type: "string" } },
          },
          processos: {
            type: "object",
            properties: {
              porEstado: { type: "object", additionalProperties: { type: "integer" } },
              prazoProximo7Dias: { type: "integer" },
              emAtraso: { type: "integer" },
            },
          },
          documentos: { type: "object", properties: { total: { type: "integer" } } },
          pessoal: { type: "object", properties: { activos: { type: "integer" } } },
        },
      },
      400: { type: "object", properties: { error: { type: "string" } } },
      404: { type: "object", properties: { error: { type: "string" } } },
    },
  },
};

export const dashboardAdministradorDocs = {
  schema: {
    tags: ["Dashboards"],
    summary: "Dashboard Geral do Gabinete do Administrador Municipal",
    description: "Secção 7 do documento técnico — visão agregada de todo o município.",
    response: {
      200: {
        type: "object",
        properties: {
          processos: {
            type: "object",
            properties: {
              porEstado: { type: "object", additionalProperties: { type: "integer" } },
              emAtraso: { type: "integer" },
            },
          },
          organizacao: {
            type: "object",
            properties: { totalDireccoes: { type: "integer" }, totalFuncionariosAtivos: { type: "integer" } },
          },
          ocorrenciasComunitarias: { type: "object", properties: { abertas: { type: "integer" } } },
          comissoesModeradores: { type: "object", properties: { activas: { type: "integer" } } },
          fiscalizacao: { type: "object", additionalProperties: { type: "integer" } },
        },
      },
    },
  },
};

export const painelTransparenciaDocs = {
  schema: {
    tags: ["Dashboards"],
    summary: "Painel de Transparência público (sem autenticação)",
    description:
      "Secção 19.4 do documento técnico. Só expõe contagens agregadas e não sensíveis — sem valores " +
      "financeiros nem dados pessoais. Não passa pelo fluxo de aprovação editorial da secção 19.3.",
    params: {
      type: "object",
      properties: { municipioId: { type: "string", format: "uuid" } },
      required: ["municipioId"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          municipio: { type: "object", properties: { id: { type: "string" }, nome: { type: "string" } } },
          processos: {
            type: "object",
            properties: { concluidos: { type: "integer" }, pendentes: { type: "integer" } },
          },
          organizacao: { type: "object", properties: { totalDireccoes: { type: "integer" } } },
          obrasPublicasEmCurso: { type: "integer" },
        },
      },
      404: { type: "object", properties: { error: { type: "string" } } },
    },
  },
};