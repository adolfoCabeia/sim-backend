import "dotenv/config";
import type { PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { Prisma } from "../generated/prisma/client.js";
import { env, isDevelopment } from "./env.js";
import { logger } from "./logger.js";

function buildPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
    query_timeout: 15_000,
    keepAlive: true,
  };
}

function onPoolError(origem: string) {
  return (err: Error) => {
    logger.error({ err, origem }, "Erro no pool de ligações PostgreSQL (pool 'error' event)");
  };
}

function onConnectionError(origem: string) {
  return (err: Error) => {
    logger.warn({ err, origem }, "Erro numa ligação PostgreSQL individual");
  };
}

const adapter = new PrismaPg(buildPoolConfig(env.DATABASE_URL), {
  onPoolError: onPoolError("prisma"),
  onConnectionError: onConnectionError("prisma"),
});

const authBypassAdapter = new PrismaPg(
  buildPoolConfig(env.SEED_DATABASE_URL ?? env.DATABASE_URL),
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
    : [{ level: "error", emit: "event" }],
});

export const prismaAuthBypass = new PrismaClient({
  adapter: authBypassAdapter,
  log: isDevelopment
    ? [{ level: "error", emit: "event" }]
    : [{ level: "error", emit: "event" }],
});

const DEFAULT_TX_OPTIONS = { maxWait: 8000, timeout: 10000 };

export async function withTenantTransaction<T>(
  municipioId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { timeout?: number; maxWait?: number }
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_municipio_id', ${municipioId}, true)`;
    return fn(tx);
  }, { ...DEFAULT_TX_OPTIONS, ...options });
}

const ERROS_TRANSITORIOS = [
  "connection terminated",
  "connection terminated unexpectedly",
  "connection reset",
  "econnreset",
  "etimedout",
  "timeout exceeded when trying to connect",
];

function isErroTransitorioDeLigacao(error: unknown): boolean {
  const mensagem = error instanceof Error ? error.message.toLowerCase() : "";
  return ERROS_TRANSITORIOS.some((padrao) => mensagem.includes(padrao));
}

export async function withTenantTransactionReadOnly<T>(
  municipioId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { timeout?: number; maxWait?: number }
): Promise<T> {
  try {
    return await withTenantTransaction(municipioId, fn, options);
  } catch (error) {
    if (!isErroTransitorioDeLigacao(error)) {
      throw error;
    }
    logger.warn(
      { err: error, municipioId },
      "Falha de ligação transitória numa transacção de leitura — a tentar novamente uma vez"
    );
    return withTenantTransaction(municipioId, fn, options);
  }
}

export async function readOnlyComRetry<T>(fn: () => Promise<T>, contexto: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isErroTransitorioDeLigacao(error)) {
      throw error;
    }
    logger.warn({ err: error, contexto }, "Falha de ligação transitória — a tentar novamente uma vez");
    return fn();
  }
}