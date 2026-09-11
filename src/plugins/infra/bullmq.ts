import fp from "fastify-plugin";
import { Queue, type ConnectionOptions } from "bullmq";

export const bullPlugin = fp(async (app) => {
  const connection = app.redis as unknown as ConnectionOptions;

  const queue = new Queue("default", { connection });

  app.decorate("queue", queue);
});