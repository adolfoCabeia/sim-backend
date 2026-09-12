import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { logger } from "./config/logger.js";

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal(
    { err: error },
    "Uncaught exception — a encerrar o processo de forma controlada"
  );

  process.exit(1);
});

async function start() {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info(`Recebido ${signal}, encerrando aplicação...`);

    await app.close();

    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    app.log.info(`Servidor iniciado na porta ${env.PORT}`);
  } catch (error) {
    app.log.error(error);

    process.exit(1);
  }
}

start();