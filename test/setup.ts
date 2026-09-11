/**
 * Harness de testes de integração — usa uma Postgres REAL (via
 * `@electric-sql/pglite`, Postgres 17 compilado para WASM) com as
 * migrações reais do projecto aplicadas, para testar a RLS a sério, não
 * simulada.
 *
 * PORQUÊ NÃO PRISMA CLIENT: este ambiente não tem acesso de rede aos
 * binários que `prisma generate`/`migrate` descarregam
 * (binaries.prisma.sh) — por isso estes testes correm SQL em bruto
 * directamente. Em CI/local com rede completa, o mesmo padrão pode ser
 * adaptado para usar `@prisma/adapter-pg` apontado a este mesmo pglite.
 *
 * NOTA IMPORTANTE sobre RLS + superutilizador: o Postgres NUNCA aplica
 * RLS ao superutilizador, mesmo com `FORCE ROW LEVEL SECURITY` — é
 * comportamento standard, não um bug. Por isso todo o SQL de setup
 * (aplicar migrações, inserir dados de fixture) corre como
 * superutilizador, e os testes que verificam isolamento fazem sempre
 * `SET ROLE app_user` antes de correr as queries que devem ser filtradas
 * pela RLS.
 *
 * GAPS DE MIGRAÇÃO CONHECIDOS (não introduzidos por este trabalho): as
 * tabelas `Funcionario` e `Ocorrencia` não têm nenhum `CREATE TABLE` nas
 * migrações do projecto (foram criadas via `prisma db push` nalgum
 * momento anterior, nunca via `migrate dev`) — os stubs abaixo existem
 * só para desbloquear as FKs que apontam para elas nas migrações mais
 * recentes. Ver aviso dado ao utilizador na conversa para o corrigir a
 * sério (`prisma migrate diff --from-empty`).
 */

import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

const STUB_FUNCIONARIO = `
  CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'stub',
    "estado" TEXT NOT NULL DEFAULT 'ATIVO',
    "tipoVinculo" TEXT NOT NULL DEFAULT 'QUADRO',
    "departamentoId" TEXT,
    "ultimaNotificacaoFimVinculoEm" TIMESTAMP(3)
  );
`;

const STUB_OCORRENCIA = `
  CREATE TABLE "Ocorrencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL UNIQUE,
    "municipioId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "bairroZona" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'REGISTADA',
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export interface TestDb {
  db: PGlite;
  /** Corre SQL como app_user (não-superutilizador), com um município já definido no contexto RLS. */
  queryComoMunicipio: <T = Record<string, unknown>>(municipioId: string, sql: string, params?: unknown[]) => Promise<T[]>;
  /** Corre SQL como app_user, sem nenhum município definido (deve devolver sempre 0 linhas em tabelas com RLS). */
  queryComoMunicipioIndefinido: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
  /** Corre SQL como superutilizador (setup/fixtures apenas — nunca para testar isolamento). */
  queryComoSuperuser: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
  fechar: () => Promise<void>;
}

export async function criarTestDb(): Promise<TestDb> {
  const db = await PGlite.create();

  await db.exec(STUB_FUNCIONARIO);
  await db.exec(STUB_OCORRENCIA);

  const pastas = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const pasta of pastas) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, pasta, "migration.sql"), "utf8");
    await db.exec(sql);
  }

  // Role não-superutilizador — é o que faz a RLS ser efectivamente
  // aplicada (superutilizador ignora sempre RLS, mesmo com FORCE).
  await db.exec(`CREATE ROLE app_user LOGIN NOSUPERUSER`);
  const tabelas = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  for (const { tablename } of tabelas.rows) {
    await db.exec(`GRANT ALL ON "${tablename}" TO app_user`);
  }
  const sequencias = await db.query<{ sequence_name: string }>(
    `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'`
  );
  for (const { sequence_name } of sequencias.rows) {
    await db.exec(`GRANT ALL ON SEQUENCE "${sequence_name}" TO app_user`);
  }

  async function queryComoMunicipio<T>(municipioId: string, sql: string, params: unknown[] = []): Promise<T[]> {
    await db.exec(`SET ROLE app_user`);
    try {
      await db.query(`SELECT set_config('app.current_municipio_id', $1, false)`, [municipioId]);
      const resultado = await db.query<T>(sql, params);
      return resultado.rows;
    } finally {
      await db.exec(`RESET app.current_municipio_id`);
      await db.exec(`RESET ROLE`);
    }
  }

  async function queryComoMunicipioIndefinido<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    await db.exec(`SET ROLE app_user`);
    try {
      const resultado = await db.query<T>(sql, params);
      return resultado.rows;
    } finally {
      await db.exec(`RESET ROLE`);
    }
  }

  async function queryComoSuperuser<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const resultado = await db.query<T>(sql, params);
    return resultado.rows;
  }

  return {
    db,
    queryComoMunicipio,
    queryComoMunicipioIndefinido,
    queryComoSuperuser,
    fechar: () => db.close(),
  };
}