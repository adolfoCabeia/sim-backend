import fp from "fastify-plugin";
import { Redis } from "ioredis";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { env } from "../../config/env.js";
import { executarVerificacaoAlertasOperacionais } from "../../core/jobs/alertas-operacionais.service.js";

const NOME_FILA = "alertas-operacionais";
const NOME_JOB_REPETIVEL = "verificar-alertas-operacionais";

export const alertasOperacionaisWorkerPlugin = fp(async (app) => {
  const redisConnection = new Redis(env.REDIS_URL!, {
    maxRetriesPerRequest: null,
  });
  redisConnection.on("error", (err) => {
    app.log.error({ err }, "[AlertasOperacionais] Erro na ligação Redis do worker");
  });

  const connection = redisConnection as unknown as ConnectionOptions;

  const fila = new Queue(NOME_FILA, { connection });
  fila.on("error", (err) => {
    app.log.error({ err }, "[AlertasOperacionais] Erro na fila de alertas operacionais");
  });

  fila
    .add(
      NOME_JOB_REPETIVEL,
      {},
      {
        repeat: { pattern: "0 6 * * *", tz: "Africa/Luanda" }, // todos os dias às 06h00 em Angola
        jobId: NOME_JOB_REPETIVEL,
      }
    )
    .catch((err) => {
      app.log.error({ err }, "[AlertasOperacionais] Não foi possível agendar a verificação periódica");
    });

  const worker = new Worker(
    NOME_FILA,
    async () => {
      const resultado = await executarVerificacaoAlertasOperacionais();
      if (resultado.erros.length > 0) {
        app.log.error({ erros: resultado.erros }, "[AlertasOperacionais] Verificação concluída com erros parciais");
      }
      app.log.info(resultado, "[AlertasOperacionais] Verificação diária concluída");
      return resultado;
    },
    { connection }
  );

  worker.on("error", (err) => {
    app.log.error({ err }, "[AlertasOperacionais] Erro no worker de alertas operacionais");
  });

  worker.on("failed", (job, err) => {
    app.log.error({ err, jobId: job?.id }, "[AlertasOperacionais] Falha na verificação de alertas operacionais");
  });

  app.addHook("onClose", async () => {
    await worker.close();
    await fila.close();
    redisConnection.disconnect();
  });
});