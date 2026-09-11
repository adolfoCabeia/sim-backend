import { HORARIO_PADRAO_INICIO_HORA, HORARIO_PADRAO_FIM_HORA } from "../rh.constants.js";

export function horaLuanda(agora: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Luanda", hour: "numeric", hour12: false }).format(agora)
  );
}

/** Início do dia (00h00) em Angola, devolvido como instante UTC equivalente. */
export function inicioDoDiaLuanda(agora: Date = new Date()): Date {
  const dataLuanda = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora); // "YYYY-MM-DD" no calendário de Luanda
  // Luanda é sempre UTC+1 (sem horário de Verão) — 00h00 em Luanda = 23h00 UTC do dia anterior.
  return new Date(`${dataLuanda}T00:00:00+01:00`);
}

export function dentroDoHorarioPermitido(agora: Date = new Date()): boolean {
  const hora = horaLuanda(agora);
  return hora >= HORARIO_PADRAO_INICIO_HORA && hora < HORARIO_PADRAO_FIM_HORA;
}