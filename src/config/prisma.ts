import "dotenv/config";
import type { PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client.js";
import { env, isDevelopment } from "./env.js";
import { logger } from "./logger.js";

// ACHADO DE AUDITORIA: `max` estava fixo em 5 (para o pool normal e,
// separadamente, mais 5 para o pool de bypass). Sob ~5 pedidos
// concorrentes (uma única página a carregar vários painéis), isto
// esgota-se e causa "Connection terminated due to connection timeout"
// e transacções interactivas a expirar (P2028) — reproduzido e
// confirmado com dados reais. Agora configurável via variável de
// ambiente, com um valor por omissão mais realista.
// ACHADO DE AUDITORIA: `ssl` estava sempre activo (necessário para o
// Render em produção), o que quebra a ligação a um Postgres local sem
// SSL (ex.: o container postgres:16-alpine do docker-compose para
// desenvolvimento) — "P1011: The server does not support SSL
// connections". Agora é condicional: por omissão, SSL só liga fora de
// desenvolvimento (produção/Render); pode ser forçado explicitamente
// com DATABASE_SSL=true/false em qualquer ambiente.
function buildPoolConfig(connectionString: string, max: number): PoolConfig {
  return {
    connectionString,

    // Render PostgreSQL exige SSL; Postgres local (Docker, dev) não o
    // suporta por omissão.
    ssl: (env.DATABASE_SSL ?? !isDevelopment)
      ? { rejectUnauthorized: false }
      : false,

    max,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
    query_timeout: 15_000,
    keepAlive: true,
  };
}

function onPoolError(origem: string) {
  return (err: Error) => {
    logger.error(
      { err, origem },
      "Erro no pool de ligações PostgreSQL (pool 'error' event)"
    );
  };
}

function onConnectionError(origem: string) {
  return (err: Error) => {
    logger.warn(
      { err, origem },
      "Erro numa ligação PostgreSQL individual"
    );
  };
}

const adapter = new PrismaPg(
  buildPoolConfig(env.DATABASE_URL, env.DATABASE_POOL_MAX),
  {
    onPoolError: onPoolError("prisma"),
    onConnectionError: onConnectionError("prisma"),
  }
);

const authBypassAdapter = new PrismaPg(
  buildPoolConfig(env.SEED_DATABASE_URL ?? env.DATABASE_URL, env.DATABASE_BYPASS_POOL_MAX),
  {
    onPoolError: onPoolError("prismaAuthBypass"),
    onConnectionError: onConnectionError("prismaAuthBypass"),
  }
);

export const prisma = new PrismaClient({
  adapter,
  log: isDevelopment
    ? [
        { level: "warn", emit: "event" },
        { level: "error", emit: "event" },
      ]
    : [
        { level: "error", emit: "event" },
      ],
});

export const prismaAuthBypass = new PrismaClient({
  adapter: authBypassAdapter,
  log: isDevelopment
    ? [
        { level: "error", emit: "event" },
      ]
    : [
        { level: "error", emit: "event" },
      ],
});

const DEFAULT_TX_OPTIONS = {
  maxWait: 8000,
  timeout: 10000,
};

export async function withTenantTransaction<T>(
  municipioId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    timeout?: number;
    maxWait?: number;
  }
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        SELECT set_config(
          'app.current_municipio_id',
          ${municipioId},
          true
        )
      `;

      // ACHADO DE AUDITORIA: existia aqui uma segunda query
      // (`contextoRls`, a reler current_setting logo a seguir a
      // defini-lo) cujo resultado nunca era lido em lado nenhum —
      // nem log, nem validação, nem devolvido. É uma ida-e-volta extra
      // à base de dados, em TODAS as transacções da aplicação inteira,
      // sem qualquer efeito. Removida. Se era usada para depuração
      // manual, o mais barato é confirmar via `SELECT
      // current_setting('app.current_municipio_id', true)` directamente
      // no psql, não dentro do caminho quente de produção.

      return fn(tx);
    },
    {
      ...DEFAULT_TX_OPTIONS,
      ...options,
    }
  );
}

export async function withAuthBypass<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    timeout?: number;
    maxWait?: number;
  }
): Promise<T> {
  return prismaAuthBypass.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.is_super_admin', 'true', true)`;
      return fn(tx);
    },
    {
      ...DEFAULT_TX_OPTIONS,
      ...options,
    }
  );
}

/**
 * Igual a `withTenantTransaction`, mas para leituras: aplica o mesmo
 * isolamento por município via `app.current_municipio_id`, e adicionalmente
 * usa `readOnlyComRetry` para tolerar falhas transitórias de ligação
 * (relevante sobretudo com planos "hibernate" do Render).
 *
 * Não usar para escritas — o retry re-executa a função inteira do zero
 * em caso de falha transitória, o que só é seguro para operações
 * idempotentes como leituras.
 */
export async function withTenantTransactionReadOnly<T>(
  municipioId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    timeout?: number;
    maxWait?: number;
  }
): Promise<T> {
  return readOnlyComRetry(
    () => withTenantTransaction(municipioId, fn, options),
    `withTenantTransactionReadOnly(municipioId=${municipioId})`
  );
}

const CODIGOS_PRISMA_RETENTAVEIS = new Set([
  "P1001", // Não conseguiu alcançar o servidor da base de dados
  "P1002", // O servidor foi alcançado mas expirou o tempo de ligação
  "P1008", // A operação expirou o tempo (timeout)
  "P1017", // O servidor fechou a ligação
]);

const CODIGOS_REDE_RETENTAVEIS = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
]);

function isErroTransitorio(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CODIGOS_PRISMA_RETENTAVEIS.has(error.code);
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const codigo = (error as { code?: unknown }).code;
    if (typeof codigo === "string" && CODIGOS_REDE_RETENTAVEIS.has(codigo)) {
      return true;
    }
  }
  return false;
}

/**
 * Corre `fn` (tipicamente uma leitura) com retry e backoff exponencial
 * quando o erro é uma falha transitória de ligação à base de dados —
 * relevante sobretudo em planos "hibernate" do Render, onde a
 * instância de Postgres pode demorar alguns segundos a acordar após
 * ficar inactiva, causando falhas de ligação na primeira tentativa.
 *
 * NÃO faz retry em erros de negócio/validação (ex: credenciais
 * inválidas) — só em falhas de infraestrutura reconhecidas.
 */
export async function readOnlyComRetry<T>(
  fn: () => Promise<T>,
  label: string,
  options?: { tentativas?: number; atrasoBaseMs?: number }
): Promise<T> {
  const tentativas = options?.tentativas ?? 3;
  const atrasoBaseMs = options?.atrasoBaseMs ?? 200;

  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      return await fn();
    } catch (error) {
      ultimoErro = error;

      if (!isErroTransitorio(error) || tentativa === tentativas) {
        throw error;
      }

      const atrasoMs = atrasoBaseMs * 2 ** (tentativa - 1);
      logger.warn(
        { err: error, label, tentativa, tentativas, atrasoMs },
        "Erro transitório de ligação à base de dados, a tentar novamente"
      );
      await new Promise((resolve) => setTimeout(resolve, atrasoMs));
    }
  }

  // Inatingível: o loop acima sempre retorna ou lança antes de sair.
  throw ultimoErro;
}