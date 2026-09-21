import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { listarUtilizadoresComPermissao } from "../auth/rbac/rbac.service.js";
import type {
  ManutencaoCreateInput,
  ManutencaoUpdateInput,
  ConcluirManutencaoInput,
} from "./manutencao.schema.js";

const NIVEIS_NOTIFICAVEIS = new Set(["CRITICO", "URGENTE"]);
const ORDEM_GRAVIDADE: Record<string, number> = {
  INFO: 0,
  ATENCAO: 1,
  URGENTE: 2,
  CRITICO: 3,
};
const INTERVALO_MINIMO_REENVIO_HORAS = 24;

function buildWhere(filtros: {
  bemId?: string | undefined;
  tipoManutencao?: string | undefined;
  estado?: string | undefined;
  proximas?: boolean | undefined;
}): Prisma.ManutencaoProgramadaWhereInput {
  const where: Prisma.ManutencaoProgramadaWhereInput = {
    ...(filtros.bemId && { bemId: filtros.bemId }),
    ...(filtros.tipoManutencao && { tipoManutencao: filtros.tipoManutencao }),
    ...(filtros.estado && { estado: filtros.estado }),
  };

  if (filtros.proximas) {
    const hoje = new Date();
    const daqui30Dias = new Date(hoje);
    daqui30Dias.setDate(hoje.getDate() + 30);
    where.OR = [
      { dataProxima: { lte: daqui30Dias, gte: hoje } },
      { dataProxima: { lt: hoje }, estado: "AGENDADA" },
    ];
  }
  return where;
}

export async function listar(
  filtros: {
    municipioId: string;
    bemId?: string | undefined;
    tipoManutencao?: string | undefined;
    estado?: string | undefined;
    proximas?: boolean | undefined;
  },
  paginacao: { page: number; limit: number },
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where = buildWhere(filtros);

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.manutencaoProgramada.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { dataProxima: "asc" },
        include: {
          bem: { select: { id: true, designacao: true, categoria: true } },
        },
      }),
      tx.manutencaoProgramada.count({ where }),
    ]);
    return { data, total };
  });
}

export async function obter(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.manutencaoProgramada.findUnique({
      where: { id },
      include: {
        bem: { select: { id: true, designacao: true, categoria: true } },
      },
    });
  });
}

export async function criar(municipioId: string, dados: ManutencaoCreateInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const payload: Prisma.ManutencaoProgramadaUncheckedCreateInput = {
      municipioId,
      bemId: dados.bemId,
      tipoManutencao: dados.tipoManutencao,
      periodicidadeMeses: dados.periodicidadeMeses,
      estado: "AGENDADA",
      ...(dados.dataUltima !== undefined &&
        dados.dataUltima !== null && {
          dataUltima: new Date(dados.dataUltima),
        }),
      ...(dados.dataProxima !== undefined &&
        dados.dataProxima !== null && {
          dataProxima: new Date(dados.dataProxima),
        }),
      ...(dados.especificacoesTecnicas !== undefined && {
        especificacoesTecnicas: dados.especificacoesTecnicas,
      }),
      ...(dados.responsavelId !== undefined && {
        responsavelId: dados.responsavelId,
      }),
      ...(dados.observacoes !== undefined && {
        observacoes: dados.observacoes,
      }),
    };

    if (!payload.dataProxima && dados.periodicidadeMeses) {
      const baseDate = payload.dataUltima
        ? new Date(payload.dataUltima)
        : new Date();
      const proxima = new Date(baseDate);
      proxima.setMonth(proxima.getMonth() + dados.periodicidadeMeses);
      payload.dataProxima = proxima;
    }

    return tx.manutencaoProgramada.create({ data: payload });
  });
}

export async function atualizar(
  id: string,
  municipioId: string,
  dados: ManutencaoUpdateInput,
) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.manutencaoProgramada.findUniqueOrThrow({ where: { id } });

    const payload: Prisma.ManutencaoProgramadaUncheckedUpdateInput = {
      ...(dados.tipoManutencao !== undefined && {
        tipoManutencao: dados.tipoManutencao,
      }),
      ...(dados.periodicidadeMeses !== undefined && {
        periodicidadeMeses: dados.periodicidadeMeses,
      }),
      ...(dados.estado !== undefined && { estado: dados.estado }),
      ...(dados.especificacoesTecnicas !== undefined && {
        especificacoesTecnicas: dados.especificacoesTecnicas,
      }),
      ...(dados.responsavelId !== undefined && {
        responsavelId: dados.responsavelId,
      }),
      ...(dados.observacoes !== undefined && {
        observacoes: dados.observacoes,
      }),
      ...(dados.dataUltima !== undefined &&
        dados.dataUltima !== null && {
          dataUltima: new Date(dados.dataUltima),
        }),
      ...(dados.dataProxima !== undefined &&
        dados.dataProxima !== null && {
          dataProxima: new Date(dados.dataProxima),
        }),
    };

    return tx.manutencaoProgramada.update({ where: { id }, data: payload });
  });
}

export async function remover(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.manutencaoProgramada.findUniqueOrThrow({ where: { id } });
    return tx.manutencaoProgramada.delete({ where: { id } });
  });
}

export async function concluir(
  id: string,
  municipioId: string,
  dados: ConcluirManutencaoInput,
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.manutencaoProgramada.findUniqueOrThrow({
      where: { id },
      select: {
        periodicidadeMeses: true,
        observacoes: true,
        responsavelId: true,
      },
    });

    const dataRealizacao = new Date(dados.dataRealizacao);
    const dataProxima = new Date(dataRealizacao);
    dataProxima.setMonth(dataProxima.getMonth() + existente.periodicidadeMeses);

    return tx.manutencaoProgramada.update({
      where: { id },
      data: {
        dataUltima: dataRealizacao,
        dataProxima,
        estado: "AGENDADA",
        observacoes: dados.observacoes ?? existente.observacoes,
        responsavelId: dados.responsavelId ?? existente.responsavelId,
      },
    });
  });
}

export async function listarAlertas(municipioId: string) {
  const hoje = new Date();
  const daqui30Dias = new Date(hoje);
  daqui30Dias.setDate(hoje.getDate() + 30);

  const where: Prisma.ManutencaoProgramadaWhereInput = {
    estado: "AGENDADA",
    OR: [
      { dataProxima: { lte: daqui30Dias, gte: hoje } },
      { dataProxima: { lt: hoje } },
    ],
  };

  return withTenantTransaction(municipioId, async (tx) => {
    const manutencoes = await tx.manutencaoProgramada.findMany({
      where,
      orderBy: { dataProxima: "asc" },
      include: {
        bem: { select: { id: true, designacao: true, categoria: true } },
      },
    });

    return manutencoes.map((m) => {
      const diasAte = m.dataProxima
        ? Math.ceil(
            (m.dataProxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

      const diasAtraso =
        m.dataProxima && m.dataProxima < hoje
          ? Math.ceil(
              (hoje.getTime() - m.dataProxima.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;

      let nivel: "INFO" | "ATENCAO" | "URGENTE" | "CRITICO" = "INFO";
      let acaoRecomendada = "";

      if (diasAtraso !== null && diasAtraso > 0) {
        nivel = "CRITICO";
        acaoRecomendada = `MANUTENÇÃO EM ATRASO há ${diasAtraso} dias. Risco operacional iminente. Executar IMEDIATAMENTE.`;
      } else if (diasAte !== null) {
        if (diasAte <= 7) {
          nivel = "URGENTE";
          acaoRecomendada = `Manutenção em ${diasAte} dias. Tempo mínimo de mobilização (7 dias) comprometido.`;
        } else if (diasAte <= 15) {
          nivel = "ATENCAO";
          acaoRecomendada = `Agendar equipa e materiais. Manutenção prevista em ${diasAte} dias.`;
        } else {
          nivel = "INFO";
          acaoRecomendada = `Manutenção prevista em ${diasAte} dias. Período de planeamento.`;
        }
      }

      return {
        manutencao: m,
        diasAteProxima: diasAte,
        diasAtraso,
        nivel,
        acaoRecomendada,
        mensagem: `[${nivel}] ${m.bem?.designacao ?? "Bem"} — ${m.tipoManutencao}: ${acaoRecomendada}`,
      };
    });
  });
}

// ─── NOTIFICAÇÃO PROACTIVA DE ALERTAS ───
// PRINCÍPIO: "Não esperar que o serviço termine para reagir" (secção 8.3.3).
// Notifica primeiro o `responsavelId` da manutenção quando definido; caso
// contrário, quem tiver a permissão "manutencao:gerir" no município.
export async function notificarAlertasManutencaoPendentes(params: {
  municipioId: string;
}): Promise<{ notificados: number }> {
  const alertas = await listarAlertas(params.municipioId);
  const relevantes = alertas.filter((a) => NIVEIS_NOTIFICAVEIS.has(a.nivel));
  if (relevantes.length === 0) return { notificados: 0 };

  return withTenantTransaction(params.municipioId, async (tx) => {
    const gestoresPorPermissao = await listarUtilizadoresComPermissao(
      tx,
      "manutencao:gerir",
    );
    let notificados = 0;
    const agora = new Date();

    for (const alerta of relevantes) {
      const m = alerta.manutencao;
      const jaNotificadoRecentemente =
        m.ultimoAlertaEnviadoEm &&
        agora.getTime() - new Date(m.ultimoAlertaEnviadoEm).getTime() <
          INTERVALO_MINIMO_REENVIO_HORAS * 60 * 60_000;
      const gravidadeSubiu =
        (ORDEM_GRAVIDADE[alerta.nivel] ?? 0) >
        (ORDEM_GRAVIDADE[m.ultimoNivelAlertaEnviado ?? "INFO"] ?? 0);

      if (jaNotificadoRecentemente && !gravidadeSubiu) continue;

      let destinatarios = gestoresPorPermissao;
      if (m.responsavelId) {
        const responsavel = await tx.utilizador.findUnique({
          where: { id: m.responsavelId },
          select: {
            id: true,
            email: true,
            nomeCompleto: true,
            telefone: true,
            emailConfirmado: true,
          },
        });
        if (responsavel) destinatarios = [responsavel];
      }
      if (destinatarios.length === 0) continue;

      for (const destinatario of destinatarios) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: destinatario.id,
          titulo: `Alerta de manutenção [${alerta.nivel}]: ${m.bem?.designacao ?? "Bem"}`,
          mensagem: alerta.mensagem,
          tipo: "ACAO_REQUERIDA",
          metadata: { manutencaoId: m.id, bemId: m.bemId, nivel: alerta.nivel },
          emailDestino: destinatario.emailConfirmado
            ? destinatario.email
            : null,
          nomeDestino: destinatario.nomeCompleto,
          telefoneDestino: destinatario.telefone,
        });
      }

      await tx.manutencaoProgramada.update({
        where: { id: m.id },
        data: {
          ultimoAlertaEnviadoEm: agora,
          ultimoNivelAlertaEnviado: alerta.nivel,
        },
      });
      notificados += 1;
    }

    return { notificados };
  });
}
