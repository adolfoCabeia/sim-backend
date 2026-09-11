const municipioObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    codigo: { type: "string" },
    provincia: { type: "string", nullable: true },
  },
};

export const listarMunicipiosDocs = {
  schema: {
    tags: ["Municípios"],
    summary: "Listar municípios activos",
    description:
      "Endpoint público (sem autenticação) — necessário para preencher o selector de " +
      "município em /auth/register e /auth/login antes de o utilizador ter sessão.",
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: municipioObject },
        },
      },
    },
  },
};

export const listarDirecoesDoMunicipioDocs = {
  schema: {
    tags: ["Municípios"],
    summary: "Listar as unidades orgânicas de um município",
    description: "Público. Útil para ecrãs administrativos que queiram mostrar o organograma completo.",
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
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                nome: { type: "string" },
                sigla: { type: "string" },
                tipo: {
                  type: "string",
                  enum: [
                    "ORGAO_APOIO_CONSULTIVO",
                    "SERVICO_APOIO_TECNICO",
                    "SERVICO_APOIO_INSTRUMENTAL",
                    "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
                  ],
                },
                areaResponsabilidade: { type: "string", nullable: true },
              },
            },
          },
        },
      },
    },
  },
};

export const criarMunicipioDocs = {
  schema: {
    tags: ["Municípios"],
    summary: "Criar um novo município (SUPER_ADMIN)",
    description:
      "Operação de plataforma, não de gestão municipal — só o SUPER_ADMIN pode criar um " +
      "novo município (secção 2, 'Escalabilidade nacional'). Ao criar, o município é " +
      "IMEDIATAMENTE provisionado com as 23 unidades orgânicas-padrão do Artigo 3.º do " +
      "Estatuto Orgânico (mais os departamentos/secções que o diploma define para cada " +
      "uma) — exactamente o mesmo organograma de qualquer outro município do sistema.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nome", "codigo"],
      properties: {
        nome: { type: "string", minLength: 3, maxLength: 100, example: "Cazenga" },
        codigo: { type: "string", minLength: 3, maxLength: 30, example: "AO-LUA-CAZENGA" },
        provincia: { type: "string", minLength: 2, maxLength: 100, example: "Luanda" },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              municipio: municipioObject,
              direcoesCriadas: { type: "integer", example: 23 },
              departamentosCriados: { type: "integer", example: 41 },
            },
          },
        },
      },
      403: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
      409: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};