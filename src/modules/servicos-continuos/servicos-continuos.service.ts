import { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { listarUtilizadoresComPermissao } from "../auth/rbac/rbac.service.js";
import type {
  ServicoContinuoCreateInput,
  ServicoContinuoUpdateInput,
  RecargaInput,
} from "./servicos-continuos.schema.js";

const NIVEIS_NOTIFICAVEIS = new Set(["URGENTE", "ATENCAO"]);

const ORDEM_GRAVIDADE: Record<string, number> = {
  INFO: 0,
  ATENCAO: 1,
  URGENTE: 2,
};

const INTERVALO_MINIMO_REENVIO_HORAS = 24;

// ─── AUDITORIA ───────────────────────────────────────────────────────────────
async function registarAuditoria(
  tx: Prisma.TransactionClient,
  params: {
    municipioId: string;
    utilizadorId?: string | null;
    accao: string;
    entidade: string;
    entidadeId?: string | null;
    detalhes?: Prisma.InputJsonValue;   // JSON details, optional
  }
) {
  await tx.logAuditoria.create({
    data: {
      municipioId: params.municipioId,
      utilizadorId: params.utilizadorId ?? null,
      accao: params.accao,
      entidade: params.entidade,
      entidadeId: params.entidadeId ?? null,
      detalhes: params.detalhes ?? Prisma.DbNull, // use Prisma.DbNull for JSON null
    },
  });
}


// ─── CONSULTA ────────────────────────────────────────────────────────────────

export async function obter(
  id: string,
  municipioId: string
) {
  return withTenantTransaction(
    municipioId,
    async (tx) => {
      return tx.servicoContinuo.findUnique({
        where: { id },
      });
    }
  );
}

export async function listar(
  filtros: {
    municipioId: string;
    tipo?: string | undefined;
    estado?: string | undefined;
    proximoVencimento?: boolean | undefined;
  },
  paginacao: {
    page: number;
    limit: number;
  }
) {
  const skip =
    (paginacao.page - 1) *
    paginacao.limit;

  const where: Prisma.ServicoContinuoWhereInput = {
    ...(filtros.tipo && {
      tipo:
        filtros.tipo as Prisma.EnumTipoServicoContinuoFilter<"ServicoContinuo">,
    }),

    ...(filtros.estado && {
      estado:
        filtros.estado as Prisma.EnumEstadoServicoContinuoFilter<"ServicoContinuo">,
    }),
  };

  if (filtros.proximoVencimento) {
    const hoje = new Date();

    const limite = new Date(hoje);
    limite.setDate(
      hoje.getDate() + 30
    );

    where.dataPrevistaEsgotamento = {
      lte: limite,
      gte: hoje,
    };
  }

  return withTenantTransaction(
    filtros.municipioId,
    async (tx) => {
      const [data, total] =
        await Promise.all([
          tx.servicoContinuo.findMany({
            where,
            skip,
            take: paginacao.limit,
            orderBy: {
              designacao: "asc",
            },
          }),

          tx.servicoContinuo.count({
            where,
          }),
        ]);

      return {
        data,
        total,
      };
    }
  );
}

// ─── CRIAÇÃO ─────────────────────────────────────────────────────────────────

export async function criar(
  municipioId: string,
  dados: ServicoContinuoCreateInput,
  utilizadorId: string
) {
  return withTenantTransaction(
    municipioId,
    async (tx) => {
      const payload: Prisma.ServicoContinuoUncheckedCreateInput =
        {
          municipioId,
          tipo: dados.tipo,
          designacao: dados.designacao,
          estado: dados.estado,
          alertaDiasAntes:
            dados.alertaDiasAntes,

          ...(dados.fornecedor !==
            undefined &&
            dados.fornecedor !== null && {
              fornecedor:
                dados.fornecedor,
            }),

          ...(dados.numeroContrato !==
            undefined &&
            dados.numeroContrato !== null && {
              numeroContrato:
                dados.numeroContrato,
            }),

          ...(dados.dataUltimoCarregamento !==
            undefined &&
            dados.dataUltimoCarregamento !==
              null && {
              dataUltimoCarregamento:
                new Date(
                  dados.dataUltimoCarregamento
                ),
            }),

          ...(dados.valorUltimoCarregamento !==
            undefined &&
            dados.valorUltimoCarregamento !==
              null && {
              valorUltimoCarregamento:
                dados.valorUltimoCarregamento,
            }),

          ...(dados.consumoEstimadoDias !==
            undefined &&
            dados.consumoEstimadoDias !==
              null && {
              consumoEstimadoDias:
                dados.consumoEstimadoDias,
            }),

          ...(dados.dataPrevistaEsgotamento !==
            undefined &&
            dados.dataPrevistaEsgotamento !==
              null && {
              dataPrevistaEsgotamento:
                new Date(
                  dados.dataPrevistaEsgotamento
                ),
            }),

          ...(dados.dataProximoCarregamento !==
            undefined &&
            dados.dataProximoCarregamento !==
              null && {
              dataProximoCarregamento:
                new Date(
                  dados.dataProximoCarregamento
                ),
            }),
        };

      const servico =
        await tx.servicoContinuo.create({
          data: payload,
        });

      await registarAuditoria(tx, {
        municipioId,
        utilizadorId,
        accao: "CRIAR",
        entidade: "ServicoContinuo",
        entidadeId: servico.id,
        detalhes: {
          tipo: servico.tipo,
          designacao:
            servico.designacao,
          estado: servico.estado,
          alertaDiasAntes:
            servico.alertaDiasAntes,
          fornecedor:
            servico.fornecedor,
          numeroContrato:
            servico.numeroContrato,
        },
      });

      return servico;
    }
  );
}

// ─── ACTUALIZAÇÃO ────────────────────────────────────────────────────────────

export async function atualizar(
  id: string,
  municipioId: string,
  dados: ServicoContinuoUpdateInput,
  utilizadorId: string
) {
  return withTenantTransaction(
    municipioId,
    async (tx) => {
      const servicoAnterior =
        await tx.servicoContinuo.findUnique({
          where: { id },
        });

      if (!servicoAnterior) {
        throw new Error(
          "Serviço contínuo não encontrado."
        );
      }

      const payload: Prisma.ServicoContinuoUncheckedUpdateInput =
        {
          ...(dados.tipo !== undefined && {
            tipo: dados.tipo,
          }),

          ...(dados.designacao !==
            undefined && {
            designacao:
              dados.designacao,
          }),

          ...(dados.estado !==
            undefined && {
            estado: dados.estado,
          }),

          ...(dados.alertaDiasAntes !==
            undefined && {
            alertaDiasAntes:
              dados.alertaDiasAntes,
          }),

          ...(dados.fornecedor !==
            undefined &&
            dados.fornecedor !== null && {
              fornecedor:
                dados.fornecedor,
            }),

          ...(dados.numeroContrato !==
            undefined &&
            dados.numeroContrato !== null && {
              numeroContrato:
                dados.numeroContrato,
            }),

          ...(dados.dataUltimoCarregamento !==
            undefined &&
            dados.dataUltimoCarregamento !==
              null && {
              dataUltimoCarregamento:
                new Date(
                  dados.dataUltimoCarregamento
                ),
            }),

          ...(dados.valorUltimoCarregamento !==
            undefined &&
            dados.valorUltimoCarregamento !==
              null && {
              valorUltimoCarregamento:
                dados.valorUltimoCarregamento,
            }),

          ...(dados.consumoEstimadoDias !==
            undefined &&
            dados.consumoEstimadoDias !==
              null && {
              consumoEstimadoDias:
                dados.consumoEstimadoDias,
            }),

          ...(dados.dataPrevistaEsgotamento !==
            undefined &&
            dados.dataPrevistaEsgotamento !==
              null && {
              dataPrevistaEsgotamento:
                new Date(
                  dados.dataPrevistaEsgotamento
                ),
            }),

          ...(dados.dataProximoCarregamento !==
            undefined &&
            dados.dataProximoCarregamento !==
              null && {
              dataProximoCarregamento:
                new Date(
                  dados.dataProximoCarregamento
                ),
            }),
        };

      const servico =
        await tx.servicoContinuo.update({
          where: { id },
          data: payload,
        });

      await registarAuditoria(tx, {
        municipioId,
        utilizadorId,
        accao: "ACTUALIZAR",
        entidade: "ServicoContinuo",
        entidadeId: id,
        detalhes: {
          antes: {
            tipo:
              servicoAnterior.tipo,
            designacao:
              servicoAnterior.designacao,
            estado:
              servicoAnterior.estado,
            alertaDiasAntes:
              servicoAnterior.alertaDiasAntes,
            fornecedor:
              servicoAnterior.fornecedor,
            numeroContrato:
              servicoAnterior.numeroContrato,
            dataPrevistaEsgotamento:
              servicoAnterior.dataPrevistaEsgotamento,
            dataProximoCarregamento:
              servicoAnterior.dataProximoCarregamento,
          },

          depois: {
            tipo: servico.tipo,
            designacao:
              servico.designacao,
            estado:
              servico.estado,
            alertaDiasAntes:
              servico.alertaDiasAntes,
            fornecedor:
              servico.fornecedor,
            numeroContrato:
              servico.numeroContrato,
            dataPrevistaEsgotamento:
              servico.dataPrevistaEsgotamento,
            dataProximoCarregamento:
              servico.dataProximoCarregamento,
          },
        },
      });

      return servico;
    }
  );
}

// ─── REMOÇÃO ─────────────────────────────────────────────────────────────────

export async function remover(
  id: string,
  municipioId: string,
  utilizadorId: string
) {
  return withTenantTransaction(
    municipioId,
    async (tx) => {
      const servico =
        await tx.servicoContinuo.findUnique({
          where: { id },
        });

      if (!servico) {
        throw new Error(
          "Serviço contínuo não encontrado."
        );
      }

      await tx.servicoContinuo.delete({
        where: { id },
      });

      await registarAuditoria(tx, {
        municipioId,
        utilizadorId,
        accao: "ELIMINAR",
        entidade: "ServicoContinuo",
        entidadeId: id,
        detalhes: {
          tipo: servico.tipo,
          designacao:
            servico.designacao,
          estado: servico.estado,
          fornecedor:
            servico.fornecedor,
          numeroContrato:
            servico.numeroContrato,
        },
      });

      return servico;
    }
  );
}

// ─── RECARGA ─────────────────────────────────────────────────────────────────

export async function registrarRecarga(
  id: string,
  municipioId: string,
  dados: RecargaInput,
  utilizadorId: string
) {
  return withTenantTransaction(
    municipioId,
    async (tx) => {
      const servico =
        await tx.servicoContinuo.findUnique({
          where: { id },
        });

      if (!servico) {
        throw new Error(
          "Serviço contínuo não encontrado."
        );
      }

      const dataCarregamento =
        new Date(
          dados.dataCarregamento
        );

      const consumoDias =
        dados.consumoEstimadoDias ??
        servico.consumoEstimadoDias ??
        30;

      const alertaDias = Math.max(
        7,
        dados.alertaDiasAntes ??
          servico.alertaDiasAntes ??
          7
      );

      const dataPrevistaEsgotamento =
        new Date(dataCarregamento);

      dataPrevistaEsgotamento.setDate(
        dataPrevistaEsgotamento.getDate() +
          consumoDias
      );

      const dataProximoCarregamento =
        new Date(
          dataPrevistaEsgotamento
        );

      dataProximoCarregamento.setDate(
        dataProximoCarregamento.getDate() -
          alertaDias
      );

      const actualizado =
        await tx.servicoContinuo.update({
          where: { id },
          data: {
            dataUltimoCarregamento:
              dataCarregamento,
            valorUltimoCarregamento:
              dados.valor,
            consumoEstimadoDias:
              consumoDias,
            dataPrevistaEsgotamento,
            dataProximoCarregamento,
            alertaDiasAntes:
              alertaDias,
            estado: "ACTIVO",
          },
        });

      /*
       * Uma nova recarga inicia um novo ciclo.
       *
       * Os alertas antigos não são apagados porque
       * podem servir como histórico. O novo ciclo
       * será avaliado pelos seus próprios níveis.
       */

      await registarAuditoria(tx, {
        municipioId,
        utilizadorId,
        accao: "REGISTRAR_RECARGA",
        entidade: "ServicoContinuo",
        entidadeId: id,
        detalhes: {
          designacao:
            servico.designacao,
          dataCarregamento,
          valor:
            dados.valor,
          consumoEstimadoDias:
            consumoDias,
          alertaDiasAntes:
            alertaDias,
          dataPrevistaEsgotamento,
          dataProximoCarregamento,
        },
      });

      return actualizado;
    }
  );
}

// ─── ALERTAS ─────────────────────────────────────────────────────────────────

export async function listarAlertas(
  municipioId: string
) {
  const hoje = new Date();

  const daqui15Dias =
    new Date(hoje);

  daqui15Dias.setDate(
    hoje.getDate() + 15
  );

  const daqui7Dias =
    new Date(hoje);

  daqui7Dias.setDate(
    hoje.getDate() + 7
  );

  const where: Prisma.ServicoContinuoWhereInput =
    {
      estado: "ACTIVO",

      OR: [
        {
          dataProximoCarregamento: {
            lte: daqui15Dias,
            gte: hoje,
          },
        },

        {
          dataPrevistaEsgotamento: {
            lte: daqui7Dias,
            gte: hoje,
          },
        },
      ],
    };

  return withTenantTransaction(
    municipioId,
    async (tx) => {
      const servicos =
        await tx.servicoContinuo.findMany({
          where,
          orderBy: {
            dataPrevistaEsgotamento:
              "asc",
          },
        });

      return servicos.map((s) => {
        const diasAteEsgotamento =
          s.dataPrevistaEsgotamento
            ? Math.ceil(
                (s.dataPrevistaEsgotamento.getTime() -
                  hoje.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;

        const diasAteAlerta =
          s.dataProximoCarregamento
            ? Math.ceil(
                (s.dataProximoCarregamento.getTime() -
                  hoje.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;

        let nivel:
          | "INFO"
          | "ATENCAO"
          | "URGENTE" =
          "INFO";

        let acaoRecomendada = "";

        if (
          diasAteEsgotamento !== null
        ) {
          if (
            diasAteEsgotamento <= 7
          ) {
            nivel = "URGENTE";

            acaoRecomendada =
              `Carregamento deve ser executado em até ` +
              `${diasAteEsgotamento} dias. ` +
              `Tempo mínimo de reação comprometido.`;
          } else if (
            diasAteEsgotamento <= 15
          ) {
            nivel = "ATENCAO";

            acaoRecomendada =
              `Iniciar processo de carregamento. ` +
              `Esgotamento previsto em ` +
              `${diasAteEsgotamento} dias.`;
          } else if (
            diasAteAlerta !== null &&
            diasAteAlerta <= 15
          ) {
            nivel = "ATENCAO";

            acaoRecomendada =
              `Período de alerta iniciado. ` +
              `Próximo carregamento recomendado em ` +
              `${diasAteAlerta} dias.`;
          }
        }

        return {
          servico: s,
          diasAteEsgotamento,
          diasAteAlerta,
          nivel,
          acaoRecomendada,
          mensagem:
            `[${nivel}] ${s.designacao} (${s.tipo}): ${acaoRecomendada}`,
        };
      });
    }
  );
}

// ─── NOTIFICAÇÃO PROACTIVA ──────────────────────────────────────────────────

export async function notificarAlertasServicosContinuosPendentes(
  params: {
    municipioId: string;
  }
): Promise<{
  notificados: number;
}> {
  const alertas =
    await listarAlertas(
      params.municipioId
    );

  const relevantes =
    alertas.filter((alerta) =>
      NIVEIS_NOTIFICAVEIS.has(
        alerta.nivel
      )
    );

  if (relevantes.length === 0) {
    return {
      notificados: 0,
    };
  }

  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const destinatarios =
        await listarUtilizadoresComPermissao(
          tx,
          "servicos-continuos:gerir"
        );

      if (
        destinatarios.length === 0
      ) {
        return {
          notificados: 0,
        };
      }

      let notificados = 0;

      const agora = new Date();

      const limiteReenvio =
        new Date(
          agora.getTime() -
            INTERVALO_MINIMO_REENVIO_HORAS *
              60 *
              60_000
        );

      for (const alerta of relevantes) {
        const servico =
          alerta.servico;

        /*
         * Cada serviço possui uma linha de
         * alerta por nível:
         *
         * serviço + ATENCAO
         * serviço + URGENTE
         *
         * Assim, a escalada de ATENCAO para
         * URGENTE não fica bloqueada pelo
         * último envio de ATENCAO.
         */
        const alertaExistente =
          await tx.alertaServicoContinuo.findUnique(
            {
              where: {
                servicoContinuoId_nivel: {
                  servicoContinuoId:
                    servico.id,
                  nivel:
                    alerta.nivel,
                },
              },
            }
          );

        /*
         * Primeiro alerta daquele nível.
         *
         * O @@unique([servicoContinuoId, nivel])
         * garante que dois workers não consigam
         * criar o mesmo alerta.
         */
        if (!alertaExistente) {
          try {
            await tx.alertaServicoContinuo.create(
              {
                data: {
                  municipioId:
                    params.municipioId,
                  servicoContinuoId:
                    servico.id,
                  nivel:
                    alerta.nivel,
                  ultimoEnviadoEm:
                    agora,
                },
              }
            );
          } catch (error) {
            if (
              error instanceof
                Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              /*
               * Outro worker ganhou o claim.
               */
              continue;
            }

            throw error;
          }
        } else {
          /*
           * O mesmo nível já foi notificado.
           *
           * Só permite novo envio depois
           * do intervalo mínimo.
           */
          if (
            alertaExistente.ultimoEnviadoEm &&
            alertaExistente.ultimoEnviadoEm >
              limiteReenvio
          ) {
            continue;
          }

          /*
           * CAS:
           *
           * Só actualiza se o timestamp ainda
           * for exactamente o que acabámos
           * de ler.
           */
          const claim =
            await tx.alertaServicoContinuo.updateMany(
              {
                where: {
                  id:
                    alertaExistente.id,
                  ultimoEnviadoEm:
                    alertaExistente.ultimoEnviadoEm,
                },
                data: {
                  ultimoEnviadoEm:
                    agora,
                },
              }
            );

          if (claim.count !== 1) {
            /*
             * Outro worker ganhou o claim.
             */
            continue;
          }
        }

        /*
         * O alerta foi reclamado com sucesso.
         *
         * As notificações são criadas na mesma
         * transação.
         */
        for (const destinatario of destinatarios) {
          await notificarUtilizador(
            tx,
            {
              utilizadorDestinoId:
                destinatario.id,

              titulo:
                `Alerta de serviço contínuo ` +
                `[${alerta.nivel}]: ` +
                `${servico.designacao}`,

              mensagem:
                alerta.mensagem,

              tipo:
                "ACAO_REQUERIDA",

              metadata: {
                servicoContinuoId:
                  servico.id,
                tipo:
                  servico.tipo,
                nivel:
                  alerta.nivel,
              },

              emailDestino:
                destinatario.emailConfirmado
                  ? destinatario.email
                  : null,

              nomeDestino:
                destinatario.nomeCompleto,

              telefoneDestino:
                destinatario.telefone,
            }
          );
        }

        await registarAuditoria(tx, {
          municipioId:
            params.municipioId,
          accao:
            "NOTIFICAR_ALERTA_SERVICO_CONTINUO",
          entidade:
            "AlertaServicoContinuo",
          entidadeId:
            servico.id,
          detalhes: {
            servicoContinuoId:
              servico.id,
            designacao:
              servico.designacao,
            nivel:
              alerta.nivel,
            mensagem:
              alerta.mensagem,
            destinatarios:
              destinatarios.length,
          },
        });

        notificados += 1;
      }

      return {
        notificados,
      };
    }
  );
}