const utilizadorObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nomeCompleto: { type: "string", example: "Maria Silva" },
    email: { type: "string", format: "email", example: "maria.silva@viana.gov.ao" },
    municipioId: { type: "string", format: "uuid" },
    tipoConta: {
      type: "string",
      enum: ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"],
      example: "INTERNO",
    },
    estado: {
      type: "string",
      enum: ["PENDENTE_VALIDACAO", "ACTIVA", "SUSPENSA", "BLOQUEADA"],
      example: "ACTIVA",
    },
    mfaActivo: { type: "boolean", example: false },
  },
};

const registoResultObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    estado: {
      type: "string",
      enum: ["PENDENTE_VALIDACAO", "ACTIVA", "SUSPENSA", "BLOQUEADA"],
      example: "PENDENTE_VALIDACAO",
    },
    emailConfirmado: { type: "boolean", example: false },
  },
};

const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
    code: { type: "string", nullable: true, example: "MFA_OBRIGATORIO" },
  },
});

export const registerDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Registar nova conta",
    description:
      "Cria uma nova conta no município indicado. Contas CIDADAO, EMPRESA e INSTITUICAO " +
      "recebem um email de confirmação (via Brevo) antes de poderem iniciar sessão. " +
      "Contas INTERNO e COMISSAO_MORADORES não usam confirmação por email, ficam " +
      "PENDENTE_VALIDACAO até um administrador validar a identidade (secção 5.3 do documento). " +
      "Quando 'documentoNumero' é indicado (ex.: número do BI), fica gravado na conta e passa a " +
      "poder ser usado como 'identificador' no login, em alternativa ao email.",
    body: {
      type: "object",
      required: ["municipioId", "nomeCompleto", "email", "password", "tipoConta"],
      properties: {
        municipioId: { type: "string", format: "uuid" },
        nomeCompleto: { type: "string", minLength: 3, maxLength: 150, example: "Maria Silva" },
        email: { type: "string", format: "email", example: "maria.silva@viana.gov.ao" },
        password: {
          type: "string",
          minLength: 10,
          description: "Mínimo 10 caracteres, com maiúscula, minúscula e número.",
          example: "SenhaForte123",
        },
        tipoConta: {
          type: "string",
          enum: ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"],
          example: "CIDADAO",
        },
        direcaoSigla: {
          type: "string",
          description: "Obrigatório quando tipoConta = INTERNO. Sigla da direcção municipal.",
        },
        areaResponsabilidade: {
          type: "string",
          enum: ["POLITICA_SOCIAL_COMUNIDADE", "ECONOMICA_FINANCEIRA", "TECNICA_INFRAESTRUTURAS_SERVICOS"],
        },
        telefone: { type: "string" },
        endereco: { type: "string" },
        documentoTipo: {
          type: "string",
          enum: ["BI", "PASSAPORTE", "CARTAO_CIDADAO"],
          description: "Tem de ser enviado em conjunto com documentoNumero.",
        },
        documentoNumero: {
          type: "string",
          minLength: 3,
          maxLength: 50,
          description:
            "Número do documento de identificação. Único em todo o sistema — fica disponível " +
            "como identificador alternativo de login (ver POST /auth/login). Tem de ser enviado " +
            "em conjunto com documentoTipo.",
        },
        nomeEmpresa: { type: "string", description: "Para tipoConta = EMPRESA" },
        nifEmpresa: { type: "string", description: "Para tipoConta = EMPRESA — duplica como identificador de login do Portal Empresarial" },
        nomeInstituicao: { type: "string", description: "Para tipoConta = INSTITUICAO" },
        nipcInstituicao: { type: "string", description: "Para tipoConta = INSTITUICAO — duplica como identificador de login do Portal Institucional" },
        nomeComissao: { type: "string", description: "Para tipoConta = COMISSAO_MORADORES" },
        bairroZona: { type: "string", description: "Para tipoConta = COMISSAO_MORADORES" },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: registoResultObject,
        },
      },
      400: errorResponse("Dados inválidos (ex.: INTERNO sem direcaoSigla, ou documentoTipo sem documentoNumero)"),
      409: errorResponse("Já existe uma conta com este email, ou com este número de documento"),
    },
  },
};

export const confirmEmailDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Confirmar email",
    description:
      "Confirma o email de uma conta CIDADAO/EMPRESA/INSTITUICAO a partir do token " +
      "recebido por email. O token é de uso único e expira em 24 horas (configurável).",
    body: {
      type: "object",
      required: ["token"],
      properties: {
        token: { type: "string", description: "Token recebido no link de confirmação" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Email confirmado com sucesso." },
        },
      },
      400: errorResponse("Token inválido, expirado ou já usado"),
    },
  },
};

export const loginDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Iniciar sessão",
    description:
      "Autentica o utilizador e devolve um access token (JWT, curta duração) no corpo " +
      "da resposta, e entrega o refresh token (longa duração, revogável) num cookie " +
      "httpOnly — nunca no corpo, para mitigar roubo de token via XSS. Clientes mobile " +
      "(header `X-Client-Type: mobile`) recebem o refresh token também no corpo, por " +
      "não terem cookie jar persistente da mesma forma que um browser. Se a conta " +
      "tiver MFA activo, o campo mfaToken é obrigatório. Contas PENDENTE_VALIDACAO " +
      "conseguem autenticar-se normalmente (necessário para submeter o documento de " +
      "identidade — secção 5.3); apenas SUSPENSA e BLOQUEADA são rejeitadas aqui. " +
      "data.utilizador.estado indica o estado real, para o cliente decidir o próximo passo.",
    headers: {
      type: "object",
      properties: {
        "x-client-type": {
          type: "string",
          enum: ["mobile"],
          description: "Definir como 'mobile' para receber o refreshToken também no corpo da resposta.",
        },
      },
    },
    body: {
      type: "object",
      required: ["identificador", "password"],
      properties: {
        identificador: {
          type: "string",
          minLength: 3,
          description: "Email ou número de BI do utilizador.",
          example: "maria.silva@viana.gov.ao",
        },
        password: { type: "string" },
        mfaToken: {
          type: "string",
          minLength: 6,
          maxLength: 6,
          nullable: true,
          description: "Obrigatório apenas se a conta tiver MFA activo. 6 dígitos numéricos.",
        },
      },
    },
    response: {
      200: {
        type: "object",
        description:
          "O refresh token é entregue via cookie httpOnly 'simviana_refresh_token' " +
          "(Set-Cookie), e só aparece também em data.refreshToken para clientes mobile.",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              utilizador: utilizadorObject,
              accessToken: { type: "string" },
              refreshToken: {
                type: "string",
                nullable: true,
                description: "Presente apenas quando X-Client-Type: mobile foi enviado.",
              },
            },
          },
        },
      },
      401: errorResponse("Credenciais inválidas, MFA obrigatório ou MFA inválido"),
      403: errorResponse("Conta não activa ou email não confirmado"),
      423: errorResponse("Conta temporariamente bloqueada por excesso de tentativas"),
    },
  },
};

export const refreshDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Renovar sessão",
    description:
      "Troca um refresh token válido por um novo par access/refresh token (rotação). " +
      "Lê o refresh token do cookie httpOnly por omissão; só usa o corpo se o cookie " +
      "não estiver presente (caminho dos clientes mobile). Se o refresh token já tiver " +
      "sido usado anteriormente, todas as sessões do utilizador são revogadas por " +
      "segurança (possível indício de roubo de token).",
    body: {
      type: "object",
      properties: {
        refreshToken: {
          type: "string",
          nullable: true,
          description: "Só necessário se não houver cookie (clientes mobile).",
        },
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
              accessToken: { type: "string" },
              refreshToken: { type: "string", nullable: true },
            },
          },
        },
      },
      401: errorResponse("Refresh token inválido, expirado, reutilizado, ou ausente (nem cookie, nem corpo)"),
    },
  },
};

export const logoutDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Terminar sessão",
    description:
      "Revoga o refresh token (lido do cookie httpOnly por omissão, ou do corpo para " +
      "clientes mobile) e limpa o cookie. O access token actual continua válido até " +
      "expirar (curta duração) — é stateless e não é revogável antes disso.",
    body: {
      type: "object",
      properties: {
        refreshToken: {
          type: "string",
          nullable: true,
          description: "Só necessário se não houver cookie (clientes mobile).",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Sessão terminada." },
        },
      },
    },
  },
};

export const initiateMfaDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Iniciar configuração de MFA",
    description:
      "Gera um novo segredo TOTP para o utilizador autenticado e devolve um QR code " +
      "(data URL) para sincronizar com uma app de autenticação (Google Authenticator, " +
      "Authy, etc.). O MFA só fica activo depois de confirmado com /auth/mfa/confirm.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              qrCodeDataUrl: { type: "string", description: "Imagem PNG em base64 (data URL)" },
              secret: { type: "string", description: "Segredo TOTP em texto, para inserção manual" },
            },
          },
        },
      },
    },
  },
};

export const confirmMfaDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Confirmar e activar MFA",
    description:
      "Confirma a configuração de MFA com um código de 6 dígitos gerado pela app de " +
      "autenticação. Só depois desta confirmação o MFA passa a ser exigido no login.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["token"],
      properties: {
        token: { type: "string", minLength: 6, maxLength: 6, example: "123456" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "MFA activado com sucesso." },
        },
      },
      400: errorResponse("Código MFA inválido"),
    },
  },
};

export const forgotPasswordDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Pedir recuperação de password",
    description:
      "Disponível apenas para contas CIDADAO, EMPRESA, INSTITUICAO e COMISSAO_MORADORES. " +
      "Contas INTERNO não usam este fluxo — a password é redefinida pelo Administrador " +
      "Municipal/RH via POST /utilizadores/:id/redefinir-password. Por design, a resposta é " +
      "sempre a mesma (200, mesma mensagem, tempo de resposta normalizado), quer a conta " +
      "exista ou não, e quer seja ou não elegível — isto evita enumeração de contas/tipos de " +
      "conta por terceiros. Também está limitado a 3 pedidos por email a cada 15 minutos, além " +
      "do limite por IP.",
    body: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email", example: "maria.silva@viana.gov.ao" },
      },
    },
    response: {
      200: {
        type: "object",
        description:
          "Resposta sempre igual, independentemente de a conta existir, ser elegível, ou já " +
          "ter atingido o limite de pedidos — de propósito, para não revelar essa informação.",
        properties: {
          success: { type: "boolean", example: true },
          message: {
            type: "string",
            example: "Se existir uma conta elegível com este email, foi enviado um link de recuperação de password.",
          },
        },
      },
    },
  },
};

export const resetPasswordDocs = {
  schema: {
    tags: ["Auth"],
    summary: "Redefinir password com token de recuperação",
    description:
      "Define uma nova password a partir do token de uso único recebido por email em " +
      "POST /auth/forgot-password. O token expira decorridas PASSWORD_RESET_EXPIRES_IN_HOURS " +
      "horas. Ao ser usado com sucesso, todas as sessões (refresh tokens) activas do " +
      "utilizador são revogadas, obrigando a novo login em todos os dispositivos.",
    body: {
      type: "object",
      required: ["token", "novaPassword", "confirmarPassword"],
      properties: {
        token: { type: "string", description: "Token recebido no link de recuperação" },
        novaPassword: {
          type: "string",
          minLength: 10,
          description: "Mínimo 10 caracteres, com maiúscula, minúscula e número.",
          example: "SenhaForte123",
        },
        confirmarPassword: { type: "string", description: "Tem de coincidir com novaPassword." },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Password redefinida com sucesso. Inicie sessão com a nova password." },
        },
      },
      400: errorResponse("Token inválido, expirado ou já usado, ou as passwords não coincidem"),
    },
  },
};