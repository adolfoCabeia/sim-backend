/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PRINCÍPIO OPERACIONAL: "NÃO ESPERAR QUE O SERVIÇO TERMINE PARA REAGIR" ║
 * ║                                                                          ║
 * ║  O motor de alertas deve SEMPRE antecipar a necessidade de revisão ou   ║
 * ║  abastecimento da frota. Nunca reagir depois da avaria ou pane seca.    ║
 * ║                                                                          ║
 * ║  Regras implementadas:                                                   ║
 * ║  1. Alerta URGENTE: revisão em ≤ 7 dias OU km excedido                  ║
 * ║  2. Alerta ATENCAO: revisão em ≤ 15 dias                                ║
 * ║  3. Abastecimento calcula consumo médio para prever próximo abastecer   ║
 * ║  4. Uso de viatura atualiza km e verifica se atingiu limite de revisão  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma, withTenantTransaction } from "../../config/prisma.js";
import type {
  FrotaCreateInput,
  FrotaUpdateInput,
  RegistrarUsoInput,
  RegistrarRevisaoInput,
  RegistrarAbastecimentoInput,
} from "./frota.schema.js";

function buildWhere(
  filtros: { municipioId?: string; alocacaoActual?: string; revisaoPendente?: boolean }
): Prisma.FrotaOperacionalWhereInput {
  const where: Prisma.FrotaOperacionalWhereInput = {
    ...(filtros.municipioId && { municipioId: filtros.municipioId }),
    ...(filtros.alocacaoActual && { alocacaoActual: filtros.alocacaoActual }),
  };

  if (filtros.revisaoPendente) {
    const hoje = new Date();
    where.OR = [
      { dataProximaRevisao: { lte: hoje } },
      { kmActual: { gte: prisma.frotaOperacional.fields.kmProximaRevisao } },
    ];
  }
  return where;
}

export async function listar(
  filtros: { municipioId?: string; alocacaoActual?: string; revisaoPendente?: boolean },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where = buildWhere(filtros);

  if (filtros.municipioId) {
    return withTenantTransaction(filtros.municipioId, async (tx) => {
      const [data, total] = await Promise.all([
        tx.frotaOperacional.findMany({
          where,
          skip,
          take: paginacao.limit,
          orderBy: { criadoEm: "desc" },
          include: {
            bem: { select: { id: true, designacao: true, marca: true, modelo: true, numeroMatricula: true } },
          },
        }),
        tx.frotaOperacional.count({ where }),
      ]);
      return { data, total };
    });
  }

  const [data, total] = await Promise.all([
    prisma.frotaOperacional.findMany({
      where,
      skip,
      take: paginacao.limit,
      orderBy: { criadoEm: "desc" },
      include: {
        bem: { select: { id: true, designacao: true, marca: true, modelo: true, numeroMatricula: true } },
      },
    }),
    prisma.frotaOperacional.count({ where }),
  ]);
  return { data, total };
}

export async function obter(id: string) {
  return prisma.frotaOperacional.findUnique({
    where: { id },
    include: {
      bem: { select: { id: true, designacao: true, marca: true, modelo: true, numeroMatricula: true } },
    },
  });
}

export async function criar(municipioId: string, dados: FrotaCreateInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const payload: Prisma.FrotaOperacionalUncheckedCreateInput = {
      municipioId,
      bemId: dados.bemId,
      ...(dados.alocacaoActual !== undefined && dados.alocacaoActual !== null && { alocacaoActual: dados.alocacaoActual }),
      ...(dados.kmActual !== undefined && { kmActual: dados.kmActual }),
      ...(dados.kmProximaRevisao !== undefined && dados.kmProximaRevisao !== null && { kmProximaRevisao: dados.kmProximaRevisao }),
      ...(dados.dataUltimaRevisao !== undefined && dados.dataUltimaRevisao !== null && { dataUltimaRevisao: new Date(dados.dataUltimaRevisao) }),
      ...(dados.dataProximaRevisao !== undefined && dados.dataProximaRevisao !== null && { dataProximaRevisao: new Date(dados.dataProximaRevisao) }),
      ...(dados.consumoMedio !== undefined && dados.consumoMedio !== null && { consumoMedio: dados.consumoMedio }),
      ...(dados.ultimoAbastecimento !== undefined && dados.ultimoAbastecimento !== null && { ultimoAbastecimento: new Date(dados.ultimoAbastecimento) }),
      ...(dados.tipoCombustivel !== undefined && dados.tipoCombustivel !== null && { tipoCombustivel: dados.tipoCombustivel }),
    };
    return tx.frotaOperacional.create({ data: payload });
  });
}

export async function atualizar(id: string, dados: FrotaUpdateInput) {
  const existente = await prisma.frotaOperacional.findUnique({
    where: { id },
    select: { municipioId: true },
  });
  if (!existente) return null;

  return withTenantTransaction(existente.municipioId, async (tx) => {
    const payload: Prisma.FrotaOperacionalUncheckedUpdateInput = {
      ...(dados.alocacaoActual !== undefined && dados.alocacaoActual !== null && { alocacaoActual: dados.alocacaoActual }),
      ...(dados.kmActual !== undefined && { kmActual: dados.kmActual }),
      ...(dados.kmProximaRevisao !== undefined && dados.kmProximaRevisao !== null && { kmProximaRevisao: dados.kmProximaRevisao }),
      ...(dados.dataUltimaRevisao !== undefined && dados.dataUltimaRevisao !== null && { dataUltimaRevisao: new Date(dados.dataUltimaRevisao) }),
      ...(dados.dataProximaRevisao !== undefined && dados.dataProximaRevisao !== null && { dataProximaRevisao: new Date(dados.dataProximaRevisao) }),
      ...(dados.consumoMedio !== undefined && dados.consumoMedio !== null && { consumoMedio: dados.consumoMedio }),
      ...(dados.ultimoAbastecimento !== undefined && dados.ultimoAbastecimento !== null && { ultimoAbastecimento: new Date(dados.ultimoAbastecimento) }),
      ...(dados.tipoCombustivel !== undefined && dados.tipoCombustivel !== null && { tipoCombustivel: dados.tipoCombustivel }),
    };
    return tx.frotaOperacional.update({ where: { id }, data: payload });
  });
}

export async function remover(id: string) {
  const existente = await prisma.frotaOperacional.findUnique({
    where: { id },
    select: { municipioId: true },
  });
  if (!existente) return null;

  return withTenantTransaction(existente.municipioId, async (tx) => {
    return tx.frotaOperacional.delete({ where: { id } });
  });
}

export async function registrarUso(id: string, dados: RegistrarUsoInput) {
  const existente = await prisma.frotaOperacional.findUniqueOrThrow({
    where: { id },
    select: { municipioId: true, kmActual: true, kmProximaRevisao: true, alocacaoActual: true, bemId: true },
  });

  return withTenantTransaction(existente.municipioId, async (tx) => {
    const frota = await tx.frotaOperacional.findUniqueOrThrow({ where: { id } });
    const novoKm = frota.kmActual + dados.kmPercorridos;

    const kmExcedido = frota.kmProximaRevisao ? novoKm >= frota.kmProximaRevisao : false;
    if (kmExcedido) {
      console.warn(
        `[ALERTA PREVENTIVO FROTA] ${frota.bemId} atingiu/excedeu km de revisão: ` +
        `${novoKm} ≥ ${frota.kmProximaRevisao}. Revisão obrigatória antes de novo uso.`
      );
    }

    return tx.frotaOperacional.update({
      where: { id },
      data: {
        kmActual: novoKm,
        alocacaoActual: dados.alocacaoActual ?? frota.alocacaoActual,
      },
    });
  });
}

export async function registrarRevisao(id: string, dados: RegistrarRevisaoInput) {
  const existente = await prisma.frotaOperacional.findUniqueOrThrow({
    where: { id },
    select: { municipioId: true },
  });

  return withTenantTransaction(existente.municipioId, async (tx) => {
    const dataRevisao = new Date(dados.dataRevisao);
    const proximaDataRevisao = new Date(dataRevisao);
    proximaDataRevisao.setMonth(proximaDataRevisao.getMonth() + 6);

    return tx.frotaOperacional.update({
      where: { id },
      data: {
        dataUltimaRevisao: dataRevisao,
        kmProximaRevisao: dados.kmProximaRevisao,
        dataProximaRevisao: proximaDataRevisao,
      },
    });
  });
}

export async function registrarAbastecimento(id: string, dados: RegistrarAbastecimentoInput) {
  const existente = await prisma.frotaOperacional.findUniqueOrThrow({
    where: { id },
    select: { municipioId: true, kmActual: true, consumoMedio: true, bemId: true },
  });

  return withTenantTransaction(existente.municipioId, async (tx) => {
    const frota = await tx.frotaOperacional.findUniqueOrThrow({ where: { id } });

    let consumoMedio: number | null = null;
    let kmPercorridosDesdeUltimo: number | null = null;

    if (frota.kmActual > 0 && dados.kmAtual > frota.kmActual) {
      kmPercorridosDesdeUltimo = dados.kmAtual - frota.kmActual;
      consumoMedio = parseFloat((Number(kmPercorridosDesdeUltimo) / dados.quantidadeLitros).toFixed(2));

      const consumoAnterior = frota.consumoMedio ? Number(frota.consumoMedio) : null;
      if (consumoAnterior && consumoMedio < consumoAnterior * 0.7) {
        console.warn(
          `[ALERTA FROTA] Consumo médio anómalo detectado em ${frota.bemId}: ` +
          `${consumoMedio} km/l vs média histórica ${consumoAnterior} km/l. ` +
          `Verificar estado mecânico.`
        );
      }
    }

    return tx.frotaOperacional.update({
      where: { id },
      data: {
        kmActual: dados.kmAtual,
        ultimoAbastecimento: new Date(dados.data),
        consumoMedio: consumoMedio ?? frota.consumoMedio,
      },
    });
  });
}

export async function listarAlertas(municipioId?: string) {
  const hoje = new Date();
  const daqui30Dias = new Date(hoje);
  daqui30Dias.setDate(hoje.getDate() + 30);

  const where: Prisma.FrotaOperacionalWhereInput = {
    OR: [
      { dataProximaRevisao: { lte: daqui30Dias, gte: hoje } },
      { dataProximaRevisao: { lt: hoje } },
    ],
    ...(municipioId && { municipioId }),
  };

  const query = async (tx: Prisma.TransactionClient | typeof prisma) => {
    const veiculos = await tx.frotaOperacional.findMany({
      where,
      orderBy: { dataProximaRevisao: "asc" },
      include: {
        bem: { select: { id: true, designacao: true, marca: true, modelo: true, numeroMatricula: true } },
      },
    });

    return veiculos
      .map((v) => {
        const diasAteRevisao = v.dataProximaRevisao
          ? Math.ceil((v.dataProximaRevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const diasAtraso = v.dataProximaRevisao && v.dataProximaRevisao < hoje
          ? Math.ceil((hoje.getTime() - v.dataProximaRevisao.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const kmAteRevisao = v.kmProximaRevisao ? v.kmProximaRevisao - v.kmActual : null;
        const kmExcedido = v.kmProximaRevisao ? v.kmActual >= v.kmProximaRevisao : false;
        const kmProximo = v.kmProximaRevisao ? v.kmActual >= v.kmProximaRevisao - 1000 : false;

        let nivel: "INFO" | "ATENCAO" | "URGENTE" | "CRITICO" = "INFO";
        let acaoRecomendada = "";
        let motivo = "";

        if (diasAtraso !== null && diasAtraso > 0) {
          nivel = "CRITICO";
          motivo = "REVISÃO ATRASADA";
          acaoRecomendada = `Revisão em atraso há ${diasAtraso} dias. Viatura deve ser retirada de serviço IMEDIATAMENTE até revisão.`;
        } else if (kmExcedido) {
          nivel = "CRITICO";
          motivo = "KM DE REVISÃO EXCEDIDO";
          acaoRecomendada = `Km actual (${v.kmActual}) excede limite (${v.kmProximaRevisao}). Revisão obrigatória antes de novo uso.`;
        } else if (diasAteRevisao !== null && diasAteRevisao <= 7) {
          nivel = "URGENTE";
          motivo = "REVISÃO IMINENTE";
          acaoRecomendada = `Revisão em ${diasAteRevisao} dias. Agendar oficina e substituto.`;
        } else if (diasAteRevisao !== null && diasAteRevisao <= 15) {
          nivel = "ATENCAO";
          motivo = "REVISÃO PRÓXIMA";
          acaoRecomendada = `Revisão prevista em ${diasAteRevisao} dias. Iniciar planeamento.`;
        } else if (kmProximo && kmAteRevisao !== null) {
          nivel = "ATENCAO";
          motivo = "KM PRÓXIMO DO LIMITE";
          acaoRecomendada = `Faltam ${kmAteRevisao} km para revisão. Monitorar uso intensivo.`;
        }

        return {
          veiculo: v,
          diasAteRevisao,
          diasAtraso,
          kmAteRevisao,
          kmExcedido,
          nivel,
          motivo,
          acaoRecomendada,
          mensagem: `[${nivel}] ${v.bem?.designacao ?? "Viatura"} (${v.bem?.numeroMatricula ?? "N/A"}): ${acaoRecomendada}`,
        };
      })
      .filter((a) => a.nivel !== "INFO" || a.kmExcedido || a.diasAtraso !== null)
      .sort((a, b) => {
        const ordem: Record<string, number> = { CRITICO: 0, URGENTE: 1, ATENCAO: 2, INFO: 3 };
        return (ordem[a.nivel] ?? 3) - (ordem[b.nivel] ?? 3);
      });
  };

  if (municipioId) {
    return withTenantTransaction(municipioId, async (tx) => query(tx));
  }
  return query(prisma);
}