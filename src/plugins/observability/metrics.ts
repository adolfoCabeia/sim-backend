import fp from "fastify-plugin";
import client from "prom-client";

export const metricsPlugin = fp(async (app) => {
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics();

  app.get("/metrics", async (_, reply) => {
    reply.type("text/plain");
    return client.register.metrics();
  });
});