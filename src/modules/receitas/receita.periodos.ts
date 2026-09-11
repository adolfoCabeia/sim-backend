// Resolução de períodos para o Dashboard Financeiro.
//
// A coluna `Receita.data` é armazenada como DATE (sem componente de hora), ou seja,
// representa directamente o dia de calendário da arrecadação. Para evitar problemas de
// fuso horário, todo este módulo trabalha com "dias de calendário" (ano/mês/dia) e não
// com timestamps. "Hoje" é sempre calculado no fuso de Angola (Africa/Luanda, UTC+1, sem
// horário de verão).

export const TIPOS_PERIODO = [
  "HOJE",
  "ONTEM",
  "ULTIMOS_7_DIAS",
  "ESTE_MES",
  "MES_ANTERIOR",
  "TRIMESTRE_ATUAL",
  "TRIMESTRE_ANTERIOR",
  "SEMESTRE_ATUAL",
  "SEMESTRE_ANTERIOR",
  "ESTE_ANO",
  "ANO_ANTERIOR",
  "PERSONALIZADO",
] as const;

export type TipoPeriodo = (typeof TIPOS_PERIODO)[number];

export interface IntervaloData {
  inicio: Date; // 00:00 UTC do primeiro dia (inclusive), representando um dia de calendário
  fim: Date; // 00:00 UTC do último dia (inclusive), representando um dia de calendário
}

export interface PeriodoResolvido {
  tipo: TipoPeriodo;
  atual: IntervaloData;
  anterior: IntervaloData;
}

const OFFSET_LUANDA_HORAS = 1; // Africa/Luanda = UTC+1, sem horário de verão

function hojeEmLuanda(): Date {
  const agora = new Date();
  const comOffset = new Date(agora.getTime() + OFFSET_LUANDA_HORAS * 60 * 60 * 1000);
  return diaUtc(comOffset.getUTCFullYear(), comOffset.getUTCMonth(), comOffset.getUTCDate());
}

function diaUtc(ano: number, mesIndex: number, dia: number): Date {
  return new Date(Date.UTC(ano, mesIndex, dia));
}

function adicionarDias(data: Date, dias: number): Date {
  const copia = new Date(data.getTime());
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

function diferencaEmDias(inicio: Date, fim: Date): number {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round((fim.getTime() - inicio.getTime()) / MS_POR_DIA);
}

function inicioDoMes(ano: number, mesIndex: number): Date {
  return diaUtc(ano, mesIndex, 1);
}

function fimDoMes(ano: number, mesIndex: number): Date {
  return diaUtc(ano, mesIndex + 1, 0);
}

function trimestreDoMes(mesIndex: number): number {
  return Math.floor(mesIndex / 3); // 0..3
}

function inicioDoTrimestre(ano: number, trimestre: number): Date {
  return inicioDoMes(ano, trimestre * 3);
}

function fimDoTrimestre(ano: number, trimestre: number): Date {
  return fimDoMes(ano, trimestre * 3 + 2);
}

function semestreDoMes(mesIndex: number): number {
  return mesIndex < 6 ? 0 : 1;
}

function inicioDoSemestre(ano: number, semestre: number): Date {
  return inicioDoMes(ano, semestre * 6);
}

function fimDoSemestre(ano: number, semestre: number): Date {
  return fimDoMes(ano, semestre * 6 + 5);
}

/** Dado um intervalo [inicio, fim] (inclusive), devolve o intervalo imediatamente anterior com a mesma duração em dias. */
function periodoAnteriorEquivalente(intervalo: IntervaloData): IntervaloData {
  const duracaoDias = diferencaEmDias(intervalo.inicio, intervalo.fim) + 1;
  const fimAnterior = adicionarDias(intervalo.inicio, -1);
  const inicioAnterior = adicionarDias(fimAnterior, -(duracaoDias - 1));
  return { inicio: inicioAnterior, fim: fimAnterior };
}

export class PeriodoInvalidoError extends Error {}

export function resolverPeriodo(params: {
  tipo: TipoPeriodo;
  dataInicio?: string | undefined;
  dataFim?: string | undefined;
}): PeriodoResolvido {
  const hoje = hojeEmLuanda();
  const ano = hoje.getUTCFullYear();
  const mesIndex = hoje.getUTCMonth();

  let atual: IntervaloData;

  switch (params.tipo) {
    case "HOJE":
      atual = { inicio: hoje, fim: hoje };
      break;
    case "ONTEM": {
      const ontem = adicionarDias(hoje, -1);
      atual = { inicio: ontem, fim: ontem };
      break;
    }
    case "ULTIMOS_7_DIAS":
      atual = { inicio: adicionarDias(hoje, -6), fim: hoje };
      break;
    case "ESTE_MES":
      atual = { inicio: inicioDoMes(ano, mesIndex), fim: fimDoMes(ano, mesIndex) };
      break;
    case "MES_ANTERIOR": {
      const mesAnteriorIndex = mesIndex - 1;
      const anoAjustado = mesAnteriorIndex < 0 ? ano - 1 : ano;
      const mesAjustado = (mesAnteriorIndex + 12) % 12;
      atual = { inicio: inicioDoMes(anoAjustado, mesAjustado), fim: fimDoMes(anoAjustado, mesAjustado) };
      break;
    }
    case "TRIMESTRE_ATUAL": {
      const trimestre = trimestreDoMes(mesIndex);
      atual = { inicio: inicioDoTrimestre(ano, trimestre), fim: fimDoTrimestre(ano, trimestre) };
      break;
    }
    case "TRIMESTRE_ANTERIOR": {
      const trimestreAtual = trimestreDoMes(mesIndex);
      const trimestreAnteriorIdx = trimestreAtual - 1;
      const anoAjustado = trimestreAnteriorIdx < 0 ? ano - 1 : ano;
      const trimestreAjustado = (trimestreAnteriorIdx + 4) % 4;
      atual = { inicio: inicioDoTrimestre(anoAjustado, trimestreAjustado), fim: fimDoTrimestre(anoAjustado, trimestreAjustado) };
      break;
    }
    case "SEMESTRE_ATUAL": {
      const semestre = semestreDoMes(mesIndex);
      atual = { inicio: inicioDoSemestre(ano, semestre), fim: fimDoSemestre(ano, semestre) };
      break;
    }
    case "SEMESTRE_ANTERIOR": {
      const semestreAtual = semestreDoMes(mesIndex);
      const anoAjustado = semestreAtual === 0 ? ano - 1 : ano;
      const semestreAjustado = semestreAtual === 0 ? 1 : 0;
      atual = { inicio: inicioDoSemestre(anoAjustado, semestreAjustado), fim: fimDoSemestre(anoAjustado, semestreAjustado) };
      break;
    }
    case "ESTE_ANO":
      atual = { inicio: diaUtc(ano, 0, 1), fim: diaUtc(ano, 11, 31) };
      break;
    case "ANO_ANTERIOR":
      atual = { inicio: diaUtc(ano - 1, 0, 1), fim: diaUtc(ano - 1, 11, 31) };
      break;
    case "PERSONALIZADO": {
      if (!params.dataInicio || !params.dataFim) {
        throw new PeriodoInvalidoError("Para o período personalizado é obrigatório indicar dataInicio e dataFim.");
      }
      const inicio = parseDataISO(params.dataInicio);
      const fim = parseDataISO(params.dataFim);
      if (inicio.getTime() > fim.getTime()) {
        throw new PeriodoInvalidoError("A dataInicio não pode ser posterior à dataFim.");
      }
      atual = { inicio, fim };
      break;
    }
    default:
      throw new PeriodoInvalidoError(`Tipo de período desconhecido: ${params.tipo as string}`);
  }

  return { tipo: params.tipo, atual, anterior: periodoAnteriorEquivalente(atual) };
}

function parseDataISO(valor: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!match) {
    throw new PeriodoInvalidoError(`Data inválida: ${valor}. Utilize o formato AAAA-MM-DD.`);
  }
  const [, anoStr, mesStr, diaStr] = match;
  return diaUtc(Number(anoStr), Number(mesStr) - 1, Number(diaStr));
}

export function formatarDataISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}
