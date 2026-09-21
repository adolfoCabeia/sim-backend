import { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { listarUtilizadoresComPermissao } from "../auth/rbac/rbac.service.js";
import type {
  ItemStockCreateInput,
  ItemStockUpdateInput,
  MovimentoStockCreateInput,
} from "./stock.schema.js";

/** Nível mínimo de gravidade a partir do qual se justifica notificar. */
const NIVEIS_NOTIFICAVEIS = new Set(["CRITICO", "MEDIO"]);

/** Ordem de gravidade usada para determinar escalada de alerta. */
const ORDEM_GRAVIDADE: Record<string, number> = {
  NORMAL: 0,
  BAIXO: 1,
  MEDIO: 2,
  CRITICO: 3,
};

/** Não repetir o mesmo nível antes deste intervalo. */
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
    detalhes?: Prisma.InputJsonValue;
  }
) {
  await tx.logAuditoria.create({
    data: {
      municipioId: params.municipioId,
      utilizadorId: params.utilizadorId ?? null,
      accao: params.accao,
      entidade: params.entidade,
      entidadeId: params.entidadeId ?? null,
      ...(params.detalhes !== undefined && { detalhes: params.detalhes }),
    },
  });
}

// ─── ITEM STOCK ──────────────────────────────────────────────────────────────

export async function listarItensStock(
  filtros: {
    municipioId: string;
    categoria?: string | undefined;
    abaixoMinimo?: boolean | undefined;
  },
  paginacao: {
    page: number;
    limit: number;
  }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const where: Prisma.ItemStockWhereInput = {
      ...(filtros.categoria && {
        categoria: filtros.categoria,
      }),
    };

    if (filtros.abaixoMinimo) {
      const todos = await tx.itemStock.findMany({
        where,
        orderBy: {
          designacao: "asc",
        },
        include: {
          movimentos: {
            take: 1,
            orderBy: {
              criadoEm: "desc",
            },
          },
        },
      });

      const filtrados = todos.filter(
        (item) =>
          item.quantidadeActual <= item.pontoReposicao
      );

      const total = filtrados.length;

      const data = filtrados.slice(
        skip,
        skip + paginacao.limit
      );

      return {
        data,
        total,
      };
    }

    const [data, total] = await Promise.all([
      tx.itemStock.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: {
          designacao: "asc",
        },
        include: {
          movimentos: {
            take: 5,
            orderBy: {
              criadoEm: "desc",
            },
          },
        },
      }),

      tx.itemStock.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  });
}

export async function obterItemStock(
  id: string,
  municipioId: string
) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.itemStock.findUnique({
      where: {
        id,
      },
      include: {
        movimentos: {
          orderBy: {
            criadoEm: "desc",
          },
        },
      },
    });
  });
}

export async function criarItemStock(
  municipioId: string,
  dados: ItemStockCreateInput,
  utilizadorId: string
) {
  const pontoReposicao =
    dados.pontoReposicao > 0
      ? dados.pontoReposicao
      : Math.max(
          1,
          Math.ceil(dados.quantidadeMinima * 1.2)
        );

  return withTenantTransaction(municipioId, async (tx) => {
    const item = await tx.itemStock.create({
      data: {
        ...dados,
        municipioId,
        pontoReposicao,
      } as Prisma.ItemStockUncheckedCreateInput,
    });

    await registarAuditoria(tx, {
      municipioId,
      utilizadorId,
      accao: "CRIAR",
      entidade: "ItemStock",
      entidadeId: item.id,
      detalhes: {
        designacao: item.designacao,
        categoria: item.categoria,
        quantidadeInicial: item.quantidadeActual,
        quantidadeMinima: item.quantidadeMinima,
        pontoReposicao: item.pontoReposicao,
      },
    });

    return item;
  });
}

export async function atualizarItemStock(
  id: string,
  municipioId: string,
  dados: ItemStockUpdateInput,
  utilizadorId: string
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const itemAnterior = await tx.itemStock.findUnique({
      where: {
        id,
      },
    });

    if (!itemAnterior) {
      throw new Error("Item de stock não encontrado.");
    }

    const item = await tx.itemStock.update({
      where: {
        id,
      },
      data:
        dados as Prisma.ItemStockUncheckedUpdateInput,
    });

    await registarAuditoria(tx, {
      municipioId,
      utilizadorId,
      accao: "ACTUALIZAR",
      entidade: "ItemStock",
      entidadeId: id,
      detalhes: {
        antes: {
          designacao: itemAnterior.designacao,
          categoria: itemAnterior.categoria,
          quantidadeActual:
            itemAnterior.quantidadeActual,
          quantidadeMinima:
            itemAnterior.quantidadeMinima,
          pontoReposicao:
            itemAnterior.pontoReposicao,
        },

        depois: {
          designacao: item.designacao,
          categoria: item.categoria,
          quantidadeActual:
            item.quantidadeActual,
          quantidadeMinima:
            item.quantidadeMinima,
          pontoReposicao:
            item.pontoReposicao,
        },
      },
    });

    return item;
  });
}

export async function removerItemStock(
  id: string,
  municipioId: string,
  utilizadorId: string
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const item = await tx.itemStock.findUnique({
      where: {
        id,
      },
    });

    if (!item) {
      throw new Error("Item de stock não encontrado.");
    }

    await tx.itemStock.delete({
      where: {
        id,
      },
    });

    await registarAuditoria(tx, {
      municipioId,
      utilizadorId,
      accao: "ELIMINAR",
      entidade: "ItemStock",
      entidadeId: id,
      detalhes: {
        designacao: item.designacao,
        categoria: item.categoria,
        quantidadeActual: item.quantidadeActual,
        quantidadeMinima: item.quantidadeMinima,
        pontoReposicao: item.pontoReposicao,
      },
    });

    return item;
  });
}

// ─── ALERTAS DE REPOSIÇÃO ────────────────────────────────────────────────────

export async function listarAlertasReposicao(
  municipioId: string
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const itens = await tx.itemStock.findMany({
      include: {
        movimentos: {
          orderBy: {
            criadoEm: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        designacao: "asc",
      },
    });

    const alertas = itens
      .map((item) => {
        const diasAteRuptura =
          calcularDiasAteRuptura(item);

        const nivel = determinarNivelAlerta(
          diasAteRuptura,
          item
        );

        /*
         * Alerta activo quando:
         *
         * 1. Atingiu o ponto de reposição; ou
         * 2. A ruptura está estimada para <= 7 dias.
         */
        const atingiuPontoReposicao =
          item.quantidadeActual <=
          item.pontoReposicao;

        const rupturaIminente =
          diasAteRuptura !== null &&
          diasAteRuptura <= 7;

        const necessitaReposicao =
          atingiuPontoReposicao ||
          rupturaIminente;

        return {
          item,
          diasAteRuptura,
          nivel,
          atingiuPontoReposicao,
          rupturaIminente,
          necessitaReposicao,
          mensagem: gerarMensagemAlerta(
            item,
            diasAteRuptura,
            nivel,
            atingiuPontoReposicao
          ),
        };
      })
      .filter(
        (alerta) => alerta.necessitaReposicao
      )
      .sort((a, b) => {
        const ordem: Record<string, number> = {
          CRITICO: 0,
          MEDIO: 1,
          BAIXO: 2,
          NORMAL: 3,
        };

        return (
          (ordem[a.nivel] ?? 3) -
          (ordem[b.nivel] ?? 3)
        );
      });

    return alertas;
  });
}

function calcularDiasAteRuptura(item: {
  cicloReposicaoMeses: number | null;
  quantidadeActual: number;
  movimentos: Array<{
    criadoEm: Date;
  }>;
}): number | null {
  if (
    !item.cicloReposicaoMeses ||
    item.quantidadeActual <= 0
  ) {
    return null;
  }

  const ultimoMovimento = item.movimentos[0];

  if (!ultimoMovimento) {
    return null;
  }

  const diasCiclo =
    item.cicloReposicaoMeses * 30;

  const diasDecorridos = Math.floor(
    (new Date().getTime() -
      ultimoMovimento.criadoEm.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const diasRestantes =
    diasCiclo - diasDecorridos;

  return Math.max(0, diasRestantes);
}

function determinarNivelAlerta(
  dias: number | null,
  item: {
    quantidadeActual: number;
    quantidadeMinima: number;
    pontoReposicao: number;
  }
): "CRITICO" | "MEDIO" | "BAIXO" | "NORMAL" {
  if (item.quantidadeActual <= 0) {
    return "CRITICO";
  }

  if (dias === null) {
    if (
      item.quantidadeActual <=
      item.quantidadeMinima
    ) {
      return "CRITICO";
    }

    if (
      item.quantidadeActual <=
      item.pontoReposicao
    ) {
      return "MEDIO";
    }

    return "NORMAL";
  }

  if (dias <= 3) {
    return "CRITICO";
  }

  if (dias <= 7) {
    return "MEDIO";
  }

  if (dias <= 15) {
    return "BAIXO";
  }

  return "NORMAL";
}

function gerarMensagemAlerta(
  item: {
    designacao: string;
    quantidadeActual: number;
    unidadeMedida: string;
  },
  dias: number | null,
  nivel: string,
  atingiuPonto: boolean
): string {
  if (item.quantidadeActual <= 0) {
    return (
      `RUTURA CONSUMADA: ${item.designacao} ` +
      `está com stock ZERO. Reposição imediata obrigatória.`
    );
  }

  if (atingiuPonto) {
    return (
      `PONTO DE REPOSIÇÃO ATINGIDO: ${item.designacao} ` +
      `(${item.quantidadeActual} ${item.unidadeMedida}). ` +
      `${
        dias !== null
          ? `Ruptura estimada em ${dias} dias.`
          : ""
      }`
    );
  }

  if (dias !== null && dias <= 7) {
    return (
      `RUTURA IMINENTE: ${item.designacao} ` +
      `esgota-se em ${dias} dias. ` +
      `Tempo mínimo de reação (7 dias) comprometido.`
    );
  }

  return `Alerta ${nivel}: ${item.designacao}`;
}

// ─── MOVIMENTO DE STOCK ──────────────────────────────────────────────────────

export async function criarMovimentoStock(
  municipioId: string,
  dados: MovimentoStockCreateInput & {
    utilizadorId: string;
  }
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const item = await tx.itemStock.findUnique({
      where: {
        id: dados.itemStockId,
      },
    });

    if (!item) {
      throw new Error("Item de stock não encontrado.");
    }

    let quantidadePosterior: number;

    if (
      dados.tipo === "ENTRADA" ||
      dados.tipo === "AJUSTE"
    ) {
      quantidadePosterior =
        item.quantidadeActual +
        dados.quantidade;
    } else if (dados.tipo === "SAIDA") {
      if (
        item.quantidadeActual <
        dados.quantidade
      ) {
        throw new Error(
          `SAÍDA BLOQUEADA: Quantidade solicitada ` +
            `(${dados.quantidade}) excede stock actual ` +
            `(${item.quantidadeActual}). ` +
            `Não é permitido criar ruptura de stock.`
        );
      }

      quantidadePosterior =
        item.quantidadeActual -
        dados.quantidade;

      if (
        quantidadePosterior <
        item.quantidadeMinima
      ) {
        throw new Error(
          `SAÍDA BLOQUEADA: Saldo após saída ` +
            `(${quantidadePosterior}) ficaria abaixo ` +
            `do mínimo operacional ` +
            `(${item.quantidadeMinima}). ` +
            `Reposição obrigatória antes de nova saída.`
        );
      }
    } else {
      throw new Error(
        `Tipo de movimento inválido: ${dados.tipo}`
      );
    }

    /*
     * CAS — Compare And Swap.
     *
     * Só actualiza o saldo se ele ainda for igual
     * ao valor que acabámos de ler.
     *
     * Isto impede duas saídas concorrentes de
     * sobrescreverem o saldo uma da outra.
     */
    const actualizacao =
      await tx.itemStock.updateMany({
        where: {
          id: dados.itemStockId,
          quantidadeActual:
            item.quantidadeActual,
        },
        data: {
          quantidadeActual:
            quantidadePosterior,
        },
      });

    if (actualizacao.count !== 1) {
      throw new Error(
        "O stock foi alterado por outro movimento entretanto. " +
          "Actualize os dados e tente novamente."
      );
    }

    const movimento =
      await tx.movimentoStock.create({
        data: {
          itemStockId:
            dados.itemStockId,
          tipo: dados.tipo,
          quantidade: dados.quantidade,
          quantidadeAnterior:
            item.quantidadeActual,
          quantidadePosterior,
          motivo: dados.motivo,
          documentoRef:
            dados.documentoRef ?? null,
          utilizadorId:
            dados.utilizadorId,
        },
      });

    await registarAuditoria(tx, {
      municipioId,
      utilizadorId: dados.utilizadorId,
      accao: "CRIAR_MOVIMENTO",
      entidade: "MovimentoStock",
      entidadeId: movimento.id,
      detalhes: {
        itemStockId: item.id,
        designacao: item.designacao,
        tipo: dados.tipo,
        quantidade: dados.quantidade,
        quantidadeAnterior:
          item.quantidadeActual,
        quantidadePosterior,
        motivo: dados.motivo ?? null,
        documentoRef:
          dados.documentoRef ?? null,
      },
    });

    if (
      quantidadePosterior <=
        item.pontoReposicao &&
      dados.tipo === "SAIDA"
    ) {
      console.warn(
        `[ALERTA PREVENTIVO] Item ${item.designacao} ` +
          `atingiu ponto de reposição após saída. ` +
          `Stock: ${quantidadePosterior}`
      );
    }

    return movimento;
  });
}

// ─── LISTAGEM DE MOVIMENTOS ──────────────────────────────────────────────────

export async function listarMovimentosStock(
  filtros: {
    municipioId: string;
    itemStockId?: string | undefined;
    tipo?:
      | Prisma.EnumTipoMovimentoStockFilter<"MovimentoStock">
      | "ENTRADA"
      | "SAIDA"
      | "AJUSTE"
      | undefined;
    desde?: Date | undefined;
    ate?: Date | undefined;
  },
  paginacao: {
    page: number;
    limit: number;
  }
) {
  return withTenantTransaction(
    filtros.municipioId,
    async (tx) => {
      const where: Prisma.MovimentoStockWhereInput =
        {
          ...(filtros.itemStockId && {
            itemStockId:
              filtros.itemStockId,
          }),

          ...(filtros.tipo && {
            tipo: filtros.tipo as
              | "ENTRADA"
              | "SAIDA"
              | "AJUSTE",
          }),
        };

      if (
        filtros.desde ||
        filtros.ate
      ) {
        where.criadoEm = {
          ...(filtros.desde && {
            gte: filtros.desde,
          }),
          ...(filtros.ate && {
            lte: filtros.ate,
          }),
        };
      }

      const skip =
        (paginacao.page - 1) *
        paginacao.limit;

      const [data, total] =
        await Promise.all([
          tx.movimentoStock.findMany({
            where,
            skip,
            take: paginacao.limit,
            orderBy: {
              criadoEm: "desc",
            },
            include: {
              itemStock: true,
            },
          }),

          tx.movimentoStock.count({
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

// ─── NOTIFICAÇÃO PROACTIVA DE ALERTAS ────────────────────────────────────────

export async function notificarAlertasReposicaoPendentes(
  params: {
    municipioId: string;
  }
): Promise<{ notificados: number }> {
  const alertas =
    await listarAlertasReposicao(
      params.municipioId
    );

  const relevantes = alertas.filter(
    (alerta) =>
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
          "stock:gerir"
        );

      if (destinatarios.length === 0) {
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
        const item = alerta.item;

        /*
         * Existe uma linha independente para cada:
         *
         * itemStock + nível
         *
         * Exemplo:
         *
         * ITEM-1 + MEDIO
         * ITEM-1 + CRITICO
         *
         * Assim, quando o alerta sobe de MEDIO
         * para CRITICO, o nível CRITICO pode ser
         * notificado imediatamente.
         */
        const alertaExistente =
          await tx.alertaStock.findUnique({
            where: {
              itemStockId_nivel: {
                itemStockId: item.id,
                nivel: alerta.nivel,
              },
            },
          });

        /*
         * Primeiro alerta daquele nível.
         *
         * Criar a linha funciona como "claim":
         * apenas um worker conseguirá criar devido
         * ao @@unique([itemStockId, nivel]).
         */
        if (!alertaExistente) {
          try {
            await tx.alertaStock.create({
              data: {
                municipioId:
                  params.municipioId,
                itemStockId: item.id,
                nivel: alerta.nivel,
                ultimoEnviadoEm: agora,
              },
            });
          } catch (error) {
            /*
             * Outro worker criou o alerta
             * simultaneamente.
             *
             * Não notificamos novamente.
             */
            if (
              error instanceof
                Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              continue;
            }

            throw error;
          }
        } else {
          /*
           * Já existe alerta deste nível.
           * Só podemos reenviar depois do intervalo.
           *
           * O updateMany funciona como CAS:
           * se outro worker actualizou a linha
           * primeiro, count será 0.
           */
          if (
            alertaExistente.ultimoEnviadoEm &&
            alertaExistente.ultimoEnviadoEm >
              limiteReenvio
          ) {
            continue;
          }

          const claim =
            await tx.alertaStock.updateMany({
              where: {
                id: alertaExistente.id,
                ultimoEnviadoEm:
                  alertaExistente.ultimoEnviadoEm,
              },
              data: {
                ultimoEnviadoEm: agora,
              },
            });

          if (claim.count !== 1) {
            continue;
          }
        }

        /*
         * O alerta já foi reclamado atomicamente.
         *
         * As notificações são criadas dentro da
         * mesma transação. Se uma falhar, a
         * transação inteira é revertida.
         */
        for (const destinatario of destinatarios) {
          await notificarUtilizador(tx, {
            utilizadorDestinoId:
              destinatario.id,
            titulo:
              `Alerta de stock [${alerta.nivel}]: ${item.designacao}`,
            mensagem: alerta.mensagem,
            tipo: "ACAO_REQUERIDA",
            metadata: {
              itemStockId: item.id,
              nivel: alerta.nivel,
            },
            emailDestino:
              destinatario.emailConfirmado
                ? destinatario.email
                : null,
            nomeDestino:
              destinatario.nomeCompleto,
            telefoneDestino:
              destinatario.telefone,
          });
        }

        await registarAuditoria(tx, {
          municipioId:
            params.municipioId,
          accao: "NOTIFICAR_ALERTA_STOCK",
          entidade: "AlertaStock",
          entidadeId: item.id,
          detalhes: {
            itemStockId: item.id,
            designacao:
              item.designacao,
            nivel: alerta.nivel,
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