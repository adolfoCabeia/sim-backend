import { prisma } from "../../config/prisma.js";
import { notificarAlertasReposicaoPendentes } from "../../modules/stock/stock.service.js";
import { notificarAlertasManutencaoPendentes } from "../../modules/manuntencao/manutencao.service.js";
import { notificarAlertasServicosContinuosPendentes } from "../../modules/servicos-continuos/servicos-continuos.service.js";
import {
  notificarFimDeVinculoProximo,
  sincronizarEstadoFerias,
} from "../../modules/rh/funcionarios/funcionario.jobs.js";
import { notificarAusenciasSemRegistoPonto } from "../../modules/rh/ponto/ponto.service.js";
import { notificarAlertasPrazosProcessosPendentes } from "../../modules/processos-genericos/processo-generico.jobs.js";

export async function executarVerificacaoAlertasOperacionais(): Promise<{
  stock: number;
  manutencao: number;
  servicosContinuos: number;
  fimDeVinculo: number;
  ausenciasPonto: number;
  prazosProcessos: number;
  sincronizacaoFerias: { entraramEmFerias: number; regressaramDeFerias: number };
  erros: Array<{ municipioId: string; origem: string; mensagem: string }>;
}> {
  const municipios = await prisma.municipio.findMany({ where: { activo: true }, select: { id: true } });

  let totalStock = 0;
  let totalManutencao = 0;
  let totalServicosContinuos = 0;
  let totalFimDeVinculo = 0;
  let totalAusenciasPonto = 0;
  let totalPrazosProcessos = 0;
  let totalEntraramEmFerias = 0;
  let totalRegressaramDeFerias = 0;
  const erros: Array<{ municipioId: string; origem: string; mensagem: string }> = [];

  for (const { id: municipioId } of municipios) {
    try {
      const { notificados } = await notificarAlertasReposicaoPendentes({ municipioId });
      totalStock += notificados;
    } catch (erro) {
      erros.push({ municipioId, origem: "stock", mensagem: String((erro as Error)?.message ?? erro) });
    }

    try {
      const { notificados } = await notificarAlertasManutencaoPendentes({ municipioId });
      totalManutencao += notificados;
    } catch (erro) {
      erros.push({ municipioId, origem: "manutencao", mensagem: String((erro as Error)?.message ?? erro) });
    }

    try {
      const { notificados } = await notificarAlertasServicosContinuosPendentes({ municipioId });
      totalServicosContinuos += notificados;
    } catch (erro) {
      erros.push({ municipioId, origem: "servicos-continuos", mensagem: String((erro as Error)?.message ?? erro) });
    }

    try {
      const { notificados } = await notificarFimDeVinculoProximo({ municipioId });
      totalFimDeVinculo += notificados;
    } catch (erro) {
      erros.push({ municipioId, origem: "rh-fim-vinculo", mensagem: String((erro as Error)?.message ?? erro) });
    }

    try {
      const { notificados } = await notificarAusenciasSemRegistoPonto({ municipioId });
      totalAusenciasPonto += notificados;
    } catch (erro) {
      erros.push({ municipioId, origem: "rh-ausencia-ponto", mensagem: String((erro as Error)?.message ?? erro) });
    }

    try {
      const { notificados } = await notificarAlertasPrazosProcessosPendentes({ municipioId });
      totalPrazosProcessos += notificados;
    } catch (erro) {
      erros.push({ municipioId, origem: "processos-prazos", mensagem: String((erro as Error)?.message ?? erro) });
    }

    try {
      const { entraramEmFerias, regressaramDeFerias } = await sincronizarEstadoFerias({ municipioId });
      totalEntraramEmFerias += entraramEmFerias;
      totalRegressaramDeFerias += regressaramDeFerias;
    } catch (erro) {
      erros.push({ municipioId, origem: "rh-ferias", mensagem: String((erro as Error)?.message ?? erro) });
    }
  }

  return {
    stock: totalStock,
    manutencao: totalManutencao,
    servicosContinuos: totalServicosContinuos,
    fimDeVinculo: totalFimDeVinculo,
    ausenciasPonto: totalAusenciasPonto,
    prazosProcessos: totalPrazosProcessos,
    sincronizacaoFerias: { entraramEmFerias: totalEntraramEmFerias, regressaramDeFerias: totalRegressaramDeFerias },
    erros,
  };
}