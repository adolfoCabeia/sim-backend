const erroResponse = {
  type: "object",
  properties: { success: { type: "boolean" }, message: { type: "string" } },
};

const perfilObject = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    descricao: { type: "string", nullable: true },
    sistemico: { type: "boolean" },
    activo: { type: "boolean" },
    acessoIlimitadoPonto: { type: "boolean", description: "Se true, este perfil fica isento da janela de horário do registo de ponto." },
    permissoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          permissaoId: { type: "string", format: "uuid" },
          permissao: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              recurso: { type: "string" },
              accao: { type: "string" },
              chave: { type: "string" },
              descricao: { type: "string", nullable: true },
            },
          },
        },
      },
    },
  },
};

const permissaoObject = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string", format: "uuid" },
    recurso: { type: "string" },
    accao: { type: "string" },
    chave: { type: "string" },
    descricao: { type: "string", nullable: true },
  },
};

// ─── LISTAR ───
export const listarPerfisDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Listar perfis (SUPER_ADMIN)",
    description: "Lista todos os perfis activos, incluindo as permissões associadas a cada um.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: perfilObject },
        },
      },
      403: erroResponse,
    },
  },
};

export const listarPermissoesDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Listar permissões (SUPER_ADMIN)",
    description: "Lista todas as permissões registadas no sistema, ordenadas por recurso e acção.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: permissaoObject },
        },
      },
      403: erroResponse,
    },
  },
};

// ─── CRIAR / DESACTIVAR ───
export const criarPerfilDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Criar um novo perfil (SUPER_ADMIN)",
    description:
      "Cria um perfil não-sistémico. Os 13 perfis oficiais do Estatuto Orgânico (SUPER_ADMIN, ADMINISTRADOR_MUNICIPAL, " +
      "etc.) são semeados como `sistemico: true` e não podem ser criados nem desactivados por aqui.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["nome"],
      properties: { nome: { type: "string", example: "Assistente Administrativo" }, descricao: { type: "string" } },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: perfilObject } },
      403: erroResponse,
      409: erroResponse,
    },
  },
};

export const desactivarPerfilDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Desactivar um perfil (SUPER_ADMIN)",
    description: "Não é permitido desactivar nenhum dos 13 perfis sistémicos.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
      403: erroResponse,
      404: erroResponse,
    },
  },
};

export const definirAcessoIlimitadoPontoDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Definir se um perfil tem acesso ilimitado ao ponto (SUPER_ADMIN)",
    description:
      "Antes era uma lista fixa no código (PERFIS_ACESSO_ILIMITADO); agora o Administrador decide, perfil a perfil, " +
      "se os utilizadores desse perfil ficam isentos da janela de horário (08h-16h) do registo de ponto.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["acessoIlimitadoPonto"],
      properties: { acessoIlimitadoPonto: { type: "boolean" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: perfilObject } },
      404: erroResponse,
    },
  },
};

export const criarPermissaoDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Criar uma nova permissão (SUPER_ADMIN)",
    description: "A chave final é gerada como `{recurso}:{accao}` — ex.: recurso 'processos', accao 'despachar' → 'processos:despachar'.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["recurso", "accao"],
      properties: {
        recurso: { type: "string", example: "processos" },
        accao: { type: "string", example: "despachar" },
        descricao: { type: "string" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: permissaoObject } },
      409: erroResponse,
    },
  },
};

// ─── ASSOCIAÇÕES ───
export const associarPermissaoDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Associar uma permissão a um perfil (SUPER_ADMIN)",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: { type: "object", required: ["permissaoId"], properties: { permissaoId: { type: "string", format: "uuid" } } },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};

export const desassociarPermissaoDocs = {
  schema: {
    tags: ["RBAC"],
    summary: "Remover uma permissão de um perfil (SUPER_ADMIN)",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id", "permissaoId"],
      properties: { id: { type: "string", format: "uuid" }, permissaoId: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
    },
  },
};