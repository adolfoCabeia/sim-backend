const utilizadorResumoObject = {
  type: "object",
  nullable: true,
  properties: {
    id: { type: "string", format: "uuid" },
    nomeCompleto: { type: "string" },
    email: { type: "string", format: "email" },
  },
};

const agendamentoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    utilizadorId: { type: "string", format: "uuid", nullable: true },
    utilizador: utilizadorResumoObject,
    tipo: { type: "string", enum: ["ADMINISTRADOR", "ASSISTENTE_SOCIAL"] },
    atendidoPorId: { type: "string", format: "uuid", nullable: true },
    // NOVO — quem efectivamente chamou o atendimento (pode ser diferente
    // de atendidoPorId, definido na confirmação).
    chamadoPorId: { type: "string", format: "uuid", nullable: true },
    dataHoraInicio: { type: "string", format: "date-time" },
    dataHoraFim: { type: "string", format: "date-time" },
    motivo: { type: "string" },
    estado: {
      type: "string",
      enum: ["SOLICITADO", "CONFIRMADO", "CANCELADO", "REALIZADO", "FALTA"],
    },
    observacoes: { type: "string", nullable: true },
    processoGenericoId: { type: "string", format: "uuid", nullable: true },
    numeroSenha: { type: "string", nullable: true },
    chegouEm: { type: "string", format: "date-time", nullable: true },
    atendimentoIniciadoEm: { type: "string", format: "date-time", nullable: true },
    atendimentoConcluidoEm: { type: "string", format: "date-time", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};
const statusFilaObject = {
  type: "object",
  properties: {
    agendamentoId: { type: "string", format: "uuid" },
    estado: {
      type: "string",
      enum: ["NAO_APLICAVEL", "EM_ATENDIMENTO", "CONCLUIDO", "CHAME_JA", "PROXIMO", "AGUARDANDO"],
    },
    pessoasAFrente: { type: "integer" },
    tempoMedioAtendimentoMinutos: { type: "integer" },
    tempoEstimadoEsperaMinutos: { type: "integer" },
    horaEstimada: { type: "string", format: "date-time", nullable: true },
  },
};

const ofertaAntecipacaoObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    agendamentoId: { type: "string", format: "uuid" },
    dataHoraInicioAntiga: { type: "string", format: "date-time" },
    dataHoraFimAntiga: { type: "string", format: "date-time" },
    novaDataHoraInicio: { type: "string", format: "date-time" },
    novaDataHoraFim: { type: "string", format: "date-time" },
    estado: { type: "string", enum: ["PENDENTE", "ACEITE", "RECUSADA", "EXPIRADA", "SUBSTITUIDA"] },
    expiraEm: { type: "string", format: "date-time" },
    criadoEm: { type: "string", format: "date-time" },
    resolvidoEm: { type: "string", format: "date-time", nullable: true },
  },
};

const paginadoAgendamentos = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: agendamentoObject },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
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

export const criarAgendamentoDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Criar um agendamento (marcar audiência)",
    description:
      "Marca uma audiência com o Administrador ou com um Assistente Social, evitando filas presenciais. " +
      "Aplica regras de antecedência mínima/máxima, horário de expediente, ausência de conflitos (por tipo e " +
      "para o próprio utilizador) e limite de agendamentos activos simultâneos. Requer a permissão agendamentos:criar.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["tipo", "dataHoraInicio", "motivo"],
      properties: {
        tipo: { type: "string", enum: ["ADMINISTRADOR", "ASSISTENTE_SOCIAL"] },
        dataHoraInicio: { type: "string", format: "date-time" },
        duracaoMinutos: { type: "integer", minimum: 15, maximum: 240, default: 30 },
        motivo: { type: "string", minLength: 5, maxLength: 500 },
        processoGenericoId: { type: "string", format: "uuid" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      400: errorResponse("Data inválida, fora do expediente, ou antecedência insuficiente/excessiva"),
      409: errorResponse("Conflito de horário (com outro agendamento do mesmo tipo, ou consigo próprio)"),
      422: errorResponse("Limite de agendamentos activos atingido"),
    },
  },
};

export const confirmarAgendamentoDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Confirmar um agendamento",
    description:
      "Confirma um agendamento solicitado, opcionalmente atribuindo quem irá atender. Requer a permissão agendamentos:confirmar.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: { type: "object", properties: { atendidoPorId: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      404: errorResponse("Agendamento não encontrado"),
      409: errorResponse("Agendamento não está num estado que permita confirmação"),
    },
  },
};

export const cancelarAgendamentoDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Cancelar um agendamento",
    description:
      "O próprio cidadão pode cancelar o seu agendamento; o staff (permissão agendamentos:gerir) pode cancelar " +
      "qualquer um a que tenha acesso. Depois de cancelar, o sistema tenta automaticamente oferecer a vaga " +
      "libertada ao próximo agendamento elegível do mesmo tipo ('Pode chegar mais cedo?').",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: { type: "object", properties: { motivo: { type: "string", maxLength: 500 } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      403: errorResponse("Só o próprio requerente ou o staff podem cancelar"),
      404: errorResponse("Agendamento não encontrado"),
      409: errorResponse("Agendamento não está num estado que permita cancelamento"),
    },
  },
};

/**
 * NOVO — reagendamento. Regra de negócio: volta sempre a SOLICITADO (ver
 * nota em agendamento.service.ts) — documentado aqui para quem só ler o
 * Swagger perceber o efeito colateral no estado.
 */
export const reagendarAgendamentoDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Reagendar (mudar data/hora) um agendamento",
    description:
      "O próprio cidadão pode reagendar o seu agendamento; o staff (permissão agendamentos:gerir) pode " +
      "reagendar qualquer um a que tenha acesso. Só é possível a partir de SOLICITADO ou CONFIRMADO. " +
      "IMPORTANTE: o agendamento volta sempre a SOLICITADO após reagendar (perde a confirmação anterior, " +
      "e o atendidoPorId é limpo) — exige nova confirmação, tal como um agendamento novo. Reaplica todas as " +
      "regras de antecedência/expediente/conflito da criação sobre o novo horário, e tenta oferecer a vaga " +
      "antiga libertada ao próximo agendamento elegível.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    body: {
      type: "object",
      required: ["novaDataHoraInicio"],
      properties: {
        novaDataHoraInicio: { type: "string", format: "date-time" },
        novaDuracaoMinutos: {
          type: "integer",
          minimum: 15,
          maximum: 240,
          description: "Se omitido, mantém a duração original do agendamento.",
        },
        motivo: { type: "string", maxLength: 500 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      400: errorResponse("Data inválida, fora do expediente, ou antecedência insuficiente/excessiva"),
      403: errorResponse("Só o próprio requerente ou o staff podem reagendar"),
      404: errorResponse("Agendamento não encontrado"),
      409: errorResponse("Agendamento não está num estado que permita reagendamento, ou conflito de horário"),
    },
  },
};

export const marcarRealizadoDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Marcar agendamento como realizado",
    description: "Regista que a audiência agendada foi efectivamente realizada. Requer a permissão agendamentos:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      404: errorResponse("Agendamento não encontrado"),
      409: errorResponse("Agendamento não está num estado que permita esta transição"),
    },
  },
};

export const marcarFaltaDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Marcar falta no agendamento",
    description: "Regista que o requerente faltou à audiência agendada. Requer a permissão agendamentos:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      404: errorResponse("Agendamento não encontrado"),
      409: errorResponse("Agendamento não está num estado que permita esta transição"),
    },
  },
};

export const listarMeusAgendamentosDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Listar os meus agendamentos",
    description:
      "Qualquer utilizador autenticado vê apenas os seus próprios agendamentos, paginados. Aceita filtro " +
      "opcional por estado.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        estado: { type: "string", enum: ["SOLICITADO", "CONFIRMADO", "CANCELADO", "REALIZADO", "FALTA"] },
      },
    },
    response: { 200: paginadoAgendamentos },
  },
};

export const listarAgendamentosDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Listar agendamentos (staff)",
    description:
      "Lista a agenda completa do município (Administrador/Assistente Social), com filtros por tipo, estado " +
      "e intervalo de datas. Requer a permissão agendamentos:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        tipo: { type: "string", enum: ["ADMINISTRADOR", "ASSISTENTE_SOCIAL"] },
        estado: { type: "string", enum: ["SOLICITADO", "CONFIRMADO", "CANCELADO", "REALIZADO", "FALTA"] },
        desde: { type: "string", format: "date-time" },
        ate: { type: "string", format: "date-time" },
      },
    },
    response: { 200: paginadoAgendamentos },
  },
};

/**
 * NOVO — requisito #4. Sem "desde"/"ate" na querystring de propósito: o
 * intervalo do dia é sempre calculado no servidor, nunca recebido do
 * cliente (ver agendamento.timezone.ts).
 */
export const listarAgendamentosHojeDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Listar agendamentos de hoje (staff)",
    description:
      "Agenda do dia corrente, calculado com o dia civil em Angola (UTC+1, sem DST) — não em UTC nem na hora " +
      "local do servidor. Requer a permissão agendamentos:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        tipo: { type: "string", enum: ["ADMINISTRADOR", "ASSISTENTE_SOCIAL"] },
        estado: { type: "string", enum: ["SOLICITADO", "CONFIRMADO", "CANCELADO", "REALIZADO", "FALTA"] },
      },
    },
    response: { 200: paginadoAgendamentos },
  },
};

export const obterResumoAgendamentosDocs = {
  schema: {
    tags: ["Agendamentos"],
    summary: "Resumo de agendamentos por estado (para o dashboard)",
    description:
      "Contagens agregadas — internos veem o município todo, contas externas só os seus próprios agendamentos.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: { porEstado: { type: "object", additionalProperties: { type: "integer" } }, total: { type: "integer" } },
          },
        },
      },
    },
  },
};

// --- Fila virtual / ETA ---

export const obterStatusFilaDocs = {
  schema: {
    tags: ["Agendamentos", "Fila Virtual"],
    summary: "Status na fila virtual e ETA",
    description:
      "Retorna quantas pessoas estão à frente, o tempo médio de atendimento calculado a partir do histórico " +
      "real, e uma estimativa de hora de atendimento — para o cidadão saber que não precisa chegar cedo.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: statusFilaObject } },
      404: errorResponse("Agendamento não encontrado"),
    },
  },
};

export const estouACaminhoDocs = {
  schema: {
    tags: ["Agendamentos", "Fila Virtual"],
    summary: "Sinalizar 'Estou a caminho'",
    description: "O cidadão sinaliza que está a caminho — informativo para o staff, não afecta a posição na fila.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      403: errorResponse("Só o próprio requerente pode sinalizar chegada"),
      404: errorResponse("Agendamento não encontrado"),
      409: errorResponse("Agendamento já não está activo"),
    },
  },
};

export const chamarAtendimentoDocs = {
  schema: {
    tags: ["Agendamentos", "Fila Virtual"],
    summary: "Chamar o próximo atendimento (staff)",
    description:
      "Inicia o atendimento, gera o número de senha (ex.: A-047) de forma atómica e à prova de concorrência, " +
      "regista quem chamou (chamadoPorId) e notifica o cidadão para se dirigir ao balcão. A operação é " +
      "condicional: se outro atendente já tiver chamado este agendamento entretanto, devolve 409 em vez de " +
      "sobrescrever silenciosamente. A senha NUNCA é aceite do cliente — é sempre gerada no servidor. Requer " +
      "a permissão agendamentos:gerir.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      404: errorResponse("Agendamento não encontrado"),
      409: errorResponse("Agendamento não está CONFIRMADO, ou já foi chamado por outro atendente"),
    },
  },
};

// --- Ofertas de antecipação ---

export const listarOfertasPendentesDocs = {
  schema: {
    tags: ["Agendamentos", "Ofertas de Antecipação"],
    summary: "Listar as minhas ofertas de antecipação pendentes",
    description:
      "Lista as ofertas de antecipação ainda pendentes (não expiradas, não resolvidas) associadas aos " +
      "agendamentos do próprio utilizador — para poder consultá-las e decidir depois de receber a notificação.",
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: ofertaAntecipacaoObject },
        },
      },
    },
  },
};

export const aceitarOfertaDocs = {
  schema: {
    tags: ["Agendamentos", "Ofertas de Antecipação"],
    summary: "Aceitar oferta de antecipação",
    description:
      "Aceita antecipar o agendamento para o horário oferecido (gerado quando outra pessoa cancelou). " +
      "Revalida o conflito antes de confirmar e dispara, em cascata, uma nova oferta para a vaga que este " +
      "agendamento deixa para trás.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["ofertaId"], properties: { ofertaId: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: agendamentoObject } },
      403: errorResponse("Só o próprio requerente pode responder a esta oferta"),
      404: errorResponse("Oferta ou agendamento não encontrado"),
      409: errorResponse("O horário deixou de estar disponível"),
      410: errorResponse("Oferta expirada, já resolvida, ou substituída"),
    },
  },
};

export const recusarOfertaDocs = {
  schema: {
    tags: ["Agendamentos", "Ofertas de Antecipação"],
    summary: "Recusar oferta de antecipação (manter horário original)",
    description:
      "Recusa a antecipação, mantendo o horário original. O sistema tenta automaticamente oferecer a mesma " +
      "vaga ao próximo candidato elegível.",
    security: [{ bearerAuth: [] }],
    params: { type: "object", required: ["ofertaId"], properties: { ofertaId: { type: "string", format: "uuid" } } },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: ofertaAntecipacaoObject } },
      403: errorResponse("Só o próprio requerente pode responder a esta oferta"),
      404: errorResponse("Oferta não encontrada"),
      410: errorResponse("Oferta já expirada ou resolvida"),
    },
  },
};