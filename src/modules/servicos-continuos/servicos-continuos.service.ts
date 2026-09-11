import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { listarUtilizadoresComPermissao } from "../auth/rbac/rbac.service.js";
import type {
  ServicoContinuoCreateInput,
  ServicoContinuoUpdateInput,
  RecargaInput,
} from "./servicos-continuos.schema.js";

const NIVEIS_NOTIFICAVEIS = new Set(["URGENTE", "ATENCAO"]);
const ORDEM_GRAVIDADE: Record<string, number> = { INFO: 0, ATENCAO: 1, URGENTE: 2 };
const INTERVALO_MINIMO_REENVIO_HORAS = 24;

export async function obter(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.servicoContinuo.findUnique({ where: { id } });
  });
}

export async function listar(
  filtros: { municipioId: string; tipo?: string | undefined; estado?: string | undefined; proximoVencimento?: boolean | undefined },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.ServicoContinuoWhereInput = {
    ...(filtros.tipo && { tipo: filtros.tipo as Prisma.EnumTipoServicoContinuoFilter<"ServicoContinuo"> }),
    ...(filtros.estado && { estado: filtros.estado as Prisma.EnumEstadoServicoContinuoFilter<"ServicoContinuo"> }),
  };

  if (filtros.proximoVencimento) {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() + 30);
    where.dataPrevistaEsgotamento = { lte: limite, gte: hoje };
  }

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.servicoContinuo.findMany({ where, skip, take: paginacao.limit, orderBy: { designacao: "asc" } }),
      tx.servicoContinuo.count({ where }),
    ]);
    return { data, total };
  });
}

export async function criar(municipioId: string, dados: ServicoContinuoCreateInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const payload: Prisma.ServicoContinuoUncheckedCreateInput = {
      municipioId,
      tipo: dados.tipo,
      designacao: dados.designacao,
      estado: dados.estado,
      alertaDiasAntes: dados.alertaDiasAntes,
      ...(dados.fornecedor !== undefined && dados.fornecedor !== null && { fornecedor: dados.fornecedor }),
      ...(dados.numeroContrato !== undefined && dados.numeroContrato !== null && { numeroContrato: dados.numeroContrato }),
      ...(dados.dataUltimoCarregamento !== undefined && dados.dataUltimoCarregamento !== null && { dataUltimoCarregamento: new Date(dados.dataUltimoCarregamento) }),
      ...(dados.valorUltimoCarregamento !== undefined && dados.valorUltimoCarregamento !== null && { valorUltimoCarregamento: dados.valorUltimoCarregamento }),
      ...(dados.consumoEstimadoDias !== undefined && dados.consumoEstimadoDias !== null && { consumoEstimadoDias: dados.consumoEstimadoDias }),
      ...(dados.dataPrevistaEsgotamento !== undefined && dados.dataPrevistaEsgotamento !== null && { dataPrevistaEsgotamento: new Date(dados.dataPrevistaEsgotamento) }),
      ...(dados.dataProximoCarregamento !== undefined && dados.dataProximoCarregamento !== null && { dataProximoCarregamento: new Date(dados.dataProximoCarregamento) }),
    };
    return tx.servicoContinuo.create({ data: payload });
  });
}

export async function atualizar(id: string, municipioId: string, dados: ServicoContinuoUpdateInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.servicoContinuo.findUniqueOrThrow({ where: { id } });

    const payload: Prisma.ServicoContinuoUncheckedUpdateInput = {
      ...(dados.tipo !== undefined && { tipo: dados.tipo }),
      ...(dados.designacao !== undefined && { designacao: dados.designacao }),
      ...(dados.estado !== undefined && { estado: dados.estado }),
      ...(dados.alertaDiasAntes !== undefined && { alertaDiasAntes: dados.alertaDiasAntes }),
      ...(dados.fornecedor !== undefined && dados.fornecedor !== null && { fornecedor: dados.fornecedor }),
      ...(dados.numeroContrato !== undefined && dados.numeroContrato !== null && { numeroContrato: dados.numeroContrato }),
      ...(dados.dataUltimoCarregamento !== undefined && dados.dataUltimoCarregamento !== null && { dataUltimoCarregamento: new Date(dados.dataUltimoCarregamento) }),
      ...(dados.valorUltimoCarregamento !== undefined && dados.valorUltimoCarregamento !== null && { valorUltimoCarregamento: dados.valorUltimoCarregamento }),
      ...(dados.consumoEstimadoDias !== undefined && dados.consumoEstimadoDias !== null && { consumoEstimadoDias: dados.consumoEstimadoDias }),
      ...(dados.dataPrevistaEsgotamento !== undefined && dados.dataPrevistaEsgotamento !== null && { dataPrevistaEsgotamento: new Date(dados.dataPrevistaEsgotamento) }),
      ...(dados.dataProximoCarregamento !== undefined && dados.dataProximoCarregamento !== null && { dataProximoCarregamento: new Date(dados.dataProximoCarregamento) }),
    };
    return tx.servicoContinuo.update({ where: { id }, data: payload });
  });
}

export async function remover(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.servicoContinuo.findUniqueOrThrow({ where: { id } });
    return tx.servicoContinuo.delete({ where: { id } });
  });
}

export async function registrarRecarga(id: string, municipioId: string, dados: RecargaInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const servico = await tx.servicoContinuo.findUniqueOrThrow({ where: { id } });

    const dataCarregamento = new Date(dados.dataCarregamento);
    const consumoDias = dados.consumoEstimadoDias ?? servico.consumoEstimadoDias ?? 30;
    const alertaDias = Math.max(7, dados.alertaDiasAntes ?? servico.alertaDiasAntes ?? 7);

    const dataPrevistaEsgotamento = new Date(dataCarregamento);
    dataPrevistaEsgotamento.setDate(dataPrevistaEsgotamento.getDate() + consumoDias);

    const dataProximoCarregamento = new Date(dataPrevistaEsgotamento);
    dataProximoCarregamento.setDate(dataProximoCarregamento.getDate() - alertaDias);

    return tx.servicoContinuo.update({
      where: { id },
      data: {
        dataUltimoCarregamento: dataCarregamento,
        valorUltimoCarregamento: dados.valor,
        consumoEstimadoDias: consumoDias,
        dataPrevistaEsgotamento,
        dataProximoCarregamento,
        alertaDiasAntes: alertaDias,
        estado: "ACTIVO",
      },
    });
  });
}

export async function listarAlertas(municipioId: string) {
  const hoje = new Date();
  const daqui15Dias = new Date(hoje);
  daqui15Dias.setDate(hoje.getDate() + 15);
  const daqui7Dias = new Date(hoje);
  daqui7Dias.setDate(hoje.getDate() + 7);

  const where: Prisma.ServicoContinuoWhereInput = {
    estado: "ACTIVO",
    OR: [
      { dataProximoCarregamento: { lte: daqui15Dias, gte: hoje } },
      { dataPrevistaEsgotamento: { lte: daqui7Dias, gte: hoje } },
    ],
  };

  return withTenantTransaction(municipioId, async (tx) => {
    const servicos = await tx.servicoContinuo.findMany({
      where,
      orderBy: { dataPrevistaEsgotamento: "asc" },
    });

    return servicos.map((s) => {
      const diasAteEsgotamento = s.dataPrevistaEsgotamento
        ? Math.ceil((s.dataPrevistaEsgotamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const diasAteAlerta = s.dataProximoCarregamento
        ? Math.ceil((s.dataProximoCarregamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let nivel: "INFO" | "ATENCAO" | "URGENTE" = "INFO";
      let acaoRecomendada = "";

      if (diasAteEsgotamento !== null) {
        if (diasAteEsgotamento <= 7) {
          nivel = "URGENTE";
          acaoRecomendada = `Carregamento deve ser executado em até ${diasAteEsgotamento} dias. Tempo mínimo de reação comprometido.`;
        } else if (diasAteEsgotamento <= 15) {
          nivel = "ATENCAO";
          acaoRecomendada = `Iniciar processo de carregamento. Esgotamento previsto em ${diasAteEsgotamento} dias.`;
        } else if (diasAteAlerta !== null && diasAteAlerta <= 15) {
          nivel = "ATENCAO";
          acaoRecomendada = `Período de alerta iniciado. Próximo carregamento recomendado em ${diasAteAlerta} dias.`;
        }
      }

      return {
        servico: s,
        diasAteEsgotamento,
        diasAteAlerta,
        nivel,
        acaoRecomendada,
        mensagem: `[${nivel}] ${s.designacao} (${s.tipo}): ${acaoRecomendada}`,
      };
    });
  });
}

// ─── NOTIFICAÇÃO PROACTIVA DE ALERTAS ───
// PRINCÍPIO: "Não esperar que o serviço termine para reagir" (secção 8.3.3).
// ServicoContinuo não tem responsável próprio — notifica-se quem tiver a
// permissão "servicos-continuos:gerir" no município.
export async function notificarAlertasServicosContinuosPendentes(params: {
  municipioId: string;
}): Promise<{ notificados: number }> {
  const alertas = await listarAlertas(params.municipioId);
  const relevantes = alertas.filter((a) => NIVEIS_NOTIFICAVEIS.has(a.nivel));
  if (relevantes.length === 0) return { notificados: 0 };

  return withTenantTransaction(params.municipioId, async (tx) => {
    const destinatarios = await listarUtilizadoresComPermissao(tx, "servicos-continuos:gerir");
    if (destinatarios.length === 0) return { notificados: 0 };

    let notificados = 0;
    const agora = new Date();

    for (const alerta of relevantes) {
      const s = alerta.servico;
      const jaNotificadoRecentemente =
        s.ultimoAlertaEnviadoEm &&
        agora.getTime() - new Date(s.ultimoAlertaEnviadoEm).getTime() < INTERVALO_MINIMO_REENVIO_HORAS * 60 * 60_000;
      const gravidadeSubiu =
        (ORDEM_GRAVIDADE[alerta.nivel] ?? 0) > (ORDEM_GRAVIDADE[s.ultimoNivelAlertaEnviado ?? "INFO"] ?? 0);

      if (jaNotificadoRecentemente && !gravidadeSubiu) continue;

      for (const destinatario of destinatarios) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: destinatario.id,
          titulo: `Alerta de serviço contínuo [${alerta.nivel}]: ${s.designacao}`,
          mensagem: alerta.mensagem,
          tipo: "ACAO_REQUERIDA",
          metadata: { servicoContinuoId: s.id, tipo: s.tipo, nivel: alerta.nivel },
          emailDestino: destinatario.emailConfirmado ? destinatario.email : null,
          nomeDestino: destinatario.nomeCompleto,
          telefoneDestino: destinatario.telefone,
        });
      }

      await tx.servicoContinuo.update({
        where: { id: s.id },
        data: { ultimoAlertaEnviadoEm: agora, ultimoNivelAlertaEnviado: alerta.nivel },
      });
      notificados += 1;
    }

    return { notificados };
  });
}