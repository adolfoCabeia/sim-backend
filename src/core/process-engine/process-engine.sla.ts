import type { Prisma } from "../../generated/prisma/client.js";
import { prisma, withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "./process-engine.notifications.js";

export async function verificarSlasPendentes(): Promise<{ alertados: number; escalados: number }> {
  const agora = new Date();
  let alertados = 0;
  let escalados = 0;
  const municipios = await prisma.municipio.findMany({ where: { activo: true }, select: { id: true } });

  for (const { id: municipioId } of municipios) {
    const resultado = await withTenantTransaction(municipioId, async (tx) => {
      let alertadosMunicipio = 0;
      let escaladosMunicipio = 0;

      const emRisco = await tx.processoGenerico.findMany({
        where: {
          arquivoMortoEm: null,
          estado: { notIn: ["CONCLUIDO"] },
          prazoLegalResposta: { not: null },
        },
        select: {
          id: true,
          numero: true,
          prazoLegalResposta: true,
          diasAlertaAntesPrazo: true,
          alertaEnviadoEm: true,
          escaladoEm: true,
          responsavelActualId: true,
          direcaoAtualId: true,
        },
      });

      for (const processo of emRisco) {
        if (!processo.prazoLegalResposta) continue;
        const diasParaVencer = Math.ceil(
          (processo.prazoLegalResposta.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!processo.alertaEnviadoEm && diasParaVencer <= processo.diasAlertaAntesPrazo) {
          if (processo.responsavelActualId) {
            const responsavel = await tx.utilizador.findUnique({
              where: { id: processo.responsavelActualId },
              select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
            });
            if (responsavel) {
              await notificarUtilizador(tx, {
                utilizadorDestinoId: processo.responsavelActualId,
                titulo: `Processo ${processo.numero} perto do prazo legal`,
                mensagem:
                  diasParaVencer >= 0
                    ? `O processo ${processo.numero} vence em ${diasParaVencer} dia(s). Por favor dê seguimento.`
                    : `O processo ${processo.numero} já ultrapassou o prazo legal de resposta.`,
                tipo: "ACAO_REQUERIDA",
                metadata: { processoId: processo.id, numeroProcesso: processo.numero },
                emailDestino: responsavel.emailConfirmado ? responsavel.email : null,
                nomeDestino: responsavel.nomeCompleto,
                telefoneDestino: responsavel.telefone,
              });
            }
          }
          await tx.processoGenerico.update({ where: { id: processo.id }, data: { alertaEnviadoEm: agora } });
          alertadosMunicipio++;
          continue;
        }

        if (processo.alertaEnviadoEm && !processo.escaladoEm && diasParaVencer < 0) {
          const superior = await obterSuperiorHierarquico(tx, processo.responsavelActualId, processo.direcaoAtualId);
          if (superior) {
            await notificarUtilizador(tx, {
              utilizadorDestinoId: superior.id,
              titulo: `Escalada: Processo ${processo.numero} ultrapassou o prazo legal`,
              mensagem: `O processo ${processo.numero} ultrapassou o prazo legal e ainda não foi concluído. Requer a sua intervenção.`,
              tipo: "ACAO_REQUERIDA",
              metadata: { processoId: processo.id, numeroProcesso: processo.numero },
              emailDestino: superior.emailConfirmado ? superior.email : null,
              nomeDestino: superior.nomeCompleto,
              telefoneDestino: superior.telefone,
            });
          }
          await tx.processoGenerico.update({ where: { id: processo.id }, data: { escaladoEm: agora } });
          escaladosMunicipio++;
        }
      }

      return { alertadosMunicipio, escaladosMunicipio };
    });

    alertados += resultado.alertadosMunicipio;
    escalados += resultado.escaladosMunicipio;
  }

  return { alertados, escalados };
}

async function obterSuperiorHierarquico(
  tx: Prisma.TransactionClient,
  responsavelActualId: string | null,
  direcaoId: string | null
) {
  if (responsavelActualId) {
    const responsavel = await tx.utilizador.findUnique({
      where: { id: responsavelActualId },
      select: { superiorId: true },
    });
    if (responsavel?.superiorId) {
      const superior = await tx.utilizador.findUnique({
        where: { id: responsavel.superiorId },
        select: { id: true, estado: true, email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
      });
      if (superior && superior.estado === "ACTIVA") {
        return superior;
      }
    }
  }
  if (!direcaoId) return null;
  return tx.utilizador.findFirst({
    where: {
      direcaoId,
      estado: "ACTIVA",
      perfis: { some: { perfil: { nome: { startsWith: "DIRECTOR_" } } } },
    },
    select: { id: true, email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
  });
}