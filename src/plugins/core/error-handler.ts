import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";

export const errorHandlerPlugin = fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    app.log.error({
      err: error,
      reqId: request.id,
      path: request.url,
    });

    const status = error.statusCode ?? 500;

    reply.status(status).send({
      error: "internal_error",
      message: status === 500 ? "Internal server error" : error.message,
      requestId: request.id,
    });
  });
});