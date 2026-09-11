import fp from "fastify-plugin";
import { randomUUID } from "node:crypto";

export const requestIdPlugin = fp(async (app) => {
  app.addHook("onRequest", async (req) => {
    req.id = req.id || randomUUID();
  });
});