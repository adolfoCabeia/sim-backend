import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/process-engine/process-engine.notifications.js";
import { obterAgendamentoOuFalhar, AgendamentoEstadoInvalidoError } from "./agendamento.service.js";
import {
  TEMPO_MEDIO_ATENDIMENTO_PADRAO_MINUTOS,
  AMOSTRA_HISTORICO_TEMPO_MEDIO,
  LIMIAR_NOTIFICACAO_PROXIMO_MINUTOS,
  INTERVALO_MINIMO_ENTRE_NOTIFICACOES_MINUTOS,
  PREFIXO_SENHA,
} from "./agendamento.constants.js";
import { inicioDoDiaEmAngola, chaveDoDiaEmAngola } from "./agendamento.timezone.js";

/**
 * "Chegue quando for realmente necessário": em vez de o cidadão ficar
 * sentado à hora marcada, o sistema calcula quantas pessoas estão à
 * frente e o tempo médio real de atendimento, e avisa quando estiver
 * quase na vez.
 */

export type EstadoFila =
  | "NAO_APLICAVEL" // agendamento não está SOLICITADO/CONFIRMADO
  | "EM_ATENDIMENTO"
  | "CONCLUIDO"
  | "CHAME_JA" // 0 pessoas à frente, mas ainda não foi chamado
  | "PROXIMO" // ETA dentro do limiar de notificação
  | "AGUARDANDO";

export interface StatusFila {
  agendamentoId: string;
  estado: EstadoFila;
  pessoasAFrente: number;
  tempoMedioAtendimentoMinutos: number;
  tempoEstimadoEsperaMinutos: number;
  horaEstimada: Date | null;
}

/**
 * Tempo médio de atendimento calculado a partir do histórico real
 * (diferença entre início e fim efectivos do atendimento), não da
 * duração agendada. Cai para um valor padrão quando não há amostra
 * suficiente (ex.: serviço acabou de arrancar).
 */
export async function calcularTempoMedioAtendimento(params: { municipioId: string; tipo: "ADMINISTRADOR" | "ASSISTENTE_SOCIAL" }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const recentes = await tx.agendamento.findMany({
      where: {
        municipioId: params.municipioId,
        tipo: params.tipo,
        estado: "REALIZADO",
        atendimentoIniciadoEm: { not: null },
        atendimentoConcluidoEm: { not: null },
      },
      orderBy: { atendimentoConcluidoEm: "desc" },
      take: AMOSTRA_HISTORICO_TEMPO_MEDIO,
      select: { atendimentoIniciadoEm: true, atendimentoConcluidoEm: true },
    });

    if (recentes.length === 0) {
      return TEMPO_MEDIO_ATENDIMENTO_PADRAO_MINUTOS;
    }

    const somaMinutos = recentes.reduce((soma, a) => {
      const duracao = (a.atendimentoConcluidoEm!.getTime() - a.atendimentoIniciadoEm!.getTime()) / 60_000;
      return soma + Math.max(duracao, 1); // protege contra registos corrompidos (duração <= 0)
    }, 0);

    return Math.round(somaMinutos / recentes.length);
  });
}

export async function obterStatusFila(params: { municipioId: string; agendamentoId: string }): Promise<StatusFila> {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);

    if (agendamento.estado === "REALIZADO") {
      return {
        agendamentoId: agendamento.id,
        estado: "CONCLUIDO",
        pessoasAFrente: 0,
        tempoMedioAtendimentoMinutos: 0,
        tempoEstimadoEsperaMinutos: 0,
        horaEstimada: null,
      };
    }
    if (agendamento.estado !== "SOLICITADO" && agendamento.estado !== "CONFIRMADO") {
      return {
        agendamentoId: agendamento.id,
        estado: "NAO_APLICAVEL",
        pessoasAFrente: 0,
        tempoMedioAtendimentoMinutos: 0,
        tempoEstimadoEsperaMinutos: 0,
        horaEstimada: null,
      };
    }
    if (agendamento.atendimentoIniciadoEm) {
      return {
        agendamentoId: agendamento.id,
        estado: "EM_ATENDIMENTO",
        pessoasAFrente: 0,
        tempoMedioAtendimentoMinutos: 0,
        tempoEstimadoEsperaMinutos: 0,
        horaEstimada: null,
      };
    }

    // Fila = agendamentos do mesmo tipo, activos, com hora marcada antes
    // da deste (a fila virtual segue a ordem de marcação, não de chegada
    // física), e que ainda não terminaram o atendimento.
    const pessoasAFrente = await tx.agendamento.count({
      where: {
        municipioId: params.municipioId,
        tipo: agendamento.tipo,
        estado: { in: ["SOLICITADO", "CONFIRMADO"] },
        atendimentoConcluidoEm: null,
        dataHoraInicio: { lt: agendamento.dataHoraInicio },
      },
    });

    const tempoMedio = await calcularTempoMedioAtendimento({ municipioId: params.municipioId, tipo: agendamento.tipo });
    const tempoEstimadoEsperaMinutos = pessoasAFrente * tempoMedio;
    const horaEstimada = new Date(Date.now() + tempoEstimadoEsperaMinutos * 60_000);

    let estado: EstadoFila = "AGUARDANDO";
    if (pessoasAFrente === 0) estado = "CHAME_JA";
    else if (tempoEstimadoEsperaMinutos <= LIMIAR_NOTIFICACAO_PROXIMO_MINUTOS) estado = "PROXIMO";

    return {
      agendamentoId: agendamento.id,
      estado,
      pessoasAFrente,
      tempoMedioAtendimentoMinutos: tempoMedio,
      tempoEstimadoEsperaMinutos,
      horaEstimada,
    };
  });
}

/** O cidadão sinaliza "Estou a caminho" — puramente informativo para o staff, não bloqueia a fila. */
export async function marcarEstouACaminho(params: { municipioId: string; agendamentoId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);
    if (agendamento.utilizadorId !== params.utilizadorId) {
      throw new AgendamentoEstadoInvalidoError("Só o próprio requerente pode sinalizar chegada.");
    }
    if (agendamento.estado !== "SOLICITADO" && agendamento.estado !== "CONFIRMADO") {
      throw new AgendamentoEstadoInvalidoError("Este agendamento já não está activo.");
    }
    return tx.agendamento.update({ where: { id: agendamento.id }, data: { chegouEm: new Date() } });
  });
}

/**
 * ALTERADO — geração de senha à prova de concorrência.
 *
 * ANTES: `count` das senhas de hoje, seguido de `create/update` — clássica
 * condição de corrida "ler-depois-escrever": duas chamadas simultâneas
 * (mesmo de agendamentos DIFERENTES) podiam ler o mesmo `count` antes de
 * qualquer uma escrever, e gerar a mesma senha. Isto viola directamente o
 * requisito "dois atendimentos simultâneos não podem receber a mesma
 * senha".
 *
 * AGORA: um UPSERT atómico do Postgres (`INSERT ... ON CONFLICT DO UPDATE
 * ... RETURNING`) sobre uma tabela de contadores dedicada, com chave
 * (municipioId, tipo, dia). O Postgres serializa isto ao nível da linha —
 * não há janela onde duas transacções possam ler o mesmo valor antes de
 * qualquer uma escrever. Requer a tabela nova `contadores_senha` — ver
 * nota de schema Prisma no resumo final.
 *
 * O escopo da senha (por município + tipo + dia) é o mesmo que já estava
 * implícito no `count` original (contava só o `tipo` pedido, dentro do dia
 * em Angola) — mantive esse escopo, só troquei o mecanismo.
 */
async function gerarNumeroSenha(
  tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0],
  municipioId: string,
  tipo: "ADMINISTRADOR" | "ASSISTENTE_SOCIAL"
): Promise<string> {
  const dia = chaveDoDiaEmAngola();

  const resultado = await tx.$queryRaw<{ contador: number }[]>`
    INSERT INTO contadores_senha ("municipioId", tipo, dia, contador)
    VALUES (${municipioId}, ${tipo}, ${dia}, 1)
    ON CONFLICT ("municipioId", tipo, dia)
    DO UPDATE SET contador = contadores_senha.contador + 1
    RETURNING contador
  `;

  const contador = resultado[0]?.contador ?? 1;
  return `${PREFIXO_SENHA[tipo]}-${String(contador).padStart(3, "0")}`;
}

/**
 * ALTERADO — atomicidade da própria chamada.
 *
 * ANTES: lia o estado, validava fora da escrita, e só depois fazia
 * `update` incondicional. Dois atendentes a clicar "Chamar" ao mesmo tempo
 * no MESMO agendamento podiam ambos passar a validação (ambos liam
 * CONFIRMADO) e ambos escrever — o segundo update simplesmente
 * sobrescrevia o primeiro em silêncio, sem erro nenhum.
 *
 * AGORA: a escrita é condicional (`updateMany` com `estado: "CONFIRMADO",
 * atendimentoIniciadoEm: null` no WHERE) — só UM dos dois pedidos
 * concorrentes consegue actualizar 1 linha; o outro recebe count=0 e um
 * erro claro em vez de "roubar" silenciosamente a chamada.
 *
 * NOVO: `chamadoPorId` — regista quem efectivamente chamou (pode ser
 * diferente de quem confirmou). Requer o campo novo no schema — ver nota
 * no resumo final.
 */
export async function chamarAtendimento(params: { municipioId: string; agendamentoId: string; chamadoPorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const agendamento = await obterAgendamentoOuFalhar(tx, params.municipioId, params.agendamentoId);
    if (agendamento.estado !== "CONFIRMADO") {
      throw new AgendamentoEstadoInvalidoError("Só é possível chamar um agendamento CONFIRMADO.");
    }
    if (agendamento.atendimentoIniciadoEm) {
      throw new AgendamentoEstadoInvalidoError("Este agendamento já foi chamado.");
    }

    const numeroSenha = await gerarNumeroSenha(tx, params.municipioId, agendamento.tipo);

    const resultado = await tx.agendamento.updateMany({
      where: { id: agendamento.id, estado: "CONFIRMADO", atendimentoIniciadoEm: null },
      data: { atendimentoIniciadoEm: new Date(), numeroSenha, chamadoPorId: params.chamadoPorId },
    });

    if (resultado.count === 0) {
      throw new AgendamentoEstadoInvalidoError(
        "Este agendamento já foi chamado por outro atendente entretanto."
      );
    }

    const atualizado = await tx.agendamento.findUniqueOrThrow({ where: { id: agendamento.id } });

    if (agendamento.utilizadorId) {
      const requerente = await tx.utilizador.findUnique({
        where: { id: agendamento.utilizadorId },
        select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
      });
      if (requerente) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: agendamento.utilizadorId,
          titulo: "Dirija-se ao balcão",
          mensagem: `É a sua vez. Atendimento nº ${numeroSenha}.`,
          tipo: "SISTEMA",
          emailDestino: null, // urgente: só canais rápidos
          nomeDestino: requerente.nomeCompleto,
          telefoneDestino: requerente.telefone,
          canais: ["APP", "SMS"],
        });
      }
    }

    return atualizado;
  });
}

/**
 * Percorre os agendamentos activos e avisa quem está prestes a ser
 * chamado, respeitando um intervalo mínimo entre notificações repetidas.
 * Pensado para ser invocado periodicamente por um job (cron/BullMQ) —
 * este módulo não agenda o job em si.
 */
export async function notificarProximosDaFila(params: { municipioId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const candidatos = await tx.agendamento.findMany({
      where: {
        municipioId: params.municipioId,
        estado: { in: ["SOLICITADO", "CONFIRMADO"] },
        atendimentoIniciadoEm: null,
      },
      orderBy: { dataHoraInicio: "asc" },
    });

    let notificados = 0;
    for (const agendamento of candidatos) {
      const status = await obterStatusFila({ municipioId: params.municipioId, agendamentoId: agendamento.id });
      if (status.estado !== "PROXIMO" && status.estado !== "CHAME_JA") continue;

      const jaNotificadoRecentemente =
        agendamento.ultimaNotificacaoFilaEm &&
        Date.now() - agendamento.ultimaNotificacaoFilaEm.getTime() < INTERVALO_MINIMO_ENTRE_NOTIFICACOES_MINUTOS * 60_000;
      if (jaNotificadoRecentemente) continue;

      if (agendamento.utilizadorId) {
        const requerente = await tx.utilizador.findUnique({
          where: { id: agendamento.utilizadorId },
          select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
        });
        if (requerente) {
          await notificarUtilizador(tx, {
            utilizadorDestinoId: agendamento.utilizadorId,
            titulo: "Está quase na sua vez",
            mensagem:
              status.pessoasAFrente === 0
                ? "Pode dirigir-se ao balcão dentro de instantes."
                : `Há aproximadamente ${status.tempoEstimadoEsperaMinutos} minutos até ao seu atendimento (${status.pessoasAFrente} pessoa(s) à frente).`,
            tipo: "SISTEMA",
            emailDestino: null,
            nomeDestino: requerente.nomeCompleto,
            telefoneDestino: requerente.telefone,
            canais: ["APP", "SMS"],
          });
        }
      }

      await tx.agendamento.update({ where: { id: agendamento.id }, data: { ultimaNotificacaoFilaEm: new Date() } });
      notificados += 1;
    }

    return { notificados };
  });
}