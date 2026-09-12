import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";

export const redisCleanupPlugin = fp(async (app: FastifyInstance) => {
  const redis = app.redis;
  const CLEANUP_INTERVAL = 60000; // 1 minuto
  const BATCH_SIZE = 100;

  async function cleanupExpiredKeys(): Promise<void> {
    try {
      let cursor = "0";
      let keysDeleted = 0;

      do {
        const [newCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          "*",
          "COUNT",
          BATCH_SIZE
        );

        cursor = newCursor;

        if (keys && keys.length > 0) {
          const pipeline = redis.pipeline();

          for (const key of keys) {
            const ttl = await redis.ttl(key);
            if (ttl === -2) {
              // Key does not exist (already expired)
              continue;
            }
            if (ttl > 0 && ttl < 60) {
              // Key expiring soon, no need to delete
              continue;
            }
          }

          // Apenas faz scan, a expiração é automática
        }
      } while (cursor !== "0");

      app.log.debug(`Redis cleanup completed, ${keysDeleted} keys checked`);
    } catch (err) {
      app.log.error({ err }, "Redis cleanup failed");
    }
  }

  // Inicia cleanup a cada CLEANUP_INTERVAL
  const cleanupInterval = setInterval(async () => {
    await cleanupExpiredKeys();
  }, CLEANUP_INTERVAL);

  app.addHook("onClose", async () => {
    clearInterval(cleanupInterval);
    app.log.info("Redis cleanup interval cleared");
  });
});
