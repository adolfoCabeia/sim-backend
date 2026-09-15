import fp from "fastify-plugin";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";

declare global {
  namespace NodeJS {
    interface Global {
      redisErrorCount: number;
    }
  }
}

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

export const redisPlugin = fp(async (app) => {
  const redis = new Redis(env.REDIS_URL!, {
    connectTimeout: 10_000,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, RECONNECT_DELAY);

      if (times > MAX_RECONNECT_ATTEMPTS) {
        app.log.error(
          "Número máximo de tentativas de reconexão com o Redis excedido"
        );

        return null;
      }

      app.log.warn(
        `Tentativa de reconexão com o Redis: ${times}. Nova tentativa em ${delay}ms`
      );

      return delay;
    },

    enableReadyCheck: false,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,

    reconnectOnError: (err) => {
      const targetError = "READONLY";

      if (err.message.includes(targetError)) {
        app.log.warn(
          "Redis retornou erro READONLY. Tentando estabelecer uma nova conexão..."
        );

        return true;
      }

      return false;
    },
  });

  redis.on("error", (err) => {
    app.log.error(
      { err },
      "Erro na conexão com o Redis"
    );
  });

  redis.on("connect", () => {
    app.log.info("Conexão com o Redis estabelecida");
  });

  redis.on("reconnecting", () => {
    app.log.info("Tentando reconectar ao Redis...");
  });

  redis.on("close", () => {
    app.log.warn("Conexão com o Redis encerrada");
  });

  // ACHADO: bloquear o registo do plugin com `await redis.ping()` competia
  // pelo mesmo orçamento de tempo do `pluginTimeout` do Fastify (10s por
  // omissão) contra todo o trabalho síncrono de arranque (~50 plugins/
  // rotas). Em máquinas mais lentas (Windows, `tsx watch`, primeira
  // execução) isso é suficiente para estourar o timeout mesmo com o
  // Redis a responder bem — reportado com o erro
  // "Plugin did not start in time: 'redis-auto-N'". Como
  // `enableOfflineQueue: true` já permite à app usar `app.redis` antes
  // da ligação estar pronta (os comandos ficam em fila), o registo do
  // plugin não precisa de esperar pelo ping: decora-se logo, e a
  // verificação de conectividade corre em paralelo, sem bloquear.
  redis
    .ping()
    .then(() => {
      app.log.info("Ping do Redis realizado com sucesso");
    })
    .catch((err) => {
      app.log.error(
        { err },
        "Falha na conexão inicial com o Redis. O cliente continuará tentando reconectar."
      );
    });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();

    app.log.info(
      "Conexão com o Redis encerrada corretamente"
    );
  });
});