import fp from "fastify-plugin";

export const loggerPlugin = fp(async (app) => {
  const startTimes = new Map<string, [number, number]>();

  app.addHook("onRequest", async (req) => {
    startTimes.set(req.id, process.hrtime());
  });

  app.addHook("onResponse", async (req, reply) => {
    const start = startTimes.get(req.id);
    startTimes.delete(req.id);

    const diff = start ? process.hrtime(start) : ([0, 0] as [number, number]);
    const responseTime = diff[0] * 1000 + diff[1] / 1e6;

    app.log.info({
      reqId: req.id,
      method: req.method,
      url: req.url,
      statusCode: reply.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
    });
  });
});