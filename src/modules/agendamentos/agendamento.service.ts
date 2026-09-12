import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/process-engine/process-engine.notifications.js";
import type {
  CriarAgendamentoInput,
  ConfirmarAgendamentoInput,
  CancelarAgendamentoInput,
  ListarAgendamentosQuery,
  ReagendarAgendamentoInput,
} from "./agendamento.schema.js";
import {
  ANTECEDENCIA_MINIMA_MINUTOS,
  ANTECEDENCIA_MAXIMA_DIAS,
  EXPEDIENTE_HORA_INICIO,
  EXPEDIENTE_HORA_FIM,
  EXPEDIENTE_DIAS_UTEIS,
  MAX_AGENDAMENTOS_ATIVOS_POR_UTILIZADOR,
} from "./agendamento.constants.js";
import { expirarOfertasVencidas } from "./agendamento.oferta.service.js";
import { paraComponentesAngola, inicioDoDiaEmAngola, fimDoDiaEmAngola } from "./agendamento.timezone.js";

export class AgendamentoNaoEncontradoError extends Error {}
export class ConflitoDeHorarioError extends Error {}
export class ConflitoAgendamentoProprioError extends Error {}
export class AgendamentoEstadoInvalidoError extends Error {}
export class DataInvalidaError extends Error {}
export class AntecedenciaInsuficienteError extends Error {}
export class AntecedenciaExcessivaError extends Error {}
export class ForaDoExpedienteError extends Error {}
export class LimiteAgendamentosAtivosError extends Error {}

export const ESTADOS_ATIVOS = ["SOLICITADO", "CONFIRMADO"] as const;
type TipoAgendamento = "ADMINISTRADOR" | "ASSISTENTE_SOCIAL";
type EstadoAgendamento = "SOLICITADO" | "CONFIRMADO" | "CANCELADO" | "REALIZADO" | "FALTA";

function validarJanelaTemporal(inicio: Date, fim: Date) {
  const agora = Date.now();

  if (Number.isNaN(inicio.getTime())) {
    throw new DataInvalidaError("A data/hora do agendamento é inválida.");
  }

  const minutosAteInicio = (inicio.getTime() - agora) / 60_000;
  if (minutosAteInicio < ANTECEDENCIA_MINIMA_MINUTOS) {
    throw new AntecedenciaInsuficienteError(
      `O agendamento tem de ser marcado com pelo menos ${ANTECEDENCIA_MINIMA_MINUTOS} minutos de antecedência.`
    );
  }

  const diasAteInicio = minutosAteInicio / 60 / 24;
  if (diasAteInicio > ANTECEDENCIA_MAXIMA_DIAS) {
    throw new AntecedenciaExcessivaError(
      `Não é possível agendar com mais de ${ANTECEDENCIA_MAXIMA_DIAS} dias de antecedência.`
    );
  }

  const compInicio = paraComponentesAngola(inicio);
  const compFim = paraComponentesAngola(fim);

  if (!EXPEDIENTE_DIAS_UTEIS.includes(compInicio.diaDaSemana)) {
    throw new ForaDoExpedienteError("Só é possível agendar em dias úteis (Segunda a Sexta).");
  }

  const horaInicio = compInicio.hora + compInicio.minuto / 60;
  const horaFim = compFim.hora + compFim.minuto / 60 + (compFim.dia !== compInicio.dia ? 24 : 0);
  if (horaInicio < EXPEDIENTE_HORA_INICIO || horaFim > EXPEDIENTE_HORA_FIM) {
    throw new ForaDoExpedienteError(
      `O agendamento (incluindo a duração) tem de caber dentro do horário de expediente ` +
        `(${String(EXPEDIENTE_HORA_INICIO).padStart(2, "0")}:00–${String(EXPEDIENTE_HORA_FIM).padStart(2, "0")}:00).`
    );
  }
}

export async function criarAgendamento(params: {
  municipioId: string;
  utilizadorId: string;
  input: CriarAgendamentoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const inicio = new Date(params.input.dataHoraInicio);
    const fim = new Date(inicio.getTime() + params.input.duracaoMinutos * 60_000);

    validarJanelaTemporal(inicio, fim);

    // Regra 1: conflito com outro agendamento do MESMO tipo, ainda activo.
    const conflitoTipo = await tx.agendamento.findFirst({
      where: {
        municipioId: params.municipioId,
        tipo: params.input.tipo,
        estado: { in: [...ESTADOS_ATIVOS] },
        dataHoraInicio: { lt: fim },
        dataHoraFim: { gt: inicio },
      },
      select: { id: true },
    });
    if (conflitoTipo) {
      throw new ConflitoDeHorarioError(
        "Já existe um agendamento nesse horário para este tipo de atendimento. Escolha outro horário."
      );
    }

    // Regra 2: o próprio utilizador não pode ter outro agendamento activo
    // (de qualquer tipo) que se sobreponha a este.
    const conflitoProprio = await tx.agendamento.findFirst({
      where: {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        estado: { in: [...ESTADOS_ATIVOS] },
        dataHoraInicio: { lt: fim },
        dataHoraFim: { gt: inicio },
      },
      select: { id: true },
    });
    if (conflitoProprio) {
      throw new ConflitoAgendamentoProprioError("Já tem outro agendamento marcado que se sobrepõe a este horário.");
    }

    // Regra 4: limite de agendamentos activos simultâneos por utilizador.
    const totalAtivos = await tx.agendamento.count({
      where: { municipioId: params.municipioId, utilizadorId: params.utilizadorId, estado: { in: [...ESTADOS_ATIVOS] } },
    });
    if (totalAtivos >= MAX_AGENDAMENTOS_ATIVOS_POR_UTILIZADOR) {
      throw new LimiteAgendamentosAtivosError(
        `Já tem ${MAX_AGENDAMENTOS_ATIVOS_POR_UTILIZADOR} agendamentos activos. Cancele um antes de marcar outro.`
      );
    }

    return tx.agendamento.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        tipo: params.input.tipo,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        motivo: params.input.motivo,
        estado: "SOLICITADO",
        ...(params.input.processoGenericoId !== undefined && { processoGenericoId: params.input.processoGenericoId }),
      },
    });
  });
}

/**
 * ALTERADO: passa a exigir e a verificar `municipioId` explicitamente, em
 * vez de confiar só no scoping da transacção — mesma correcção de defesa
 * em profundidade já aplicada nos módulos de Funcionários e Utilizadores
 * nesta mesma auditoria. Todos os chamadores dentro deste ficheiro e de
 * agendamento.fila.service.ts / agendamento.oferta.service.ts foram
 * actualizados para passar o municipioId.
 */
export async function obterAgendamentoOuFalhar(tx: Prisma.TransactionClient, municipioId: string, id: string) {
  const agendamento = await tx.agendamento.findUnique({ where: { id } });
  if (!agendamento || agendamento.municipioId !== municipioId) {
    throw new AgendamentoNaoEncontradoError("Agendamento não encontrado.");
  }
  return agendamento;
}

export async function confirmarAgendamento(params: {
  municipioId: string;
  agendamentoId: string;
  executorId: string;
  input: ConfirmarAgendamentoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);
    if (agendamento.estado !== "SOLICITADO") {
      throw new AgendamentoEstadoInvalidoError(
        `Só é possível confirmar agendamentos SOLICITADOS (estado actual: ${agendamento.estado}).`
      );
    }

    const atualizado = await tx.agendamento.update({
      where: { id: agendamento.id },
      data: {
        estado: "CONFIRMADO",
        atendidoPorId: params.input.atendidoPorId ?? params.executorId,
      },
    });

    if (agendamento.utilizadorId) {
      const requerente = await tx.utilizador.findUnique({
        where: { id: agendamento.utilizadorId },
        select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
      });
      if (requerente) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: agendamento.utilizadorId,
          titulo: "Agendamento confirmado",
          mensagem: `O seu agendamento para ${agendamento.dataHoraInicio.toLocaleString("pt-AO")} foi confirmado.`,
          tipo: "SISTEMA",
          emailDestino: requerente.emailConfirmado ? requerente.email : null,
          nomeDestino: requerente.nomeCompleto,
          telefoneDestino: requerente.telefone,
          canais: ["APP", "EMAIL", "SMS"],
        });
      }
    }

    return atualizado;
  });
}

export async function cancelarAgendamento(params: {
  municipioId: string;
  agendamentoId: string;
  executorId: string;
  utilizadorSolicitanteId?: string;
  input: CancelarAgendamentoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);
    if (agendamento.estado === "CANCELADO" || agendamento.estado === "REALIZADO") {
      throw new AgendamentoEstadoInvalidoError(`Não é possível cancelar um agendamento já ${agendamento.estado}.`);
    }
    if (params.utilizadorSolicitanteId && agendamento.utilizadorId !== params.utilizadorSolicitanteId) {
      throw new AgendamentoEstadoInvalidoError("Só o próprio requerente pode cancelar este agendamento.");
    }

    const atualizado = await tx.agendamento.update({
      where: { id: agendamento.id },
      data: { estado: "CANCELADO", ...(params.input.motivo !== undefined && { observacoes: params.input.motivo }) },
    });

    return {
      agendamento: atualizado,
      vagaLiberada: { tipo: agendamento.tipo, dataHoraInicio: agendamento.dataHoraInicio, dataHoraFim: agendamento.dataHoraFim },
    };
  });
}

/**
 * NOVO — reagendamento. Regra de negócio que decidi (não estava explícita
 * em lado nenhum): ao reagendar, o agendamento volta a SOLICITADO e perde
 * o `atendidoPorId` anterior, porque a nova hora pode implicar outro
 * atendente disponível — exige nova confirmação, tal como um agendamento
 * novo. Se preferires que reagendar mantenha CONFIRMADO directamente,
 * diz-me e mudo — é uma decisão de produto, não uma restrição técnica.
 *
 * Reaproveita toda a validação de janela temporal e de conflito da
 * criação, e devolve a vaga antiga liberada para poder ser oferecida a
 * outra pessoa (mesmo mecanismo do cancelamento).
 */
export async function reagendarAgendamento(params: {
  municipioId: string;
  agendamentoId: string;
  utilizadorSolicitanteId?: string;
  input: ReagendarAgendamentoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);

    if (agendamento.estado !== "SOLICITADO" && agendamento.estado !== "CONFIRMADO") {
      throw new AgendamentoEstadoInvalidoError(
        `Só é possível reagendar agendamentos SOLICITADOS ou CONFIRMADOS (estado actual: ${agendamento.estado}).`
      );
    }
    // Depois de chamado, a pessoa já está a caminho do balcão (ou a ser
    // atendida) — reagendar deixa de fazer sentido operacional, mesmo que
    // o estado ainda seja CONFIRMADO.
    if (agendamento.atendimentoIniciadoEm) {
      throw new AgendamentoEstadoInvalidoError("Não é possível reagendar um atendimento que já foi chamado.");
    }
    if (params.utilizadorSolicitanteId && agendamento.utilizadorId !== params.utilizadorSolicitanteId) {
      throw new AgendamentoEstadoInvalidoError("Só o próprio requerente pode reagendar este agendamento.");
    }

    const duracaoOriginalMinutos = (agendamento.dataHoraFim.getTime() - agendamento.dataHoraInicio.getTime()) / 60_000;
    const duracaoMinutos = params.input.novaDuracaoMinutos ?? duracaoOriginalMinutos;
    const novoInicio = new Date(params.input.novaDataHoraInicio);
    const novoFim = new Date(novoInicio.getTime() + duracaoMinutos * 60_000);

    validarJanelaTemporal(novoInicio, novoFim);

    const conflito = await tx.agendamento.findFirst({
      where: {
        municipioId: params.municipioId,
        id: { not: agendamento.id },
        tipo: agendamento.tipo,
        estado: { in: [...ESTADOS_ATIVOS] },
        dataHoraInicio: { lt: novoFim },
        dataHoraFim: { gt: novoInicio },
      },
      select: { id: true },
    });
    if (conflito) {
      throw new ConflitoDeHorarioError("Já existe um agendamento nesse horário para este tipo de atendimento.");
    }

    const vagaAntiga = {
      tipo: agendamento.tipo,
      dataHoraInicio: agendamento.dataHoraInicio,
      dataHoraFim: agendamento.dataHoraFim,
    };

    const atualizado = await tx.agendamento.update({
      where: { id: agendamento.id },
      data: {
        dataHoraInicio: novoInicio,
        dataHoraFim: novoFim,
        estado: "SOLICITADO",
        atendidoPorId: null,
        ...(params.input.motivo !== undefined && { observacoes: params.input.motivo }),
      },
    });

    return { agendamento: atualizado, vagaLiberada: vagaAntiga };
  });
}

export async function marcarRealizado(params: { municipioId: string; agendamentoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);
    if (agendamento.estado !== "CONFIRMADO") {
      throw new AgendamentoEstadoInvalidoError("Só é possível marcar como realizado um agendamento CONFIRMADO.");
    }
    return tx.agendamento.update({
      where: { id: agendamento.id },
      data: { estado: "REALIZADO", atendimentoConcluidoEm: new Date() },
    });
  });
}

export async function marcarFalta(params: { municipioId: string; agendamentoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);
    if (agendamento.estado !== "CONFIRMADO") {
      throw new AgendamentoEstadoInvalidoError("Só é possível marcar falta num agendamento CONFIRMADO.");
    }
    return tx.agendamento.update({ where: { id: agendamento.id }, data: { estado: "FALTA" } });
  });
}

export async function listarMeusAgendamentos(
  params: { municipioId: string; utilizadorId: string; estado?: EstadoAgendamento },
  paginacao: { page: number; pageSize: number }
) {
  const skip = (paginacao.page - 1) * paginacao.pageSize;

  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.AgendamentoWhereInput = {
      municipioId: params.municipioId,
      utilizadorId: params.utilizadorId,
      ...(params.estado !== undefined && { estado: params.estado }),
    };

    const [items, total] = await Promise.all([
      tx.agendamento.findMany({
        where,
        orderBy: { dataHoraInicio: "desc" },
        skip,
        take: paginacao.pageSize,
      }),
      tx.agendamento.count({ where }),
    ]);

    return {
      items,
      page: paginacao.page,
      pageSize: paginacao.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / paginacao.pageSize)),
    };
  });
}

export async function obterResumoAgendamentos(params: { municipioId: string; utilizadorId: string; tipoConta: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.AgendamentoWhereInput = {
      municipioId: params.municipioId,
      ...(params.tipoConta !== "INTERNO" && { utilizadorId: params.utilizadorId }),
    };
    const grupos = await tx.agendamento.groupBy({ by: ["estado"], where, _count: { _all: true } });
    const porEstado = Object.fromEntries(grupos.map((g) => [g.estado, g._count._all]));
    const total = grupos.reduce((soma, g) => soma + g._count._all, 0);
    return { porEstado, total };
  });
}

export async function listarAgendamentos(params: { municipioId: string; query: ListarAgendamentosQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.AgendamentoWhereInput = {
      municipioId: params.municipioId,
      ...(params.query.tipo !== undefined && { tipo: params.query.tipo }),
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
      ...((params.query.desde !== undefined || params.query.ate !== undefined) && {
        dataHoraInicio: {
          ...(params.query.desde !== undefined && { gte: new Date(params.query.desde) }),
          ...(params.query.ate !== undefined && { lte: new Date(params.query.ate) }),
        },
      }),
    };
    const [items, total] = await Promise.all([
      tx.agendamento.findMany({
        where,
        orderBy: { dataHoraInicio: "asc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        include: {
          utilizador: { select: { id: true, nomeCompleto: true, email: true } },
        },
      }),
      tx.agendamento.count({ where }),
    ]);
    return {
      items,
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

/**
 * NOVO — requisito explícito #4 do pedido. O intervalo do dia é sempre
 * calculado no servidor via agendamento.timezone.ts (hora de Angola,
 * UTC+1 fixo) — nunca recebido do cliente. Reaproveita listarAgendamentos
 * (já com municipioId explícito) só com desde/ate fixados ao dia de hoje.
 */
export async function listarAgendamentosHoje(params: {
  municipioId: string;
  tipo?: TipoAgendamento;
  estado?: EstadoAgendamento;
  page: number;
  pageSize: number;
}) {
  const desde = inicioDoDiaEmAngola();
  const ate = fimDoDiaEmAngola();

  return listarAgendamentos({
    municipioId: params.municipioId,
    query: {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.tipo !== undefined && { tipo: params.tipo }),
      ...(params.estado !== undefined && { estado: params.estado }),
      desde: desde.toISOString(),
      ate: ate.toISOString(),
    },
  });
}

/** Lista as ofertas de antecipação ainda pendentes, dos agendamentos do próprio utilizador. */
export async function listarOfertasPendentes(params: { municipioId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await expirarOfertasVencidas(tx, params.municipioId);

    return tx.ofertaAntecipacao.findMany({
      where: {
        municipioId: params.municipioId,
        estado: "PENDENTE",
        agendamento: { utilizadorId: params.utilizadorId },
      },
      orderBy: { criadoEm: "desc" },
    });
  });
}