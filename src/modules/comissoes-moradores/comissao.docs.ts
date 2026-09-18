const membroObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    nome: { type: "string" },
    cargo: { type: "string" },
    contacto: { type: "string", nullable: true },
  },
};



const utilizadorComissaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    estado: { type: "string", enum: ["PENDENTE_VALIDACAO", "ACTIVA", "SUSPENSA", "BLOQUEADA"] },
    online: { type: "boolean" },
    ultimoLoginEm: { type: "string", format: "date-time", nullable: true },
    deveTrocarPassword: { type: "boolean" },
  },
};

const comissaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    bairro: { type: "string" },
    coordenadasLat: { type: "number", nullable: true },
    coordenadasLng: { type: "number", nullable: true },
    presidenteNome: { type: "string" },
    presidenteContacto: { type: "string", nullable: true },
    documentacaoLegalUrl: { type: "string", nullable: true },
    estado: { type: "string", enum: ["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"] },
    observacoes: { type: "string", nullable: true },
    membros: { type: "array", items: membroObject },
    utilizador: utilizadorComissaoObject,
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

export const criarComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Cadastrar comissão de moradores",
    description:
      "Cria uma comissão de moradores e, junto com ela, uma conta de acesso " +
      "(email + password provisória) associada. A comissão nasce sempre com " +
      "estado EM_REGULARIZACAO — a transição de estado faz-se em " +
      "PATCH /comissoes-moradores/:id/estado. A password provisória é enviada " +
      "por email; a comissão é obrigada a trocá-la no primeiro login.",
   body: {
  type: "object",
  required: ["utilizadorId", "bairro", "presidenteNome"],
  properties: {
    utilizadorId: {
      type: "string",
      format: "uuid",
      description: "Utilizador existente com tipoConta COMISSAO_MORADORES, ainda não associado a nenhuma comissão.",
    },
    bairro: { type: "string" },
    coordenadasLat: { type: "number" },
    coordenadasLng: { type: "number" },
    presidenteNome: { type: "string" },
    presidenteContacto: { type: "string" },
    documentacaoLegalUrl: { type: "string" },
    observacoes: { type: "string" },
    membros: { type: "array", items: membroObject },
  },
},
    response: { 201: comissaoObject, 409: { type: "object", properties: { message: { type: "string" } } } },
  },
};

// NOVO
export const alterarEstadoComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Alterar estado da comissão (activar/desactivar/regularizar)",
    description:
      "Transição controlada de estado. Ao desactivar (INACTIVA), a conta de " +
      "acesso da comissão é suspensa e todas as sessões activas são revogadas. " +
      "Motivo é obrigatório ao desactivar.",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["estado"],
      properties: {
        estado: { type: "string", enum: ["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"] },
        motivo: { type: "string" },
      },
    },
    response: {
      200: comissaoObject,
      404: { type: "object", properties: { message: { type: "string" } } },
      409: { type: "object", properties: { message: { type: "string" }, description: { type: "string", example: "Transição de estado inválida" } } },
    },
  },
};

export const removerComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Desactivar comissão de moradores",
    description:
      "Não remove fisicamente a comissão nem o seu histórico — marca-a como " +
      "INACTIVA e suspende a conta de acesso associada, preservando membros " +
      "e ocorrências para auditoria.",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 204: { type: "null" } },
  },
};

export const listarComissoesDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Listar comissões de moradores",
    description: "Secção 10.5 do documento técnico.",
    querystring: {
      type: "object",
      properties: {
        bairro: { type: "string" },
        estado: { type: "string", enum: ["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"] },
        page: { type: "string", default: "1" },
        limit: { type: "string", default: "20" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: { data: { type: "array", items: comissaoObject }, total: { type: "integer" } },
      },
    },
  },
};

export const obterComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Obter uma comissão de moradores",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: comissaoObject, 404: { type: "object", properties: { error: { type: "string" } } } },
  },
};


export const atualizarComissaoDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Actualizar comissão de moradores",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    response: { 200: comissaoObject },
  },
};


export const adicionarMembroDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Adicionar membro a uma comissão",
    params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
    body: {
      type: "object",
      required: ["nome", "cargo"],
      properties: { nome: { type: "string" }, cargo: { type: "string" }, contacto: { type: "string" } },
    },
    response: { 201: membroObject },
  },
};

export const removerMembroDocs = {
  schema: {
    tags: ["Comissões de Moradores"],
    summary: "Remover membro de uma comissão",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" }, membroId: { type: "string", format: "uuid" } },
      required: ["id", "membroId"],
    },
    response: { 204: { type: "null" } },
  },
};