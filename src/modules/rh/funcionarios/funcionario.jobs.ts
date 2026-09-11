import { withTenantTransaction } from "../../../config/prisma.js";
import { notificarUtilizador } from "../../../core/process-engine/process-engine.notifications.js";
import {
  LIMIAR_ALERTA_FIM_VINCULO_DIAS,
  INTERVALO_MINIMO_NOTIFICACAO_FIM_VINCULO_DIAS,
} from "../rh.constants.js";

export async function notificarFimDeVinculoProximo(params: { municipioId: string }) {
  return withTenantTransaction(params.municipioId, async (tx: any) => {
    const limite = new Date(Date.now() + LIMIAR_ALERTA_FIM_VINCULO_DIAS * 24 * 60 * 60_000);

    const candidatos = await tx.funcionario.findMany({
      where: {
        tipoVinculo: { in: ["CONTRATO", "ESTAGIARIO"] },
        dataFimVinculo: { not: null, lte: limite, gte: new Date() },
        estado: { not: "OUTRO" },
      },
    });

    let notificados = 0;
    for (const funcionario of candidatos) {
      const jaNotificadoRecentemente =
        funcionario.ultimaNotificacaoFimVinculoEm &&
        Date.now() - funcionario.ultimaNotificacaoFimVinculoEm.getTime() <
          INTERVALO_MINIMO_NOTIFICACAO_FIM_VINCULO_DIAS * 24 * 60 * 60_000;
      if (jaNotificadoRecentemente) continue;

      const diasRestantes = Math.ceil((funcionario.dataFimVinculo!.getTime() - Date.now()) / (24 * 60 * 60_000));

      const utilizador = await tx.utilizador.findUnique({
        where: { id: funcionario.utilizadorId },
        select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
      });
      if (utilizador) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: funcionario.utilizadorId,
          titulo: "O seu vínculo está a aproximar-se do fim",
          mensagem: `O seu vínculo termina em ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} (${funcionario.dataFimVinculo!.toLocaleDateString("pt-AO")}).`,
          tipo: "SISTEMA",
          emailDestino: utilizador.emailConfirmado ? utilizador.email : null,
          nomeDestino: utilizador.nomeCompleto,
          telefoneDestino: utilizador.telefone,
          canais: ["APP", "EMAIL"],
        });
      }

      await tx.funcionario.update({
        where: { id: funcionario.id },
        data: { ultimaNotificacaoFimVinculoEm: new Date() },
      });
      notificados += 1;
    }

    return { notificados };
  });
}

/**
 * Deriva o estado "Em férias" a partir dos pedidos aprovados, em vez de
 * deixar alguém defini-lo à mão (e esquecer-se de o reverter). Corre-se
 * bem uma vez por dia, de manhã cedo.
 */
export async function sincronizarEstadoFerias(params: { municipioId: string }) {
  return withTenantTransaction(params.municipioId, async (tx: any) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [aEntrarEmFerias, aRegressarDeFerias] = await Promise.all([
      tx.funcionario.findMany({
        where: {
          estado: "ATIVO",
          pedidosFerias: { some: { estado: "APROVADO", dataInicio: { lte: hoje }, dataFim: { gte: hoje } } },
        },
      }),
      tx.funcionario.findMany({
        where: {
          estado: "EM_FERIAS",
          pedidosFerias: { none: { estado: "APROVADO", dataInicio: { lte: hoje }, dataFim: { gte: hoje } } },
        },
      }),
    ]);

    await Promise.all([
      ...aEntrarEmFerias.map((f: any) => tx.funcionario.update({ where: { id: f.id }, data: { estado: "EM_FERIAS" } })),
      ...aRegressarDeFerias.map((f: any) => tx.funcionario.update({ where: { id: f.id }, data: { estado: "ATIVO" } })),
    ]);

    return { entraramEmFerias: aEntrarEmFerias.length, regressaramDeFerias: aRegressarDeFerias.length };
  });
}
