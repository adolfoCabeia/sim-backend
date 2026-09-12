import fp from "fastify-plugin";
import { Queue, type ConnectionOptions } from "bullmq";

export const bullPlugin = fp(async (app) => {
  const connection: ConnectionOptions = app.redis;

  const queue = new Queue("default", {
    connection,
  });

  app.decorate("queue", queue);
});