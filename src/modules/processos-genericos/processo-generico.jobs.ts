
import { prisma } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";

const ESTADOS_TERMINAIS = ["CONCLUIDO"] as const;

export async function notificarAlertasPrazosProcessosPendentes(params: {
  municipioId: string;
}): Promise<{ notificados: number }> {
  const agora = new Date();

  const candidatos = await prisma.processoGenerico.findMany({
    where: {
      municipioId: params.municipioId,
      prazoLegalResposta: { not: null },
      estado: { notIn: [...ESTADOS_TERMINAIS] },
      arquivoDigitalEm: null,
      responsavelActualId: { not: null },
      OR: [{ alertaEnviadoEm: null }, { escaladoEm: null }],
    },
    select: {
      id: true,
      numero: true,
      prazoLegalResposta: true,
      diasAlertaAntesPrazo: true,
      alertaEnviadoEm: true,
      escaladoEm: true,
      responsavelActual: {
        select: { id: true, nomeCompleto: true, email: true, superiorId: true },
      },
    },
  });

  let notificados = 0;

  for (const processo of candidatos) {
    if (!processo.prazoLegalResposta || !processo.responsavelActual) continue;

    const dataInicioAlerta = new Date(processo.prazoLegalResposta);
    dataInicioAlerta.setDate(dataInicioAlerta.getDate() - processo.diasAlertaAntesPrazo);

    const jaVenceu = agora >= processo.prazoLegalResposta;
    const dentroDaJanelaDeAlerta = agora >= dataInicioAlerta;

    try {
      await prisma.$transaction(async (tx) => {
        // Prazo já ultrapassado → escala para o superior (ou reforça o próprio responsável, se não houver superior).
        if (jaVenceu && !processo.escaladoEm) {
          const destinoId = processo.responsavelActual!.superiorId ?? processo.responsavelActual!.id;
          const destino =
            destinoId === processo.responsavelActual!.id
              ? processo.responsavelActual!
              : await tx.utilizador.findUnique({
                  where: { id: destinoId },
                  select: { id: true, nomeCompleto: true, email: true },
                });

          if (destino) {
            await notificarUtilizador(tx, {
              utilizadorDestinoId: destino.id,
              titulo: `Processo ${processo.numero} — prazo legal ultrapassado`,
              mensagem: `O processo ${processo.numero} ultrapassou o prazo legal de resposta e foi escalado.`,
              tipo: "ACAO_REQUERIDA",
              metadata: { processoId: processo.id, numeroProcesso: processo.numero },
              emailDestino: destino.email,
              nomeDestino: destino.nomeCompleto,
              canais: ["APP", "EMAIL"],
            });
          }

          await tx.processoGenerico.update({
            where: { id: processo.id },
            data: { escaladoEm: agora, ...(processo.alertaEnviadoEm ? {} : { alertaEnviadoEm: agora }) },
          });

          notificados += 1;
          return;
        }

        // Dentro da janela de alerta, mas ainda dentro do prazo → avisa o responsável actual.
        if (dentroDaJanelaDeAlerta && !processo.alertaEnviadoEm) {
          await notificarUtilizador(tx, {
            utilizadorDestinoId: processo.responsavelActual!.id,
            titulo: `Processo ${processo.numero} — prazo a aproximar-se`,
            mensagem: `O processo ${processo.numero} tem prazo legal de resposta em ${processo.prazoLegalResposta!.toLocaleDateString("pt-PT")}.`,
            tipo: "ACAO_REQUERIDA",
            metadata: { processoId: processo.id, numeroProcesso: processo.numero },
            emailDestino: processo.responsavelActual!.email,
            nomeDestino: processo.responsavelActual!.nomeCompleto,
            canais: ["APP", "EMAIL"],
          });

          await tx.processoGenerico.update({
            where: { id: processo.id },
            data: { alertaEnviadoEm: agora },
          });

          notificados += 1;
        }
      });
    } catch (erro) {
      console.error(`[SLA] Falha ao notificar processo ${processo.id}:`, erro);
    }
  }

  return { notificados };
}