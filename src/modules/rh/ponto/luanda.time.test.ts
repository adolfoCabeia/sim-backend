import { describe, it, expect } from "vitest";
import { horaLuanda, inicioDoDiaLuanda, dentroDoHorarioPermitido } from "./luanda.time.js";

describe("horaLuanda", () => {
  it("devolve a hora correcta quando o instante UTC já está dentro do mesmo dia em Luanda (UTC+1)", () => {
    // 10:30 UTC == 11:30 em Luanda
    expect(horaLuanda(new Date("2026-06-15T10:30:00.000Z"))).toBe(11);
  });

  it("faz o rollover de hora correctamente perto da meia-noite UTC", () => {
    // 23:30 UTC == 00:30 do dia seguinte em Luanda
    expect(horaLuanda(new Date("2026-06-15T23:30:00.000Z"))).toBe(0);
  });

  it("não é afectado por horário de Verão (Angola nunca observa DST)", () => {
    // Testa um instante em Janeiro (verão no hemisfério sul) e um em Julho
    // (inverno) — a diferença para UTC deve ser sempre exactamente +1h.
    const janeiro = new Date("2026-01-15T12:00:00.000Z");
    const julho = new Date("2026-07-15T12:00:00.000Z");
    expect(horaLuanda(janeiro)).toBe(13);
    expect(horaLuanda(julho)).toBe(13);
  });
});

describe("inicioDoDiaLuanda", () => {
  it("devolve a meia-noite de Luanda como 23h00 UTC do dia anterior", () => {
    // 15 de Junho, 10:30 UTC (11:30 em Luanda) -> início do dia em Luanda
    // é 2026-06-15T00:00:00+01:00, que em UTC é 2026-06-14T23:00:00Z.
    const resultado = inicioDoDiaLuanda(new Date("2026-06-15T10:30:00.000Z"));
    expect(resultado.toISOString()).toBe("2026-06-14T23:00:00.000Z");
  });

  it("usa o dia correcto em Luanda mesmo quando já é o dia seguinte em UTC", () => {
    // 23:30 UTC de dia 15 == 00:30 de dia 16 em Luanda -> início do dia
    // em Luanda é 2026-06-16T00:00:00+01:00 == 2026-06-15T23:00:00Z.
    const resultado = inicioDoDiaLuanda(new Date("2026-06-15T23:30:00.000Z"));
    expect(resultado.toISOString()).toBe("2026-06-15T23:00:00.000Z");
  });
});

describe("dentroDoHorarioPermitido", () => {
  it("permite acesso às 08h00 em Luanda (limite inferior, inclusivo)", () => {
    // 08:00 em Luanda == 07:00 UTC
    expect(dentroDoHorarioPermitido(new Date("2026-06-15T07:00:00.000Z"))).toBe(true);
  });

  it("bloqueia acesso às 07h59 em Luanda (1 minuto antes de abrir)", () => {
    expect(dentroDoHorarioPermitido(new Date("2026-06-15T06:59:00.000Z"))).toBe(false);
  });

  it("permite acesso às 15h59 em Luanda (1 minuto antes de fechar)", () => {
    expect(dentroDoHorarioPermitido(new Date("2026-06-15T14:59:00.000Z"))).toBe(true);
  });

  it("bloqueia acesso às 16h00 em Luanda (limite superior, exclusivo)", () => {
    // 16:00 em Luanda == 15:00 UTC
    expect(dentroDoHorarioPermitido(new Date("2026-06-15T15:00:00.000Z"))).toBe(false);
  });

  it("bloqueia acesso a meio da noite em Luanda", () => {
    // 02:00 em Luanda == 01:00 UTC
    expect(dentroDoHorarioPermitido(new Date("2026-06-15T01:00:00.000Z"))).toBe(false);
  });
});