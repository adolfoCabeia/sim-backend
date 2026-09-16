import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/process-engine/process-engine.notifications.js";
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


async function dispararNotificacao(
  municipioId: string,
  contexto: string,
  fn: (tx: Prisma.TransactionClient) => Promise<void>
): Promise<void> {
  try {
    await withTenantTransaction(municipioId, fn);
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
    const pagamento = await obterPagamentoOuFalhar(tx, params.pagamentoId);
    if (pagamento.estado !== "PENDENTE") {
      throw new PagamentoJaProcessadoError(
        `Este pagamento já está com o estado "${pagamento.estado}" — só é possível confirmar pagamentos PENDENTES.`
      );
    }

    // 1. Atualizar pagamento
    const actualizado = await tx.pagamento.update({
      where: { id: pagamento.id },
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

    // 2. Atualizar processo
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
      await notificarUtilizador(tx, {
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
    const pagamento = await obterPagamentoOuFalhar(tx, params.pagamentoId);
    if (pagamento.estado !== "PENDENTE") {
      throw new PagamentoJaProcessadoError("Só é possível ajustar o valor de um pagamento ainda PENDENTE.");
    }

    const actualizado = await tx.pagamento.update({
      where: { id: pagamento.id },
      data: { valor: params.input.valor },
    });

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
    const pagamento = await obterPagamentoOuFalhar(tx, params.pagamentoId);
    if (pagamento.estado !== "PENDENTE") {
      throw new PagamentoJaProcessadoError("Só é possível cancelar um pagamento ainda PENDENTE.");
    }

    const cancelado = await tx.pagamento.update({
      where: { id: pagamento.id },
      data: { estado: "CANCELADO" },
    });

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

export async function marcarPagamentosExpirados(params: { municipioId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const resultado = await tx.pagamento.updateMany({
      where: { estado: "PENDENTE", expiraEm: { lt: new Date() } },
      data: { estado: "EXPIRADO" },
    });
    return { actualizados: resultado.count };
  });
}