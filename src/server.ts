import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { logger } from "./config/logger.js";

/**
 * Rede de segurança de último recurso.
 *
 * A causa principal dos crashes (erros não tratados do pool PostgreSQL) foi
 * corrigida em src/config/prisma.ts (onPoolError/onConnectionError). Isto
 * aqui é uma segunda linha de defesa para QUALQUER outro erro assíncrono
 * que escape ao ciclo de vida normal de um pedido Fastify (ex.: erro num
 * timer, num listener de socket.io, numa promise de um job BullMQ sem
 * .catch()).
 *
 * Antes: o processo morria em silêncio — sem log estruturado, sem alerta,
 * apenas um stack trace cru no stdout — e arrastava consigo TODOS os
 * pedidos em curso, não só o que originou o problema.
 *
 * Agora: registamos o erro no logger estruturado (para aparecer em
 * observabilidade/alertas) e, para uncaughtException, terminamos de forma
 * controlada — o estado do processo já não é fiável nesse ponto (ver
 * https://nodejs.org/api/process.html#warning-using-uncaughtexception-correctly).
 * Um gestor de processos (systemd, PM2, Docker restart policy) deve
 * reiniciar o serviço. unhandledRejection é registado sem matar o processo,
 * já que normalmente corresponde a uma única operação falhada e não a
 * corrupção de estado global.
 */
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception — a encerrar o processo de forma controlada");
  process.exit(1);
});

async function start() {

  const app = await buildApp();


  const shutdown = async (signal: string) => {

    app.log.info(
      `Recebido ${signal}, encerrando aplicação...`
    );

    await app.close();

    process.exit(0);

  };


  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("SIGTERM", () => shutdown("SIGTERM"));


  try {

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0"
    });


    app.log.info(
      `Servidor iniciado em http://localhost:${env.PORT}`
    );

  } catch (error) {

    app.log.error(error);

    process.exit(1);

  }

}


start();