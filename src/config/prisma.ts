import "dotenv/config";
import type { PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client.js";
import { env, isDevelopment } from "./env.js";
import { logger } from "./logger.js";

function buildPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,

    // Render PostgreSQL exige SSL.
    // rejectUnauthorized=false é necessário porque
    // estamos a usar a CA fornecida pelo serviço sem
    // configurar uma CA local explicitamente.
    ssl: {
      rejectUnauthorized: false,
    },

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
  buildPoolConfig(env.DATABASE_URL),
  {
    onPoolError: onPoolError("prisma"),
    onConnectionError: onConnectionError("prisma"),
  }
);

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

      return fn(tx);
    },
    {
      ...DEFAULT_TX_OPTIONS,
      ...options,
    }
  );
}

/**
 * Corre `fn` dentro de uma transação com `app.is_super_admin` definido
 * a 'true' via set_config(..., true) — escopo LOCAL, válido só dentro
 * desta transação, nunca "vaza" para outras queries na mesma ligação
 * do pool.
 *
 * É o "bypass" real de RLS para os fluxos de autenticação (login,
 * registo, confirmação de email, recovery de password). Não depende
 * de BYPASSRLS nem de ownership da tabela porque `utilizadores` tem
 * FORCE ROW LEVEL SECURITY activo — nem o dono da tabela escapa às
 * policies sem isto.
 *
 * IMPORTANTE: só deve ser usado nos pontos onde a query genuinamente
 * precisa de ignorar o isolamento por município (ex: encontrar um
 * utilizador pelo email antes de sabermos o município dele). Nunca
 * use isto para listagens gerais de utilizadores — aí deve usar
 * withTenantTransaction.
 */
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
        "Erro transitório de ligação à base de dados — a tentar novamente"
      );
      await new Promise((resolve) => setTimeout(resolve, atrasoMs));
    }
  }

  // Inatingível: o loop acima sempre retorna ou lança antes de sair.
  throw ultimoErro;
}