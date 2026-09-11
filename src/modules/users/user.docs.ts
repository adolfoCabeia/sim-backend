const utilizadorObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    direcaoId: { type: "string", format: "uuid", nullable: true },
    nomeCompleto: { type: "string", example: "Maria Silva" },
    email: { type: "string", format: "email" },
    tipoConta: {
      type: "string",
      enum: ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"],
    },
    estado: {
      type: "string",
      enum: ["PENDENTE_VALIDACAO", "ACTIVA", "SUSPENSA", "BLOQUEADA"],
    },
    mfaActivo: { type: "boolean" },
    emailConfirmado: { type: "boolean" },
    documentoTipo: { type: "string", nullable: true },
    documentoNumero: { type: "string", nullable: true },
    documentoValidadoEm: { type: "string", format: "date-time", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const permissaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    recurso: { type: "string", example: "patrimonio" },
    accao: { type: "string", example: "criar" },
    chave: { type: "string", example: "patrimonio:criar" },
    descricao: { type: "string", nullable: true },
  },
};

const perfilComPermissoesObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string", example: "Secretário Geral" },
    descricao: { type: "string", nullable: true },
    sistemico: { type: "boolean" },
    permissoes: {
      type: "array",
      items: {
        type: "object",
        properties: { permissao: permissaoObject },
      },
    },
  },
};

export const listarPerfisDisponiveisDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Listar todos os perfis do sistema",
    description: "Catálogo global de perfis (entidade sem município — partilhada por todos).",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: perfilComPermissoesObject },
        },
      },
    },
  },
};

const perfilObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string", example: "Secretário Geral" },
    descricao: { type: "string", nullable: true },
    sistemico: { type: "boolean" },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
});


export const listarUtilizadoresDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Listar utilizadores (paginado, com filtro e pesquisa)",
    description:
      "Lista os utilizadores do município do chamador. Requer a permissão " +
      "utilizadores:editar (ou outra equivalente de leitura administrativa).",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        estado: {
          type: "string",
          enum: ["PENDENTE_VALIDACAO", "ACTIVA", "SUSPENSA", "BLOQUEADA"],
        },
        tipoConta: {
          type: "string",
          enum: ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"],
        },
        q: { type: "string", description: "Pesquisa livre por nome ou email" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              items: { type: "array", items: utilizadorObject },
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

export const obterUtilizadorDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Obter detalhe de um utilizador",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: utilizadorObject } },
      404: errorResponse("Utilizador não encontrado"),
    },
  },
};

export const criarUtilizadorDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Criar utilizador (administrativo)",
    description:
      "Criação administrativa de conta — distinta de /auth/register (self-service). " +
      "Permite criar a conta já ACTIVA, saltando o fluxo de validação de identidade " +
      "da secção 5.3 (uso típico: staff cuja identidade já foi confirmada " +
      "presencialmente). Requer a permissão utilizadores:criar. Por omissão fica no " +
      "município de quem cria; só o SUPER_ADMIN pode indicar um municipioId diferente.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nomeCompleto", "email", "password", "tipoConta"],
      properties: {
        nomeCompleto: { type: "string", minLength: 3, maxLength: 150 },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 10 },
        tipoConta: {
          type: "string",
          enum: ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"],
        },
        direcaoSigla: {
          type: "string",
          nullable: true,
          description:
            "Sigla fixa do catálogo (ex.: 'DME', 'GAM') — não o UUID. O backend resolve " +
            "automaticamente a linha certa dentro do município de destino.",
          example: "DME",
        },
        estado: {
          type: "string",
          enum: ["PENDENTE_VALIDACAO", "ACTIVA"],
          default: "PENDENTE_VALIDACAO",
        },
        municipioId: {
          type: "string",
          format: "uuid",
          nullable: true,
          description: "Só tem efeito se quem chama for SUPER_ADMIN — ignorado/rejeitado para os restantes perfis.",
        },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: utilizadorObject } },
      409: errorResponse("Já existe uma conta com este email"),
    },
  },
};

export const editarUtilizadorDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Editar dados de um utilizador",
    description:
      "Edita nomeCompleto/direcaoSigla de OUTRO utilizador. Não permite alterar email, " +
      "password, estado ou tipoConta — cada um tem rota própria. Requer a permissão " +
      "utilizadores:editar.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      properties: {
        nomeCompleto: { type: "string", minLength: 3, maxLength: 150 },
        direcaoSigla: {
          type: "string",
          nullable: true,
          description: "Sigla fixa do catálogo (ex.: 'DME'). Envia null para remover a direcção.",
          example: "DME",
        },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: utilizadorObject } },
      404: errorResponse("Utilizador não encontrado"),
    },
  },
};

export const alterarEstadoDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Alterar estado da conta (activar/suspender/bloquear)",
    description:
      "Única forma administrativa de mudar o ciclo de vida de uma conta sem passar " +
      "pelo fluxo formal de validação de identidade (secção 5.3). Não é permitido " +
      "alterar o próprio estado. Requer a permissão utilizadores:desactivar.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      required: ["estado"],
      properties: {
        estado: {
          type: "string",
          enum: ["PENDENTE_VALIDACAO", "ACTIVA", "SUSPENSA", "BLOQUEADA"],
        },
        motivo: { type: "string", minLength: 5, maxLength: 500, nullable: true },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: utilizadorObject } },
      403: errorResponse("Tentativa de alterar o próprio estado"),
      404: errorResponse("Utilizador não encontrado"),
    },
  },
};

export const desactivarUtilizadorDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Desactivar utilizador (atalho para estado=SUSPENSA)",
    description:
      "Atalho equivalente a PATCH /utilizadores/:id/estado com estado=SUSPENSA. " +
      "Nunca elimina o registo — preserva o histórico de auditoria e as relações " +
      "com outras entidades (Processo, Documento, etc.).",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: utilizadorObject } },
      403: errorResponse("Tentativa de desactivar a própria conta"),
      404: errorResponse("Utilizador não encontrado"),
    },
  },
};

export const redefinirPasswordDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Redefinir a password de um funcionário (Administrador Municipal / RH)",
    description:
      "Só se aplica a contas INTERNO. Gera uma password temporária aleatória, força a troca no " +
      "primeiro login seguinte (o utilizador fica bloqueado em todos os outros endpoints até " +
      "trocar a password) e revoga todas as sessões activas da conta. Contas externas " +
      "(Cidadão/Empresa/Instituição/Comissão de Moradores) usam antes o recovery por email — " +
      "POST /auth/forgot-password.",
    security: [{ bearerAuth: [] }],
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
          message: { type: "string" },
          data: { type: "object", properties: { temporaryPassword: { type: "string" } } },
        },
      },
      404: errorResponse("Utilizador não encontrado"),
      409: errorResponse("A conta não é do tipo INTERNO"),
    },
  },
};
export const obterMeuPerfilDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Obter o meu perfil",
    description:
      "Dados da própria conta autenticada, incluindo os perfis RBAC atribuídos, as " +
      "permissões efectivas e o nome do município.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            allOf: [
              utilizadorObject,
              {
                type: "object",
                properties: {
                  municipioNome: { type: "string", example: "Viana" },
                  perfis: {
                    type: "array",
                    items: {
                      allOf: [
                        perfilObject,
                        {
                          type: "object",
                          properties: { atribuidoEm: { type: "string", format: "date-time" } },
                        },
                      ],
                    },
                  },
                  permissoes: {
                    type: "array",
                    items: { type: "string", example: "processos:despachar" },
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
};
export const editarMeuPerfilDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Editar o meu nome",
    description:
      "Auto-gestão: o próprio utilizador edita o seu nomeCompleto. Não inclui " +
      "direcaoId (mudar de direcção é decisão administrativa de RH, não auto-gestão).",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nomeCompleto"],
      properties: { nomeCompleto: { type: "string", minLength: 3, maxLength: 150 } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: utilizadorObject } },
    },
  },
};

export const changePasswordDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Trocar a minha password",
    description:
      "Exige a password actual mesmo com sessão válida — mitigação contra sessão " +
      "roubada ou computador destrancado.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["passwordActual", "novaPassword"],
      properties: {
        passwordActual: { type: "string" },
        novaPassword: { type: "string", minLength: 10 },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Password alterada com sucesso." },
        },
      },
      400: errorResponse("Password actual incorrecta"),
    },
  },
};

export const listarPerfisDoUtilizadorDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Listar perfis atribuídos a um utilizador",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: {
        type: "object",
        properties: { success: { type: "boolean" }, data: { type: "array", items: perfilObject } },
      },
    },
  },
};

export const atribuirPerfilDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Atribuir perfil a um utilizador",
    description:
      "Requer a permissão utilizadores:atribuir_perfil. Não é permitido atribuir " +
      "perfis a si próprio (princípio do menor privilégio + anti-auto-escalada, " +
      "secção 5.4 do documento).",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    body: {
      type: "object",
      required: ["perfilId"],
      properties: { perfilId: { type: "string", format: "uuid" } },
    },
    response: {
      201: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Perfil atribuído com sucesso." },
        },
      },
      403: errorResponse("Tentativa de auto-escalada de permissões"),
    },
  },
};

export const revogarPerfilDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Revogar perfil de um utilizador",
    description: "Requer a permissão utilizadores:atribuir_perfil. Não permite auto-revogação.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id", "perfilId"],
      properties: {
        id: { type: "string", format: "uuid" },
        perfilId: { type: "string", format: "uuid" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Perfil revogado com sucesso." },
        },
      },
      403: errorResponse("Tentativa de auto-escalada de permissões"),
    },
  },
};

export const listarPermissoesDisponiveisDocs = {
  schema: {
    tags: ["Utilizadores"],
    summary: "Listar todas as permissões do sistema",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: { success: { type: "boolean" }, data: { type: "array", items: permissaoObject } },
      },
    },
  },
};