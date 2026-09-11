const habilitacaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    funcionarioId: { type: "string", format: "uuid" },
    nivel: {
      type: "string",
      enum: [
        "ENSINO_PRIMARIO",
        "ENSINO_SECUNDARIO",
        "TECNICO_MEDIO",
        "BACHARELATO",
        "LICENCIATURA",
        "POS_GRADUACAO",
        "MESTRADO",
        "DOUTORAMENTO",
        "CERTIFICACAO_PROFISSIONAL",
        "OUTRO",
      ],
    },
    curso: { type: "string" },
    instituicao: { type: "string" },
    anoConclusao: { type: "integer", nullable: true },
    // Deixa de ser uma URL enviada pelo cliente: é a storageKey do ficheiro no
    // MinIO. Para obter uma URL de visualização, usar o endpoint dedicado.
    comprovativoUrl: { type: "string", nullable: true, description: "Chave interna do ficheiro no MinIO." },
    criadoEm: { type: "string", format: "date-time" },
  },
};

const utilizadorResumoObject = {
  type: "object",
  description: "Dados da conta associada — departamento e direcção vêm sempre daqui, não do Funcionario.",
  properties: {
    id: { type: "string", format: "uuid" },
    nomeCompleto: { type: "string" },
    email: { type: "string" },
    telefone: { type: "string", nullable: true },
    funcao: { type: "string", nullable: true },
    departamentoId: { type: "string", format: "uuid", nullable: true },
    direcaoId: { type: "string", format: "uuid", nullable: true },
  },
};

const funcionarioObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    utilizadorId: { type: "string", format: "uuid" },
    utilizador: utilizadorResumoObject,
    cargo: { type: "string" },
    contactoTelefone: { type: "string", nullable: true },
    contactoEmail: { type: "string", nullable: true },
    fotografiaUrl: { type: "string", nullable: true, description: "Chave interna do ficheiro no MinIO." },
    cvUrl: { type: "string", nullable: true, description: "Chave interna do ficheiro no MinIO." },
    tipoVinculo: { type: "string", enum: ["QUADRO", "CONTRATO", "ESTAGIARIO"] },
    dataInicioVinculo: { type: "string", format: "date-time" },
    dataFimVinculo: { type: "string", format: "date-time", nullable: true },
    estado: { type: "string", enum: ["ATIVO", "EM_FERIAS", "SUSPENSO", "OUTRO"] },
    observacoes: { type: "string", nullable: true },
    habilitacoes: { type: "array", items: habilitacaoObject },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const urlVisualizacaoObject = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri", description: "URL temporária (presigned) para visualizar/descarregar o ficheiro." },
      },
    },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
});

export const criarFuncionarioDocs = {
  schema: {
    tags: ["Funcionários"],
    summary: "Criar ficha de funcionário",
    description:
      "Abre a ficha de RH para um utilizador interno já existente. Vínculos não-permanentes (Contrato/Estágio) " +
      "exigem data de fim, que activa o alerta de proximidade. Fotografia e CV são opcionais e enviados como " +
      "ficheiros (multipart/form-data). Requer a permissão funcionarios:gerir.",
    security: [{ bearerAuth: [] }],
    consumes: ["multipart/form-data"],
    body: {
      type: "object",
      required: ["utilizadorId", "cargo", "tipoVinculo", "dataInicioVinculo"],
      properties: {
        utilizadorId: { type: "string", format: "uuid" },
        cargo: { type: "string", minLength: 2, maxLength: 120 },
        contactoTelefone: { type: "string", maxLength: 30 },
        contactoEmail: { type: "string", format: "email" },
        tipoVinculo: { type: "string", enum: ["QUADRO", "CONTRATO", "ESTAGIARIO"] },
        dataInicioVinculo: { type: "string", format: "date-time" },
        dataFimVinculo: { type: "string", format: "date-time" },
        observacoes: { type: "string", maxLength: 1000 },
        fotografia: { type: "string", format: "binary", description: "Ficheiro JPEG, PNG ou WebP." },
        cv: { type: "string", format: "binary", description: "Ficheiro PDF." },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: funcionarioObject } },
      400: errorResponse("Dados inválidos (ex.: falta data de fim para vínculo não-permanente, ou tipo de ficheiro inválido)"),
      409: errorResponse("Este utilizador já tem ficha de funcionário"),
    },
  },
};

export const atualizarFuncionarioDocs = {
  schema: {
    tags: ["Funcionários"],
    summary: "Atualizar ficha de funcionário",
    description:
      "Actualiza dados da ficha, incluindo fotografia e CV (opcional, multipart/form-data — substitui o ficheiro " +
      "anterior). O estado 'Em férias' não pode ser definido aqui — é derivado automaticamente dos pedidos de " +
      "férias aprovados. Requer a permissão funcionarios:gerir.",
    security: [{ bearerAuth: [] }],
    consumes: ["multipart/form-data"],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      properties: {
        cargo: { type: "string" },
        contactoTelefone: { type: "string" },
        contactoEmail: { type: "string", format: "email" },
        tipoVinculo: { type: "string", enum: ["QUADRO", "CONTRATO", "ESTAGIARIO"] },
        dataInicioVinculo: { type: "string", format: "date-time" },
        dataFimVinculo: { type: "string", format: "date-time" },
        estado: { type: "string", enum: ["ATIVO", "SUSPENSO", "OUTRO"] },
        observacoes: { type: "string" },
        fotografia: { type: "string", format: "binary", description: "Ficheiro JPEG, PNG ou WebP (substitui o anterior)." },
        cv: { type: "string", format: "binary", description: "Ficheiro PDF (substitui o anterior)." },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: funcionarioObject } },
      400: errorResponse("Dados inválidos ou tipo de ficheiro inválido"),
      404: errorResponse("Funcionário não encontrado"),
    },
  },
};

export const obterFuncionarioDocs = {
  schema: {
    tags: ["Funcionários"],
    summary: "Obter ficha de funcionário",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: funcionarioObject } },
      404: errorResponse("Funcionário não encontrado"),
    },
  },
};

export const obterMeuPerfilDocs = {
  schema: {
    tags: ["Funcionários"],
    summary: "Obter a minha ficha de funcionário",
    description: "Ficha do próprio utilizador autenticado, ou null se ainda não tiver uma.",
    security: [{ bearerAuth: [] }],
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { ...funcionarioObject, nullable: true } } },
    },
  },
};

export const listarFuncionariosDocs = {
  schema: {
    tags: ["Funcionários"],
    summary: "Listar funcionários",
    description: "Requer a permissão funcionarios:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        departamentoId: { type: "string", format: "uuid" },
        tipoVinculo: { type: "string", enum: ["QUADRO", "CONTRATO", "ESTAGIARIO"] },
        estado: { type: "string", enum: ["ATIVO", "EM_FERIAS", "SUSPENSO", "OUTRO"] },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              items: { type: "array", items: funcionarioObject },
              page: { type: "integer" },
              pageSize: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
    },
  },
};

export const obterFotografiaFuncionarioDocs = {
  schema: {
    tags: ["Funcionários"],
    summary: "Obter URL de visualização da fotografia",
    description: "Gera uma URL temporária (presigned) para visualizar a fotografia do funcionário.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: urlVisualizacaoObject,
      404: errorResponse("Funcionário não encontrado, ou não tem fotografia"),
    },
  },
};

export const obterCvFuncionarioDocs = {
  schema: {
    tags: ["Funcionários"],
    summary: "Obter URL de visualização do CV",
    description: "Gera uma URL temporária (presigned) para visualizar o CV do funcionário.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: urlVisualizacaoObject,
      404: errorResponse("Funcionário não encontrado, ou não tem CV"),
    },
  },
};

export const adicionarHabilitacaoDocs = {
  schema: {
    tags: ["Funcionários", "Habilitações"],
    summary: "Adicionar habilitação",
    description:
      "Regista uma qualificação académica/profissional. O comprovativo é opcional e enviado como ficheiro " +
      "(multipart/form-data — PDF, JPEG ou PNG), guardado no MinIO. Requer a permissão funcionarios:gerir.",
    security: [{ bearerAuth: [] }],
    consumes: ["multipart/form-data"],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["nivel", "curso", "instituicao"],
      properties: {
        nivel: {
          type: "string",
          enum: [
            "ENSINO_PRIMARIO",
            "ENSINO_SECUNDARIO",
            "TECNICO_MEDIO",
            "BACHARELATO",
            "LICENCIATURA",
            "POS_GRADUACAO",
            "MESTRADO",
            "DOUTORAMENTO",
            "CERTIFICACAO_PROFISSIONAL",
            "OUTRO",
          ],
        },
        curso: { type: "string" },
        instituicao: { type: "string" },
        anoConclusao: { type: "integer" },
        comprovativo: { type: "string", format: "binary", description: "Ficheiro PDF, JPEG ou PNG." },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: habilitacaoObject } },
      400: errorResponse("Dados inválidos ou tipo de ficheiro inválido"),
      404: errorResponse("Funcionário não encontrado"),
    },
  },
};

export const obterComprovativoHabilitacaoDocs = {
  schema: {
    tags: ["Funcionários", "Habilitações"],
    summary: "Obter URL de visualização do comprovativo",
    description: "Gera uma URL temporária (presigned) para visualizar o comprovativo da habilitação.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id", "habilitacaoId"],
      properties: { id: { type: "string", format: "uuid" }, habilitacaoId: { type: "string", format: "uuid" } },
    },
    response: {
      200: urlVisualizacaoObject,
      404: errorResponse("Habilitação não encontrada, ou não tem comprovativo"),
    },
  },
};

export const removerHabilitacaoDocs = {
  schema: {
    tags: ["Funcionários", "Habilitações"],
    summary: "Remover habilitação",
    description: "Remove também o ficheiro do comprovativo no MinIO, se existir.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id", "habilitacaoId"],
      properties: { id: { type: "string", format: "uuid" }, habilitacaoId: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" } } },
      404: errorResponse("Habilitação não encontrada"),
    },
  },
};