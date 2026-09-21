import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/process-engine/process-engine.notifications.js";
import { dispararEnviosPendentes, type EnviosPendentes } from "../../core/notifications/notification.service.js";
import type {
  ConfirmarPagamentoInput,
  CancelarPagamentoInput,
  AjustarValorPagamentoInput,
  ListarPagamentosQuery,
} from "./pagamento.schema.js";


export class PagamentoNaoEncontradoError extends Error {}
export class PagamentoJaProcessadoError extends Error {}
export class PagamentoNaoAutorizadoError extends Error {}
export class PagamentoExpiradoError extends Error {}

/*
 * Mesmo padrão do process-engine: a transacção só faz a escrita "APP" da
 * notificação e devolve os `EnviosPendentes`; o envio real de email/SMS
 * acontece depois do commit, fora de qualquer transacção.
 */
async function dispararNotificacao(
  municipioId: string,
  contexto: string,
  fn: (tx: Prisma.TransactionClient) => Promise<EnviosPendentes | EnviosPendentes[] | void>
): Promise<void> {
  try {
    const resultado = await withTenantTransaction(municipioId, fn);
    if (!resultado) return;
    const lista = Array.isArray(resultado) ? resultado : [resultado];
    await dispararEnviosPendentes(contexto, ...lista);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[notificacao] Falha ao notificar (${contexto}):`, err);
  }
}

async function obterPagamentoOuFalhar(tx: Prisma.TransactionClient, pagamentoId: string) {
  const pagamento = await tx.pagamento.findUnique({ where: { id: pagamentoId } });
  if (!pagamento) {
    throw new PagamentoNaoEncontradoError("Pagamento não encontrado.");
  }
  return pagamento;
}

/**
 * Bloqueia a linha do processo até ao fim da transacção. É o MESMO lock usado pelo
 * process-engine (`transicionar`, etc.), por isso confirmar/cancelar um pagamento e
 * transicionar o processo ficam serializados entre si (sem corrida sobre `aguardaPagamento`).
 *
 * Implementado com um UPDATE do Prisma (não depende do nome da tabela nem do tipo do id).
 */
async function bloquearProcesso(tx: Prisma.TransactionClient, processoId: string): Promise<void> {
  try {
    await tx.processoGenerico.update({
      where: { id: processoId },
      data: { alteradoEm: new Date() },
      select: { id: true },
    });
  } catch (err) {
    if ((err as { code?: string } | null)?.code === "P2025") {
      throw new PagamentoNaoEncontradoError("Processo do pagamento não encontrado.");
    }
    throw err;
  }
}

/**
 * Obtém o pagamento para o alterar, com a ordem de locks fixa: PROCESSO primeiro.
 *  1. lê o pagamento só para saber o processoId (imutável);
 *  2. bloqueia o processo;
 *  3. relê o pagamento já com o lock, para ver o estado mais recente.
 * Todas as operações que alteram pagamentos passam por aqui, por isso serializam
 * por processo e não há risco de deadlock (o process-engine só bloqueia o processo).
 */
async function obterPagamentoParaEscrita(tx: Prisma.TransactionClient, pagamentoId: string) {
  const previo = await obterPagamentoOuFalhar(tx, pagamentoId);
  await bloquearProcesso(tx, previo.processoId);
  return obterPagamentoOuFalhar(tx, pagamentoId);
}

export async function listarPagamentosDoProcesso(params: {
  municipioId: string;
  processoId: string;
  utilizadorSolicitanteId?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    if (params.utilizadorSolicitanteId) {
      const processo = await tx.processoGenerico.findUnique({
        where: { id: params.processoId },
        select: { requerenteUtilizadorId: true },
      });
      if (!processo || processo.requerenteUtilizadorId !== params.utilizadorSolicitanteId) {
        return [];
      }
    }
    return tx.pagamento.findMany({
      where: { processoId: params.processoId },
      orderBy: { criadoEm: "desc" },
    });
  });
}

export async function listarMeusPagamentos(params: {
  municipioId: string;
  utilizadorId: string;
  query: ListarPagamentosQuery;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.PagamentoWhereInput = {
      processo: { requerenteUtilizadorId: params.utilizadorId },
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
    };
    const [items, total] = await Promise.all([
      tx.pagamento.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        include: { processo: { select: { id: true, numero: true, tipo: true, assunto: true } } },
      }),
      tx.pagamento.count({ where }),
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

export async function listarPagamentos(params: { municipioId: string; query: ListarPagamentosQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.PagamentoWhereInput = {
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
    };
    const [items, total] = await Promise.all([
      tx.pagamento.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        include: {
          processo: { select: { id: true, numero: true, tipo: true, assunto: true } },
        },
      }),
      tx.pagamento.count({ where }),
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

export async function confirmarPagamento(params: {
  municipioId: string;
  pagamentoId: string;
  executorId: string;
  input: ConfirmarPagamentoInput;
}) {
  // 1) Transação: só leituras/escritas de negócio. Nada de rede aqui.
  const { actualizado, requerenteParaNotificar } = await withTenantTransaction(params.municipioId, async (tx) => {
    // Lock do processo + leitura fresca do pagamento.
    const pagamento = await obterPagamentoParaEscrita(tx, params.pagamentoId);
    if (pagamento.estado !== "PENDENTE") {
      throw new PagamentoJaProcessadoError(
        `Este pagamento já está com o estado "${pagamento.estado}" — só é possível confirmar pagamentos PENDENTES.`
      );
    }

    // 1. Atualizar pagamento (compare-and-set: só actualiza se ainda estiver PENDENTE).
    // Protege também contra o job de expiração, que altera pagamentos sem passar pelo lock do processo.
    const resultado = await tx.pagamento.updateMany({
      where: { id: pagamento.id, estado: "PENDENTE" },
      data: {
        estado: "PAGO",
        pagoEm: new Date(),
        criadoPorId: pagamento.criadoPorId ?? params.executorId,
        metadadosConfirmacao: {
          confirmadoPorId: params.executorId,
          ...(params.input.meioPagamento !== undefined && { meioPagamento: params.input.meioPagamento }),
          ...(params.input.observacao !== undefined && { observacao: params.input.observacao }),
          ...(params.input.metadados ?? {}),
        } as Prisma.InputJsonValue,
      },
    });
    if (resultado.count === 0) {
      throw new PagamentoJaProcessadoError(
        "Este pagamento deixou de estar PENDENTE (foi cancelado, expirou ou já foi confirmado)."
      );
    }
    const actualizado = await tx.pagamento.findUniqueOrThrow({ where: { id: pagamento.id } });

    // 2. Atualizar processo (linha já bloqueada por esta transacção)
    const processo = await tx.processoGenerico.update({
      where: { id: pagamento.processoId },
      data: { aguardaPagamento: false },
      select: { id: true, numero: true, requerenteUtilizadorId: true, estado: true },
    });

    // 3. Criar transição
    await tx.processoGenericoTransicao.create({
      data: {
        processoId: processo.id,
        estadoAnterior: processo.estado,
        estadoNovo: processo.estado,
        utilizadorId: params.executorId,
        observacao: `Pagamento da referência ${pagamento.referencia} confirmado (${actualizado.valor.toString()} Kz). O processo já pode avançar.`,
        visivelAoCidadao: true,
      },
    });

    // 4. Log auditoria
    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.executorId,
        accao: "PAGAMENTO_CONFIRMADO",
        entidade: "Pagamento",
        entidadeId: pagamento.id,
        detalhes: { processoId: processo.id, referencia: pagamento.referencia, valor: actualizado.valor.toString() },
      },
    });

    let requerenteParaNotificar: {
      utilizadorDestinoId: string;
      email: string | null;
      emailConfirmado: boolean;
      nomeCompleto: string | null;
      telefone: string | null;
    } | null = null;

    if (processo.requerenteUtilizadorId) {
      const requerente = await tx.utilizador.findUnique({
        where: { id: processo.requerenteUtilizadorId },
        select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
      });
      if (requerente) {
        requerenteParaNotificar = {
          utilizadorDestinoId: processo.requerenteUtilizadorId,
          email: requerente.email,
          emailConfirmado: requerente.emailConfirmado,
          nomeCompleto: requerente.nomeCompleto,
          telefone: requerente.telefone,
        };
      }
    }

    return {
      actualizado,
      requerenteParaNotificar: requerenteParaNotificar
        ? { ...requerenteParaNotificar, numeroProcesso: processo.numero, processoId: processo.id, referencia: pagamento.referencia }
        : null,
    };
  });

  // 2) Notificação: fora da transação de escrita, só depois do commit.
  if (requerenteParaNotificar) {
    await dispararNotificacao(params.municipioId, `confirmarPagamento:${params.pagamentoId}`, async (tx) => {
      return notificarUtilizador(tx, {
        utilizadorDestinoId: requerenteParaNotificar.utilizadorDestinoId,
        titulo: `Pagamento confirmado, Processo ${requerenteParaNotificar.numeroProcesso}`,
        mensagem: `Recebemos o seu pagamento da referência ${requerenteParaNotificar.referencia}. O seu processo ${requerenteParaNotificar.numeroProcesso} já está a ser tratado.`,
        tipo: "PROCESSO_ATUALIZADO",
        metadata: { processoId: requerenteParaNotificar.processoId, numeroProcesso: requerenteParaNotificar.numeroProcesso },
        emailDestino: requerenteParaNotificar.emailConfirmado ? requerenteParaNotificar.email : null,
        nomeDestino: requerenteParaNotificar.nomeCompleto,
        telefoneDestino: requerenteParaNotificar.telefone,
      });
    });
  }

  return actualizado;
}

export async function ajustarValorPagamento(params: {
  municipioId: string;
  pagamentoId: string;
  executorId: string;
  input: AjustarValorPagamentoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const pagamento = await obterPagamentoParaEscrita(tx, params.pagamentoId);
    if (pagamento.estado !== "PENDENTE") {
      throw new PagamentoJaProcessadoError("Só é possível ajustar o valor de um pagamento ainda PENDENTE.");
    }

    const resultado = await tx.pagamento.updateMany({
      where: { id: pagamento.id, estado: "PENDENTE" },
      data: { valor: params.input.valor },
    });
    if (resultado.count === 0) {
      throw new PagamentoJaProcessadoError("Só é possível ajustar o valor de um pagamento ainda PENDENTE.");
    }
    const actualizado = await tx.pagamento.findUniqueOrThrow({ where: { id: pagamento.id } });

    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.executorId,
        accao: "PAGAMENTO_VALOR_AJUSTADO",
        entidade: "Pagamento",
        entidadeId: pagamento.id,
        detalhes: { valorAnterior: pagamento.valor.toString(), valorNovo: params.input.valor, motivo: params.input.motivo },
      },
    });

    return actualizado;
  });
}

export async function cancelarPagamento(params: {
  municipioId: string;
  pagamentoId: string;
  executorId: string;
  input: CancelarPagamentoInput;
}) {
  const { criarPagamentoParaProcessoTx } = await import("./pagamento.internal.js");

  return withTenantTransaction(params.municipioId, async (tx) => {
    // O lock do processo serializa cancelamentos concorrentes: sem ele, dois
    // cancelamentos simultâneos criavam dois pagamentos de substituição.
    const pagamento = await obterPagamentoParaEscrita(tx, params.pagamentoId);
    if (pagamento.estado !== "PENDENTE") {
      throw new PagamentoJaProcessadoError("Só é possível cancelar um pagamento ainda PENDENTE.");
    }

    const resultado = await tx.pagamento.updateMany({
      where: { id: pagamento.id, estado: "PENDENTE" },
      data: { estado: "CANCELADO" },
    });
    if (resultado.count === 0) {
      throw new PagamentoJaProcessadoError("Só é possível cancelar um pagamento ainda PENDENTE.");
    }
    const cancelado = await tx.pagamento.findUniqueOrThrow({ where: { id: pagamento.id } });

    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.executorId,
        accao: "PAGAMENTO_CANCELADO",
        entidade: "Pagamento",
        entidadeId: pagamento.id,
        detalhes: { motivo: params.input.motivo },
      },
    });

    await criarPagamentoParaProcessoTx(tx, {
      municipioId: params.municipioId,
      processoId: pagamento.processoId,
      valorReferenciaKz: Number(pagamento.valor),
      criadoPorId: params.executorId,
    });

    return cancelado;
  });
}

export async function obterResumoPagamentos(params: { municipioId: string; utilizadorId: string; tipoConta: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.PagamentoWhereInput = {
      ...(params.tipoConta !== "INTERNO" && { processo: { requerenteUtilizadorId: params.utilizadorId } }),
    };
    const grupos = await tx.pagamento.groupBy({ by: ["estado"], where, _count: { _all: true } });
    const porEstado = Object.fromEntries(grupos.map((g) => [g.estado, g._count._all]));
    const total = grupos.reduce((soma, g) => soma + g._count._all, 0);
    return { porEstado, total };
  });
}

/**
 * Job de expiração. O `updateMany` com filtro `estado: "PENDENTE"` é atómico por linha:
 * se uma confirmação fizer commit entretanto, essa linha deixa de corresponder ao filtro
 * e não é expirada. A confirmação, por sua vez, usa compare-and-set, por isso os dois
 * lados nunca sobrescrevem o resultado um do outro.
 */
export async function marcarPagamentosExpirados(params: { municipioId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const resultado = await tx.pagamento.updateMany({
      where: { estado: "PENDENTE", expiraEm: { lt: new Date() } },
      data: { estado: "EXPIRADO" },
    });
    return { actualizados: resultado.count };
  });
}