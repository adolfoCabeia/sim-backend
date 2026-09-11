import { describe, it, expect } from "vitest";
import { calcularHashConteudo, calcularHmac, hmacsIguais } from "./assinatura.crypto.js";

describe("calcularHashConteudo", () => {
  it("é determinístico — o mesmo conteúdo produz sempre o mesmo hash", () => {
    const conteudo = "Parecer técnico: deferimento do processo 22/2026.";
    expect(calcularHashConteudo(conteudo)).toBe(calcularHashConteudo(conteudo));
  });

  it("produz um hash SHA-256 válido (64 caracteres hex)", () => {
    const hash = calcularHashConteudo("qualquer conteúdo");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("qualquer alteração ao conteúdo muda o hash (efeito de avalanche)", () => {
    const original = calcularHashConteudo("Deferido.");
    const alterado = calcularHashConteudo("Indeferido.");
    expect(original).not.toBe(alterado);
  });

  it("ignora espaços em branco nas pontas (trailing newline não invalida)", () => {
    const semEspacos = calcularHashConteudo("texto do parecer");
    const comNewlineNoFim = calcularHashConteudo("texto do parecer\n");
    const comEspacosNasPontas = calcularHashConteudo("  texto do parecer  ");
    expect(semEspacos).toBe(comNewlineNoFim);
    expect(semEspacos).toBe(comEspacosNasPontas);
  });

  it("é sensível a espaços NO MEIO do conteúdo (não normaliza tudo, só as pontas)", () => {
    const original = calcularHashConteudo("texto do parecer");
    const comEspacoDuplo = calcularHashConteudo("texto  do parecer");
    expect(original).not.toBe(comEspacoDuplo);
  });
});

describe("calcularHmac", () => {
  const base = {
    hashConteudo: calcularHashConteudo("Despacho do Administrador Municipal."),
    signatarioId: "11111111-1111-1111-1111-111111111111",
    criadoEm: new Date("2026-06-15T10:00:00.000Z"),
    segredo: "segredo-de-teste-com-pelo-menos-32-caracteres",
  };

  it("é determinístico para os mesmos parâmetros", () => {
    expect(calcularHmac(base)).toBe(calcularHmac(base));
  });

  it("produz um HMAC-SHA256 válido (64 caracteres hex)", () => {
    expect(calcularHmac(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("muda se o segredo mudar — é isto que torna o registo verificável e não forjável", () => {
    const comOutroSegredo = calcularHmac({ ...base, segredo: "outro-segredo-completamente-diferente-32ch" });
    expect(calcularHmac(base)).not.toBe(comOutroSegredo);
  });

  it("muda se o signatário mudar — impede reatribuir uma assinatura a outra pessoa", () => {
    const comOutroSignatario = calcularHmac({ ...base, signatarioId: "22222222-2222-2222-2222-222222222222" });
    expect(calcularHmac(base)).not.toBe(comOutroSignatario);
  });

  it("muda se a data mudar — impede reutilizar o HMAC noutro momento", () => {
    const comOutraData = calcularHmac({ ...base, criadoEm: new Date("2026-06-16T10:00:00.000Z") });
    expect(calcularHmac(base)).not.toBe(comOutraData);
  });

  it("muda se o hash do conteúdo mudar — detecta alteração ao documento assinado", () => {
    const comOutroConteudo = calcularHmac({ ...base, hashConteudo: calcularHashConteudo("Outro texto qualquer.") });
    expect(calcularHmac(base)).not.toBe(comOutroConteudo);
  });
});

describe("hmacsIguais", () => {
  it("confirma dois HMACs idênticos", () => {
    const hmac = calcularHmac({
      hashConteudo: calcularHashConteudo("texto"),
      signatarioId: "id-1",
      criadoEm: new Date("2026-01-01T00:00:00.000Z"),
      segredo: "segredo-de-teste-com-pelo-menos-32-caracteres",
    });
    expect(hmacsIguais(hmac, hmac)).toBe(true);
  });

  it("rejeita HMACs diferentes", () => {
    const params = {
      hashConteudo: calcularHashConteudo("texto"),
      signatarioId: "id-1",
      criadoEm: new Date("2026-01-01T00:00:00.000Z"),
      segredo: "segredo-de-teste-com-pelo-menos-32-caracteres",
    };
    const hmacA = calcularHmac(params);
    const hmacB = calcularHmac({ ...params, signatarioId: "id-2" });
    expect(hmacsIguais(hmacA, hmacB)).toBe(false);
  });

  it("rejeita comparação com string de comprimento diferente sem rebentar", () => {
    expect(hmacsIguais("ab", "abcd")).toBe(false);
  });
});

describe("cenário end-to-end: assinar e depois verificar", () => {
  const segredo = "segredo-de-teste-com-pelo-menos-32-caracteres";

  function assinar(conteudo: string, signatarioId: string, criadoEm: Date) {
    const hashConteudo = calcularHashConteudo(conteudo);
    const assinaturaHmac = calcularHmac({ hashConteudo, signatarioId, criadoEm, segredo });
    return { hashConteudo, assinaturaHmac };
  }

  function verificar(conteudo: string, signatarioId: string, criadoEm: Date, assinaturaHmacGuardado: string) {
    const hashRecalculado = calcularHashConteudo(conteudo);
    const hmacRecalculado = calcularHmac({ hashConteudo: hashRecalculado, signatarioId, criadoEm, segredo });
    return hmacsIguais(assinaturaHmacGuardado, hmacRecalculado);
  }

  it("uma assinatura válida verifica-se correctamente contra o conteúdo original", () => {
    const conteudo = "Defiro o processo 22/2026, nos termos do parecer jurídico anexo.";
    const signatarioId = "administrador-municipal-1";
    const criadoEm = new Date("2026-06-15T09:00:00.000Z");

    const { assinaturaHmac } = assinar(conteudo, signatarioId, criadoEm);

    expect(verificar(conteudo, signatarioId, criadoEm, assinaturaHmac)).toBe(true);
  });

  it("detecta alteração ao conteúdo depois de assinado (o cenário que a assinatura existe para apanhar)", () => {
    const conteudoOriginal = "Defiro o processo 22/2026.";
    const conteudoAlterado = "Indefiro o processo 22/2026.";
    const signatarioId = "administrador-municipal-1";
    const criadoEm = new Date("2026-06-15T09:00:00.000Z");

    const { assinaturaHmac } = assinar(conteudoOriginal, signatarioId, criadoEm);

    // Alguém altera o texto do despacho depois de assinado — a verificação
    // contra o novo texto TEM de falhar.
    expect(verificar(conteudoAlterado, signatarioId, criadoEm, assinaturaHmac)).toBe(false);
  });

  it("detecta adulteração do próprio registo de assinatura (HMAC trocado manualmente na BD)", () => {
    const conteudo = "Defiro o processo 22/2026.";
    const signatarioId = "administrador-municipal-1";
    const criadoEm = new Date("2026-06-15T09:00:00.000Z");

    assinar(conteudo, signatarioId, criadoEm);
    const hmacForjado = "0".repeat(64); // alguém escreve um HMAC arbitrário directamente na BD

    expect(verificar(conteudo, signatarioId, criadoEm, hmacForjado)).toBe(false);
  });
});