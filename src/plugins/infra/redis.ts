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

  // Verificar conexão durante a inicialização
  try {
    await redis.ping();

    app.log.info("Ping do Redis realizado com sucesso");
  } catch (err) {
    app.log.error(
      { err },
      "Falha na conexão inicial com o Redis. O cliente continuará tentando reconectar."
    );
  }

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();

    app.log.info(
      "Conexão com o Redis encerrada corretamente"
    );
  });
});