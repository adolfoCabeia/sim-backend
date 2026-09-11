import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarAgendamento,
  confirmarAgendamento,
  cancelarAgendamento,
  reagendarAgendamento,
  marcarRealizado,
  marcarFalta,
  listarMeusAgendamentos,
  listarAgendamentos,
  listarAgendamentosHoje,
  obterResumoAgendamentos,
  AgendamentoNaoEncontradoError,
  ConflitoDeHorarioError,
  ConflitoAgendamentoProprioError,
  AgendamentoEstadoInvalidoError,
  DataInvalidaError,
  AntecedenciaInsuficienteError,
  AntecedenciaExcessivaError,
  ForaDoExpedienteError,
  LimiteAgendamentosAtivosError,
} from "./agendamento.service.js";
import {
  obterStatusFila,
  marcarEstouACaminho,
  chamarAtendimento,
} from "./agendamento.fila.service.js";
import {
  processarVagaLiberada,
  aceitarOferta,
  recusarOferta,
  listarOfertasPendentes,
  OfertaNaoEncontradaError,
  OfertaIndisponivelError,
} from "./agendamento.oferta.service.js";
import type {
  CriarAgendamentoInput,
  ConfirmarAgendamentoInput,
  CancelarAgendamentoInput,
  ReagendarAgendamentoInput,
  ListarAgendamentosQuery,
  ListarMeusAgendamentosQuery,
  ListarAgendamentosHojeQuery,
  ResponderOfertaInput,
} from "./agendamento.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof AgendamentoNaoEncontradoError || error instanceof OfertaNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof ConflitoDeHorarioError || error instanceof ConflitoAgendamentoProprioError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof OfertaIndisponivelError) {
    return reply.status(410).send({ success: false, message: error.message });
  }
  if (error instanceof LimiteAgendamentosAtivosError) {
    return reply.status(422).send({ success: false, message: error.message });
  }
  if (
    error instanceof AntecedenciaInsuficienteError ||
    error instanceof AntecedenciaExcessivaError ||
    error instanceof ForaDoExpedienteError ||
    error instanceof DataInvalidaError
  ) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  if (error instanceof AgendamentoEstadoInvalidoError) {
    return reply.status(error.message.includes("próprio requerente") ? 403 : 409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

/** Cidadão/Empresa/Instituição marca uma audiência — evita filas presenciais. */
export async function criarAgendamentoController(
  request: FastifyRequest<{ Body: CriarAgendamentoInput }>,
  reply: FastifyReply
) {
  try {
    const agendamento = await criarAgendamento({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar agendamento");
  }
}

export async function confirmarAgendamentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: ConfirmarAgendamentoInput }>,
  reply: FastifyReply
) {
  try {
    const agendamento = await confirmarAgendamento({
      municipioId: request.user.municipioId,
      agendamentoId: request.params.id,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao confirmar agendamento");
  }
}

/**
 * O próprio cidadão pode cancelar o seu agendamento; staff cancela qualquer
 * um a que tenha acesso. Depois de cancelar, tenta oferecer a vaga
 * libertada ao próximo agendamento elegível (ideia "Pode chegar mais cedo?").
 */
export async function cancelarAgendamentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: CancelarAgendamentoInput }>,
  reply: FastifyReply
) {
  try {
    const resultado = await cancelarAgendamento({
      municipioId: request.user.municipioId,
      agendamentoId: request.params.id,
      executorId: request.user.sub,
      ...(request.user.tipoConta !== "INTERNO" && { utilizadorSolicitanteId: request.user.sub }),
      input: request.body,
    });

    try {
      await processarVagaLiberada({ municipioId: request.user.municipioId, vaga: resultado.vagaLiberada });
    } catch (erroOferta) {
      request.log.warn({ erroOferta }, "Não foi possível processar oferta de antecipação após cancelamento");
    }

    return reply.send({ success: true, data: resultado.agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao cancelar agendamento");
  }
}

/**
 * NOVO — reagendamento. Mesma lógica de "só o próprio ou staff" do
 * cancelamento, e o mesmo passo de oferecer a vaga antiga em cascata.
 */
export async function reagendarAgendamentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: ReagendarAgendamentoInput }>,
  reply: FastifyReply
) {
  try {
    const resultado = await reagendarAgendamento({
      municipioId: request.user.municipioId,
      agendamentoId: request.params.id,
      ...(request.user.tipoConta !== "INTERNO" && { utilizadorSolicitanteId: request.user.sub }),
      input: request.body,
    });

    try {
      await processarVagaLiberada({ municipioId: request.user.municipioId, vaga: resultado.vagaLiberada });
    } catch (erroOferta) {
      request.log.warn({ erroOferta }, "Não foi possível processar oferta de antecipação após reagendamento");
    }

    return reply.send({ success: true, data: resultado.agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao reagendar agendamento");
  }
}

export async function marcarRealizadoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const agendamento = await marcarRealizado({ municipioId: request.user.municipioId, agendamentoId: request.params.id });
    return reply.send({ success: true, data: agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao marcar agendamento como realizado");
  }
}

export async function marcarFaltaController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const agendamento = await marcarFalta({ municipioId: request.user.municipioId, agendamentoId: request.params.id });
    return reply.send({ success: true, data: agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao marcar falta no agendamento");
  }
}

/**
 * ALTERADO — o cidadão vê só os seus próprios agendamentos, agora com
 * querystring validada (era a única rota de listagem sem isto) e filtro
 * de estado.
 */
export async function listarMeusAgendamentosController(
  request: FastifyRequest<{ Querystring: ListarMeusAgendamentosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarMeusAgendamentos(
    {
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      ...(request.query.estado !== undefined && { estado: request.query.estado }),
    },
    { page: request.query.page, pageSize: request.query.pageSize }
  );

  return reply.send({ success: true, data: resultado });
}

export async function obterResumoAgendamentosController(request: FastifyRequest, reply: FastifyReply) {
  const resumo = await obterResumoAgendamentos({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
    tipoConta: request.user.tipoConta,
  });
  return reply.send({ success: true, data: resumo });
}

/** Staff vê a agenda toda (Administrador/Assistente Social). */
export async function listarAgendamentosController(
  request: FastifyRequest<{ Querystring: ListarAgendamentosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarAgendamentos({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}

/**
 * NOVO — requisito #4: agendamentos de hoje, calculado sempre no servidor
 * (nunca a partir de desde/ate recebidos do cliente).
 */
export async function listarAgendamentosHojeController(
  request: FastifyRequest<{ Querystring: ListarAgendamentosHojeQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarAgendamentosHoje({
    municipioId: request.user.municipioId,
    page: request.query.page,
    pageSize: request.query.pageSize,
    ...(request.query.tipo !== undefined && { tipo: request.query.tipo }),
    ...(request.query.estado !== undefined && { estado: request.query.estado }),
  });
  return reply.send({ success: true, data: resultado });
}

// --- Fila virtual / ETA ---

/** "Está quase na sua vez": posição na fila e tempo estimado de espera. */
export async function obterStatusFilaController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const status = await obterStatusFila({ municipioId: request.user.municipioId, agendamentoId: request.params.id });
    return reply.send({ success: true, data: status });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter status da fila");
  }
}

export async function estouACaminhoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const agendamento = await marcarEstouACaminho({
      municipioId: request.user.municipioId,
      agendamentoId: request.params.id,
      utilizadorId: request.user.sub,
    });
    return reply.send({ success: true, data: agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao sinalizar chegada");
  }
}

/**
 * ALTERADO — Staff chama o próximo da fila para o balcão. Passa agora
 * `chamadoPorId: request.user.sub` (quem clicou "Chamar" fica registado,
 * mesmo que seja diferente de quem confirmou o agendamento).
 */
export async function chamarAtendimentoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const agendamento = await chamarAtendimento({
      municipioId: request.user.municipioId,
      agendamentoId: request.params.id,
      chamadoPorId: request.user.sub,
    });
    return reply.send({ success: true, data: agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao chamar atendimento");
  }
}

// --- Ofertas de antecipação ---

/** O cidadão consulta as suas próprias ofertas de antecipação ainda pendentes. */
export async function listarOfertasPendentesController(request: FastifyRequest, reply: FastifyReply) {
  const ofertas = await listarOfertasPendentes({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
  });
  return reply.send({ success: true, data: ofertas });
}

export async function aceitarOfertaController(request: FastifyRequest<{ Params: { ofertaId: string } }>, reply: FastifyReply) {
  try {
    const resultado = await aceitarOferta({
      municipioId: request.user.municipioId,
      ofertaId: request.params.ofertaId,
      utilizadorId: request.user.sub,
    });

    try {
      await processarVagaLiberada({ municipioId: request.user.municipioId, vaga: resultado.vagaAntigaLiberada });
    } catch (erroOferta) {
      request.log.warn({ erroOferta }, "Não foi possível processar oferta em cascata após aceitação");
    }

    return reply.send({ success: true, data: resultado.agendamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao aceitar oferta de antecipação");
  }
}

export async function recusarOfertaController(
  request: FastifyRequest<{ Params: { ofertaId: string }; Body: ResponderOfertaInput }>,
  reply: FastifyReply
) {
  try {
    const resultado = await recusarOferta({
      municipioId: request.user.municipioId,
      ofertaId: request.params.ofertaId,
      utilizadorId: request.user.sub,
    });

    try {
      await processarVagaLiberada({
        municipioId: request.user.municipioId,
        vaga: resultado.vaga,
        excluirAgendamentoIds: [resultado.oferta.agendamentoId],
      });
    } catch (erroOferta) {
      request.log.warn({ erroOferta }, "Não foi possível reprocessar oferta em cascata após recusa");
    }

    return reply.send({ success: true, data: resultado.oferta });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao recusar oferta de antecipação");
  }
}