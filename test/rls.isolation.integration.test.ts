import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { criarTestDb, type TestDb } from "./setup.js";

describe("Isolamento RLS multi-tenant (Postgres real via pglite)", () => {
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await criarTestDb();

    // Fixtures: dois municípios, cada um com dados nas tabelas em teste.
    await testDb.queryComoSuperuser(
      `INSERT INTO municipios (id, nome, codigo, "criadoEm", "alteradoEm", activo) VALUES
       ('municipio-viana', 'Viana', 'VIA', now(), now(), true),
       ('municipio-talatona', 'Talatona', 'TAL', now(), now(), true)`
    );

    await testDb.queryComoSuperuser(
      `INSERT INTO itens_stock (id, "municipioId", codigo, designacao, categoria, "unidadeMedida", "quantidadeActual", "quantidadeMinima", "pontoReposicao", "criadoEm", "alteradoEm") VALUES
       ('item-viana', 'municipio-viana', 'V-001', 'Papel A4 (Viana)', 'MATERIAL_ESCRITORIO', 'RESMA', 10, 2, 3, now(), now()),
       ('item-talatona', 'municipio-talatona', 'T-001', 'Papel A4 (Talatona)', 'MATERIAL_ESCRITORIO', 'RESMA', 10, 2, 3, now(), now())`
    );

    await testDb.queryComoSuperuser(
      `INSERT INTO comissoes_moradores (id, "municipioId", bairro, "presidenteNome", estado, "criadoEm", "alteradoEm") VALUES
       ('comissao-viana', 'municipio-viana', 'Zango 3', 'João de Viana', 'ACTIVA', now(), now()),
       ('comissao-talatona', 'municipio-talatona', 'Benfica', 'Maria de Talatona', 'ACTIVA', now(), now())`
    );

    await testDb.queryComoSuperuser(
      `INSERT INTO assinaturas_eletronicas (id, "municipioId", "signatarioId", "referenciaTipo", "referenciaId", "tipoAssinatura", "hashConteudo", "assinaturaHmac", "criadoEm") VALUES
       ('assin-viana', 'municipio-viana', 'sig-1', 'PROCESSO_GENERICO', 'proc-1', 'DESPACHO', 'hash1', 'hmac1', now()),
       ('assin-talatona', 'municipio-talatona', 'sig-2', 'PROCESSO_GENERICO', 'proc-2', 'DESPACHO', 'hash2', 'hmac2', now())`
    );
  });

  afterAll(async () => {
    await testDb.fechar();
  });

  describe("itens_stock", () => {
    it("um município só vê o seu próprio item de stock", async () => {
      const linhas = await testDb.queryComoMunicipio("municipio-viana", `SELECT * FROM itens_stock`);
      expect(linhas).toHaveLength(1);
      expect(linhas[0]).toMatchObject({ id: "item-viana" });
    });

    it("o outro município só vê o SEU item — nunca o de Viana", async () => {
      const linhas = await testDb.queryComoMunicipio("municipio-talatona", `SELECT * FROM itens_stock`);
      expect(linhas).toHaveLength(1);
      expect(linhas[0]).toMatchObject({ id: "item-talatona" });
    });

    it("sem nenhum município definido no contexto, não vê NADA (fail-closed)", async () => {
      const linhas = await testDb.queryComoMunicipioIndefinido(`SELECT * FROM itens_stock`);
      expect(linhas).toHaveLength(0);
    });

    it("um id específico de outro município não é acessível mesmo pedindo-o directamente por WHERE", async () => {
      // Simula o cenário que a RLS existe para prevenir: um pedido a
      // tentar aceder por ID a um registo de outro município.
      const linhas = await testDb.queryComoMunicipio(
        "municipio-talatona",
        `SELECT * FROM itens_stock WHERE id = 'item-viana'`
      );
      expect(linhas).toHaveLength(0);
    });
  });

  describe("comissoes_moradores", () => {
    it("cada município só vê as suas próprias comissões de moradores", async () => {
      const viana = await testDb.queryComoMunicipio("municipio-viana", `SELECT * FROM comissoes_moradores`);
      const talatona = await testDb.queryComoMunicipio("municipio-talatona", `SELECT * FROM comissoes_moradores`);

      expect(viana.map((r: any) => r.id)).toEqual(["comissao-viana"]);
      expect(talatona.map((r: any) => r.id)).toEqual(["comissao-talatona"]);
    });
  });

  describe("assinaturas_eletronicas", () => {
    it("uma assinatura electrónica de um município não é visível a partir doutro", async () => {
      const linhas = await testDb.queryComoMunicipio(
        "municipio-talatona",
        `SELECT * FROM assinaturas_eletronicas WHERE id = 'assin-viana'`
      );
      expect(linhas).toHaveLength(0);
    });

    it("continua visível para o município correcto", async () => {
      const linhas = await testDb.queryComoMunicipio(
        "municipio-viana",
        `SELECT * FROM assinaturas_eletronicas WHERE id = 'assin-viana'`
      );
      expect(linhas).toHaveLength(1);
    });
  });

  describe("movimentos_stock (isolamento via subquery, não tem municipioId próprio)", () => {
    it("um movimento de stock só é visível através do item de stock do MESMO município", async () => {
      await testDb.queryComoSuperuser(
        `INSERT INTO movimentos_stock (id, "itemStockId", tipo, quantidade, "quantidadeAnterior", "quantidadePosterior", motivo, "utilizadorId", "criadoEm") VALUES
         ('mov-viana', 'item-viana', 'ENTRADA', 5, 10, 15, 'Reposição', 'user-1', now())`
      );

      const visivelParaViana = await testDb.queryComoMunicipio("municipio-viana", `SELECT * FROM movimentos_stock`);
      const visivelParaTalatona = await testDb.queryComoMunicipio("municipio-talatona", `SELECT * FROM movimentos_stock`);

      expect(visivelParaViana).toHaveLength(1);
      expect(visivelParaTalatona).toHaveLength(0);
    });
  });
});