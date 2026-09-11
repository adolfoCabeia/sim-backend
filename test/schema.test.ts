import { describe, it, expect } from "vitest";
import { criarAccaoFiscalizacaoSchema, registarCoimaSchema } from "../src/modules/fiscalizacao/fiscalizacao.schema.js";
import { comissaoCreateSchema } from "../src/modules/comissoes-moradores/comissao.schema.js";
import { registarPontoSchema, registarPontoManualSchema } from "../src/modules/rh/ponto/ponto.schema.js";
import { assinarDocumentoSchema } from "../src/modules/assinaturas/assinatura.schema.js";
import { criarPlanoSchema } from "../src/modules/gepe/gepe.schema.js";

describe("fiscalizacao.schema — criarAccaoFiscalizacaoSchema", () => {
  it("aceita uma acção de fiscalização mínima válida", () => {
    const resultado = criarAccaoFiscalizacaoSchema.safeParse({
      tipoAccao: "AUTO_NOTICIA",
      assunto: "Venda ambulante sem licença",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita um tipoAccao fora do enum (secção 13 só define estes 3)", () => {
    const resultado = criarAccaoFiscalizacaoSchema.safeParse({
      tipoAccao: "MULTA_DIRECTA", // não existe — só AUTO_NOTICIA/CONTRA_ORDENACAO/VISTORIA
      assunto: "Qualquer coisa",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita um assunto demasiado curto (< 5 caracteres)", () => {
    const resultado = criarAccaoFiscalizacaoSchema.safeParse({ tipoAccao: "VISTORIA", assunto: "Ok" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita fiscalResponsavelId que não seja um UUID", () => {
    const resultado = criarAccaoFiscalizacaoSchema.safeParse({
      tipoAccao: "VISTORIA",
      assunto: "Vistoria ao mercado municipal",
      fiscalResponsavelId: "não-é-um-uuid",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("fiscalizacao.schema — registarCoimaSchema", () => {
  it("aceita um valor de coima positivo", () => {
    expect(registarCoimaSchema.safeParse({ valorCoima: 50000 }).success).toBe(true);
  });

  it("rejeita valor de coima zero ou negativo (secção 13: coima é sempre um valor a pagar)", () => {
    expect(registarCoimaSchema.safeParse({ valorCoima: 0 }).success).toBe(false);
    expect(registarCoimaSchema.safeParse({ valorCoima: -100 }).success).toBe(false);
  });
});

describe("comissao.schema — comissaoCreateSchema", () => {
  it("aceita uma comissão mínima válida", () => {
    const resultado = comissaoCreateSchema.safeParse({
      bairro: "Zango 3",
      presidenteNome: "João Manuel",
    });
    expect(resultado.success).toBe(true);
  });

  it("aplica EM_REGULARIZACAO como estado por omissão quando não indicado", () => {
    const resultado = comissaoCreateSchema.parse({ bairro: "Zango 3", presidenteNome: "João Manuel" });
    expect(resultado.estado).toBe("EM_REGULARIZACAO");
  });

  it("rejeita coordenadas de latitude fora do intervalo válido (-90 a 90)", () => {
    const resultado = comissaoCreateSchema.safeParse({
      bairro: "Zango 3",
      presidenteNome: "João Manuel",
      coordenadasLat: 200,
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita uma lista de membros e devolve lista vazia por omissão", () => {
    const comMembros = comissaoCreateSchema.parse({
      bairro: "Zango 3",
      presidenteNome: "João Manuel",
      membros: [{ nome: "Maria José", cargo: "Secretária" }],
    });
    expect(comMembros.membros).toHaveLength(1);

    const semMembros = comissaoCreateSchema.parse({ bairro: "Zango 3", presidenteNome: "João Manuel" });
    expect(semMembros.membros).toEqual([]);
  });
});

describe("ponto.schema — registarPontoManualSchema", () => {
  it("exige observações não vazias para registo manual (justificação obrigatória)", () => {
    const resultado = registarPontoManualSchema.safeParse({
      funcionarioId: "11111111-1111-4111-8111-111111111111",
      tipo: "ENTRADA",
      metodo: "MANUAL",
      observacoes: "",
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita registo manual com justificação preenchida", () => {
    const resultado = registarPontoManualSchema.safeParse({
      funcionarioId: "11111111-1111-4111-8111-111111111111",
      tipo: "ENTRADA",
      metodo: "MANUAL",
      observacoes: "Dispositivo biométrico avariado — confirmado por RH.",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita metodo diferente de MANUAL neste schema específico", () => {
    const resultado = registarPontoManualSchema.safeParse({
      funcionarioId: "11111111-1111-4111-8111-111111111111",
      tipo: "ENTRADA",
      metodo: "BIOMETRICO",
      observacoes: "Qualquer coisa",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("ponto.schema — registarPontoSchema", () => {
  it("assume BIOMETRICO como método por omissão", () => {
    const resultado = registarPontoSchema.parse({
      funcionarioId: "11111111-1111-4111-8111-111111111111",
      tipo: "SAIDA",
    });
    expect(resultado.metodo).toBe("BIOMETRICO");
  });
});

describe("assinatura.schema — assinarDocumentoSchema", () => {
  it("rejeita conteúdo vazio (nada para hashear/assinar)", () => {
    const resultado = assinarDocumentoSchema.safeParse({
      referenciaTipo: "PROCESSO_GENERICO",
      referenciaId: "11111111-1111-4111-8111-111111111111",
      tipoAssinatura: "DESPACHO",
      conteudo: "",
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita um pedido de assinatura válido", () => {
    const resultado = assinarDocumentoSchema.safeParse({
      referenciaTipo: "PROCESSO_GENERICO",
      referenciaId: "11111111-1111-4111-8111-111111111111",
      tipoAssinatura: "DESPACHO",
      conteudo: "Defiro o processo 22/2026.",
    });
    expect(resultado.success).toBe(true);
  });
});

describe("gepe.schema — criarPlanoSchema", () => {
  it("aceita um Plano Anual de Actividades mínimo válido", () => {
    const resultado = criarPlanoSchema.safeParse({
      tipo: "PLANO_ANUAL_ACTIVIDADES",
      titulo: "Plano Anual de Actividades 2027",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita um ano fora do intervalo plausível", () => {
    const resultado = criarPlanoSchema.safeParse({
      tipo: "PDM",
      titulo: "PDM 2026-2030",
      ano: 1500,
    });
    expect(resultado.success).toBe(false);
  });
});