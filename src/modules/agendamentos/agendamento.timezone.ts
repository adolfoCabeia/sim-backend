const OFFSET_ANGOLA_HORAS = 1; // UTC+1, fixo

/** Devolve um objecto com os componentes da data/hora já na hora de Angola. */
export function paraComponentesAngola(data: Date) {
  const comOffset = new Date(data.getTime() + OFFSET_ANGOLA_HORAS * 60 * 60_000);
  return {
    diaDaSemana: comOffset.getUTCDay(), // 0=Dom ... 6=Sáb
    hora: comOffset.getUTCHours(),
    minuto: comOffset.getUTCMinutes(),
    ano: comOffset.getUTCFullYear(),
    mes: comOffset.getUTCMonth(),
    dia: comOffset.getUTCDate(),
  };
}

/** Meia-noite de hoje, na hora de Angola, devolvida já como instante UTC correcto. */
export function inicioDoDiaEmAngola(referencia: Date = new Date()) {
  const { ano, mes, dia } = paraComponentesAngola(referencia);
  // Meia-noite em Angola == 23:00 UTC do dia anterior (offset +1).
  return new Date(Date.UTC(ano, mes, dia, 0, 0, 0) - OFFSET_ANGOLA_HORAS * 60 * 60_000);
}

/**
 * NOVO — 23:59:59.999 de hoje, na hora de Angola, como instante UTC correcto.
 * Necessário para o endpoint de "agendamentos de hoje": sem isto, o único
 * jeito de limitar ao dia era um filtro "desde meia-noite" sem "até", ou um
 * cálculo feito à mão (e errado) no chamador.
 */
export function fimDoDiaEmAngola(referencia: Date = new Date()) {
  return new Date(inicioDoDiaEmAngola(referencia).getTime() + 24 * 60 * 60_000 - 1);
}

/**
 * NOVO — chave estável "YYYY-MM-DD" do dia em Angola, para usar como parte
 * de uma chave de agrupamento (ex.: contador de senha por dia). Não usar
 * `new Date().toISOString().slice(0, 10)` directamente para isto — está em
 * UTC, não em hora de Angola, e dá o dia errado entre as 23:00 e a meia-noite.
 */
export function chaveDoDiaEmAngola(referencia: Date = new Date()): string {
  const { ano, mes, dia } = paraComponentesAngola(referencia);
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}