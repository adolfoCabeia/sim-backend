import { withTenantTransaction } from "../../../config/prisma.js";
import { notificarUtilizador } from "../../../core/process-engine/process-engine.notifications.js";
import { FuncionarioNaoEncontradoError } from "../funcionarios/funcionario.service.js";
import type { CriarPedidoFeriasInput, ResponderPedidoFeriasInput, ListarPedidosFeriasQuery } from "./ferias.schema.js";
import {
  DIAS_FERIAS_ANUAIS_PADRAO,
  ANTECEDENCIA_MINIMA_PEDIDO_FERIAS_DIAS,
  MAX_DIAS_FERIAS_POR_PEDIDO,
} from "../rh.constants.js";


export class PedidoFeriasNaoEncontradoError extends Error {}
export class PedidoFeriasEstadoInvalidoError extends Error {}
export class SaldoFeriasInsuficienteError extends Error {}
export class SobreposicaoFeriasError extends Error {}
export class AntecedenciaFeriasInsuficienteError extends Error {}
export class PeriodoForaDoVinculoError extends Error {}
export class PeriodoInvalidoError extends Error {}

function calcularDiasUteis(inicio: Date, fim: Date): number {
  let contagem = 0;
  const cursor = new Date(inicio);
  cursor.setHours(0, 0, 0, 0);
  const limite = new Date(fim);
  limite.setHours(0, 0, 0, 0);

  while (cursor <= limite) {
    const diaDaSemana = cursor.getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) contagem += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return contagem;
}

async function obterSaldoFerias(
  tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0],
  funcionarioId: string,
  ano: number,
  excluirPedidoId?: string
) {
  const inicioAno = new Date(Date.UTC(ano, 0, 1));
  const fimAno = new Date(Date.UTC(ano, 11, 31, 23, 59, 59));

  const aprovados = await tx.pedidoFerias.findMany({
    where: {
      funcionarioId,
      estado: "APROVADO",
      dataInicio: { gte: inicioAno, lte: fimAno },
      ...(excluirPedidoId && { id: { not: excluirPedidoId } }),
    },
    select: { diasUteis: true },
  });

  const diasUsados = aprovados.reduce((soma: number, p: any) => soma + p.diasUteis, 0);
  return { diasDisponiveis: DIAS_FERIAS_ANUAIS_PADRAO, diasUsados, diasRestantes: DIAS_FERIAS_ANUAIS_PADRAO - diasUsados };
}

async function obterFuncionarioDoUtilizadorOuFalhar(
  tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0],
  utilizadorId: string
) {
  const funcionario = await tx.funcionario.findUnique({ where: { utilizadorId } });
  if (!funcionario) {
    throw new FuncionarioNaoEncontradoError("Não existe ficha de funcionário associada a esta conta.");
  }
  return funcionario;
}

/** Valida sobreposição, saldo e limites de vínculo — reutilizado na criação e na (re)validação ao aprovar. */
async function validarPedido(
  tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0],
  params: {
    funcionarioId: string;
    dataInicio: Date;
    dataFim: Date;
    diasUteis: number;
    dataFimVinculo: Date | null;
    excluirPedidoId?: string;
  }
) {
  if (params.dataFimVinculo && params.dataFim > params.dataFimVinculo) {
    throw new PeriodoForaDoVinculoError("O período de férias não pode ultrapassar a data de fim do vínculo.");
  }

  const sobreposicao = await tx.pedidoFerias.findFirst({
    where: {
      funcionarioId: params.funcionarioId,
      estado: { in: ["SOLICITADO", "APROVADO"] },
      dataInicio: { lte: params.dataFim },
      dataFim: { gte: params.dataInicio },
      ...(params.excluirPedidoId && { id: { not: params.excluirPedidoId } }),
    },
  });
  if (sobreposicao) {
    throw new SobreposicaoFeriasError("Já existe um pedido de férias activo que se sobrepõe a este período.");
  }

  const { diasRestantes } = await obterSaldoFerias(tx, params.funcionarioId, params.dataInicio.getFullYear(), params.excluirPedidoId);
  if (params.diasUteis > diasRestantes) {
    throw new SaldoFeriasInsuficienteError(
      `Saldo de férias insuficiente: pede ${params.diasUteis} dia(s), restam ${diasRestantes} para ${params.dataInicio.getFullYear()}.`
    );
  }
}

export async function criarPedidoFerias(params: { municipioId: string; utilizadorId: string; input: CriarPedidoFeriasInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const funcionario = await obterFuncionarioDoUtilizadorOuFalhar(tx, params.utilizadorId);

    const dataInicio = new Date(params.input.dataInicio);
    const dataFim = new Date(params.input.dataFim);
    const minutosAteInicio = (dataInicio.getTime() - Date.now()) / 60_000;
    if (minutosAteInicio < ANTECEDENCIA_MINIMA_PEDIDO_FERIAS_DIAS * 24 * 60) {
      throw new AntecedenciaFeriasInsuficienteError(
        `O pedido tem de ser submetido com pelo menos ${ANTECEDENCIA_MINIMA_PEDIDO_FERIAS_DIAS} dias de antecedência.`
      );
    }

    const diasUteis = calcularDiasUteis(dataInicio, dataFim);
    if (diasUteis < 1) {
      throw new PeriodoInvalidoError("O período de férias tem de incluir pelo menos um dia útil.");
    }
    if (diasUteis > MAX_DIAS_FERIAS_POR_PEDIDO) {
      throw new PeriodoInvalidoError(`Um único pedido não pode exceder ${MAX_DIAS_FERIAS_POR_PEDIDO} dias úteis.`);
    }

    await validarPedido(tx, {
      funcionarioId: funcionario.id,
      dataInicio,
      dataFim,
      diasUteis,
      dataFimVinculo: funcionario.dataFimVinculo,
    });

    return tx.pedidoFerias.create({
      data: {
        municipioId: params.municipioId,
        funcionarioId: funcionario.id,
        dataInicio,
        dataFim,
        diasUteis,
        motivo: params.input.motivo ?? null,
        estado: "SOLICITADO",
      },
    });
  });
}

async function obterPedidoOuFalhar(tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0], id: string) {
  const pedido = await tx.pedidoFerias.findUnique({ where: { id }, include: { funcionario: true } });
  if (!pedido) throw new PedidoFeriasNaoEncontradoError("Pedido de férias não encontrado.");
  return pedido;
}

export async function responderPedidoFerias(params: {
  municipioId: string;
  pedidoId: string;
  aprovadorId: string;
  input: ResponderPedidoFeriasInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const pedido = await obterPedidoOuFalhar(tx, params.pedidoId);
    if (pedido.estado !== "SOLICITADO") {
      throw new PedidoFeriasEstadoInvalidoError(`Só é possível responder a pedidos SOLICITADOS (estado actual: ${pedido.estado}).`);
    }

    if (params.input.aprovar) {
      // Revalidação de segurança: o mundo pode ter mudado desde a submissão.
      await validarPedido(tx, {
        funcionarioId: pedido.funcionarioId,
        dataInicio: pedido.dataInicio,
        dataFim: pedido.dataFim,
        diasUteis: pedido.diasUteis,
        dataFimVinculo: pedido.funcionario.dataFimVinculo,
        excluirPedidoId: pedido.id,
      });
    }

    const atualizado = await tx.pedidoFerias.update({
      where: { id: pedido.id },
      data: {
        estado: params.input.aprovar ? "APROVADO" : "REJEITADO",
        aprovadoPorId: params.aprovadorId,
        motivoRejeicao: params.input.aprovar ? null : (params.input.motivoRejeicao ?? null),
        resolvidoEm: new Date(),
      },
    });

    const utilizador = await tx.utilizador.findUnique({
      where: { id: pedido.funcionario.utilizadorId },
      select: { email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
    });
    if (utilizador) {
      await notificarUtilizador(tx, {
        utilizadorDestinoId: pedido.funcionario.utilizadorId,
        titulo: params.input.aprovar ? "Pedido de férias aprovado" : "Pedido de férias rejeitado",
        mensagem: params.input.aprovar
          ? `As suas férias de ${pedido.dataInicio.toLocaleDateString("pt-AO")} a ${pedido.dataFim.toLocaleDateString("pt-AO")} foram aprovadas.`
          : `O seu pedido de férias foi rejeitado. Motivo: ${params.input.motivoRejeicao}`,
        tipo: "SISTEMA",
        emailDestino: utilizador.emailConfirmado ? utilizador.email : null,
        nomeDestino: utilizador.nomeCompleto,
        telefoneDestino: utilizador.telefone,
        canais: ["APP", "EMAIL"],
      });
    }

    return atualizado;
  });
}

export async function cancelarPedidoFerias(params: { municipioId: string; pedidoId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const pedido = await obterPedidoOuFalhar(tx, params.pedidoId);
    if (pedido.funcionario.utilizadorId !== params.utilizadorId) {
      throw new PedidoFeriasEstadoInvalidoError("Só o próprio funcionário pode cancelar o seu pedido.");
    }
    if (pedido.estado !== "SOLICITADO" && pedido.estado !== "APROVADO") {
      throw new PedidoFeriasEstadoInvalidoError(`Não é possível cancelar um pedido ${pedido.estado}.`);
    }
    if (pedido.estado === "APROVADO" && pedido.dataInicio <= new Date()) {
      throw new PedidoFeriasEstadoInvalidoError("Não é possível cancelar férias que já começaram.");
    }

    return tx.pedidoFerias.update({ where: { id: pedido.id }, data: { estado: "CANCELADO", resolvidoEm: new Date() } });
  });
}

export async function listarMeusPedidosFerias(params: { municipioId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const funcionario = await obterFuncionarioDoUtilizadorOuFalhar(tx, params.utilizadorId);
    const [items, saldo] = await Promise.all([
      tx.pedidoFerias.findMany({ where: { funcionarioId: funcionario.id }, orderBy: { criadoEm: "desc" } }),
      obterSaldoFerias(tx, funcionario.id, new Date().getFullYear()),
    ]);
    return { items, saldo };
  });
}

export async function listarPedidosFerias(params: { municipioId: string; query: ListarPedidosFeriasQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where = {
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
      ...(params.query.funcionarioId !== undefined && { funcionarioId: params.query.funcionarioId }),
      ...(params.query.departamentoId !== undefined && { funcionario: { departamentoId: params.query.departamentoId } }),
    };
    const [items, total] = await Promise.all([
      tx.pedidoFerias.findMany({
        where,
        include: { funcionario: true },
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.pedidoFerias.count({ where }),
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
