import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/process-engine/process-engine.notifications.js";
import { AgendamentoEstadoInvalidoError, ConflitoDeHorarioError, ESTADOS_ATIVOS } from "./agendamento.service.js";
import { GANHO_MINIMO_PARA_OFERTA_MINUTOS, EXPIRACAO_OFERTA_MINUTOS } from "./agendamento.constants.js";
import type { OfertaAntecipacao } from "../../generated/prisma/index.js";

export class OfertaNaoEncontradaError extends Error {}
export class OfertaIndisponivelError extends Error {}

interface VagaLiberada {
  tipo: "ADMINISTRADOR" | "ASSISTENTE_SOCIAL";
  dataHoraInicio: Date;
  dataHoraFim: Date;
}

export async function processarVagaLiberada(params: {
  municipioId: string;
  vaga: VagaLiberada;
  excluirAgendamentoIds?: string[];
}) {
  return withTenantTransaction<OfertaAntecipacao | null>(params.municipioId, async (tx): Promise<OfertaAntecipacao | null> => {
    const duracaoVagaMinutos = (params.vaga.dataHoraFim.getTime() - params.vaga.dataHoraInicio.getTime()) / 60_000;
    const candidato = await tx.agendamento.findFirst({
      where: {
        municipioId: params.municipioId,
        tipo: params.vaga.tipo,
        estado: { in: [...ESTADOS_ATIVOS] },
        dataHoraInicio: { gt: params.vaga.dataHoraInicio },
        ...(params.excluirAgendamentoIds?.length ? { id: { notIn: params.excluirAgendamentoIds } } : {}),
      },
      orderBy: { dataHoraInicio: "asc" },
    });

    if (!candidato) return null;

    const duracaoCandidatoMinutos = (candidato.dataHoraFim.getTime() - candidato.dataHoraInicio.getTime()) / 60_000;
    if (duracaoCandidatoMinutos > duracaoVagaMinutos) {
      return processarVagaLiberada({
        municipioId: params.municipioId,
        vaga: params.vaga,
        excluirAgendamentoIds: [...(params.excluirAgendamentoIds ?? []), candidato.id],
      });
    }

    const ganhoMinutos = (candidato.dataHoraInicio.getTime() - params.vaga.dataHoraInicio.getTime()) / 60_000;
    if (ganhoMinutos < GANHO_MINIMO_PARA_OFERTA_MINUTOS) {
      return null;
    }

    const ofertaJaAberta = await tx.ofertaAntecipacao.findFirst({
      where: { municipioId: params.municipioId, agendamentoId: candidato.id, estado: "PENDENTE" },
    });
    if (ofertaJaAberta) return null;

    const novaDataHoraInicio = params.vaga.dataHoraInicio;
    const novaDataHoraFim = new Date(novaDataHoraInicio.getTime() + duracaoCandidatoMinutos * 60_000);

    const oferta = await tx.ofertaAntecipacao.create({
      data: {
        municipioId: params.municipioId,
        agendamentoId: candidato.id,
        dataHoraInicioAntiga: candidato.dataHoraInicio,
        dataHoraFimAntiga: candidato.dataHoraFim,
        novaDataHoraInicio,
        novaDataHoraFim,
        estado: "PENDENTE",
        expiraEm: new Date(Date.now() + EXPIRACAO_OFERTA_MINUTOS * 60_000),
      },
    });

    if (candidato.utilizadorId) {
      const requerente = await tx.utilizador.findUnique({
        where: { id: candidato.utilizadorId },
        select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
      });
      if (requerente) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: candidato.utilizadorId,
          titulo: "Surgiu uma oportunidade",
          mensagem:
            `O seu atendimento pode ser antecipado de ${candidato.dataHoraInicio.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })} ` +
            `para ${novaDataHoraInicio.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}. ` +
            `A vaga expira em ${EXPIRACAO_OFERTA_MINUTOS} minutos.`,
          tipo: "SISTEMA",
          emailDestino: null,
          nomeDestino: requerente.nomeCompleto,
          telefoneDestino: requerente.telefone,
          canais: ["APP", "SMS"],
        });
      }
    }

    return oferta;
  });
}

/**
 * ALTERADO: exige `municipioId` explicitamente, pela mesma razão de defesa
 * em profundidade de todo o resto desta auditoria — antes actualizava
 * TODAS as ofertas pendentes vencidas, de qualquer município, só porque
 * corria dentro de uma tx com scope (potencial, não confirmado) de tenant.
 */
export async function expirarOfertasVencidas(
  tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0],
  municipioId: string
) {
  await tx.ofertaAntecipacao.updateMany({
    where: { municipioId, estado: "PENDENTE", expiraEm: { lt: new Date() } },
    data: { estado: "EXPIRADA", resolvidoEm: new Date() },
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

export async function aceitarOferta(params: { municipioId: string; ofertaId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await expirarOfertasVencidas(tx, params.municipioId);

    const oferta = await tx.ofertaAntecipacao.findFirst({
      where: { id: params.ofertaId, municipioId: params.municipioId },
    });
    if (!oferta) throw new OfertaNaoEncontradaError("Oferta não encontrada.");

    const agendamento = await tx.agendamento.findFirst({
      where: { id: oferta.agendamentoId, municipioId: params.municipioId },
    });
    if (!agendamento) throw new OfertaNaoEncontradaError("Agendamento associado não encontrado.");
    if (agendamento.utilizadorId !== params.utilizadorId) {
      throw new AgendamentoEstadoInvalidoError("Só o próprio requerente pode responder a esta oferta.");
    }
    if (oferta.estado !== "PENDENTE") {
      throw new OfertaIndisponivelError(`Esta oferta já não está disponível (estado: ${oferta.estado}).`);
    }

    // Revalidação de segurança: o horário ainda está livre? (protege
    // contra corrida entre a criação da oferta e a aceitação).
    const conflito = await tx.agendamento.findFirst({
      where: {
        municipioId: params.municipioId,
        id: { not: agendamento.id },
        tipo: agendamento.tipo,
        estado: { in: [...ESTADOS_ATIVOS] },
        dataHoraInicio: { lt: oferta.novaDataHoraFim },
        dataHoraFim: { gt: oferta.novaDataHoraInicio },
      },
    });
    if (conflito) {
      await tx.ofertaAntecipacao.update({
        where: { id: oferta.id },
        data: { estado: "EXPIRADA", resolvidoEm: new Date() },
      });
      throw new ConflitoDeHorarioError("Essa vaga acabou de deixar de estar disponível.");
    }

    const agendamentoAtualizado = await tx.agendamento.update({
      where: { id: agendamento.id },
      data: { dataHoraInicio: oferta.novaDataHoraInicio, dataHoraFim: oferta.novaDataHoraFim },
    });

    await tx.ofertaAntecipacao.update({
      where: { id: oferta.id },
      data: { estado: "ACEITE", resolvidoEm: new Date() },
    });

    // Qualquer outra oferta pendente para este mesmo agendamento fica sem efeito.
    await tx.ofertaAntecipacao.updateMany({
      where: { agendamentoId: agendamento.id, estado: "PENDENTE", id: { not: oferta.id } },
      data: { estado: "SUBSTITUIDA", resolvidoEm: new Date() },
    });

    return {
      agendamento: agendamentoAtualizado,
      vagaAntigaLiberada: { tipo: agendamento.tipo, dataHoraInicio: oferta.dataHoraInicioAntiga, dataHoraFim: oferta.dataHoraFimAntiga },
    };
  });
}

export async function recusarOferta(params: { municipioId: string; ofertaId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await expirarOfertasVencidas(tx, params.municipioId);

    const oferta = await tx.ofertaAntecipacao.findFirst({
      where: { id: params.ofertaId, municipioId: params.municipioId },
    });
    if (!oferta) throw new OfertaNaoEncontradaError("Oferta não encontrada.");

    const agendamento = await tx.agendamento.findFirst({
      where: { id: oferta.agendamentoId, municipioId: params.municipioId },
    });
    if (agendamento?.utilizadorId !== params.utilizadorId) {
      throw new AgendamentoEstadoInvalidoError("Só o próprio requerente pode responder a esta oferta.");
    }
    if (oferta.estado !== "PENDENTE") {
      throw new OfertaIndisponivelError(`Esta oferta já não está disponível (estado: ${oferta.estado}).`);
    }

    const atualizada = await tx.ofertaAntecipacao.update({
      where: { id: oferta.id },
      data: { estado: "RECUSADA", resolvidoEm: new Date() },
    });

    return { oferta: atualizada, vaga: { tipo: agendamento.tipo, dataHoraInicio: oferta.novaDataHoraInicio, dataHoraFim: oferta.novaDataHoraFim } };
  });
}