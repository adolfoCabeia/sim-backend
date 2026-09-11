import fp from "fastify-plugin";
import { Redis } from "ioredis";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { env } from "../../config/env.js";
import { verificarSlasPendentes } from "../../core/process-engine/process-engine.sla.js";

const NOME_FILA = "process-engine-sla";
const NOME_JOB_REPETIVEL = "verificar-slas-pendentes";

/**
 * Job periódico que implementa a regra 6.3: alerta a 3 dias do vencimento
 * (configurável por tipo — ver sla.config.ts) + escalada ao superior
 * hierárquico. Corre 1x/hora — os prazos são em dias, não é preciso mais
 * frequência do que isso, e corre com folga para não sobrecarregar o
 * Redis/DB.
 *
 * Esta é a peça que faltava por completo no código original (secção 6.3):
 * não existia NENHUMA verificação de SLA nem alerta antes desta alteração.
 *
 * IMPORTANTE: `Worker` do BullMQ usa comandos bloqueantes (BRPOPLPUSH) e
 * por isso EXIGE uma ligação Redis dedicada com `maxRetriesPerRequest:
 * null` — reutilizar `app.redis` (a ligação partilhada, usada por outros
 * plugins) faz o BullMQ rejeitar a ligação no arranque com
 * "BullMQ: Your redis options maxRetriesPerRequest must be null.". Por
 * isso este plugin cria a sua própria ligação, só para o Worker/Queue
 * desta fila, em vez de usar `app.redis`.
 */
export const processEngineWorkerPlugin = fp(async (app) => {
  const redisConnection = new Redis(env.REDIS_URL!, {
    maxRetriesPerRequest: null,
  });
  redisConnection.on("error", (err) => {
    app.log.error({ err }, "[ProcessEngine] Erro na ligação Redis do worker de SLAs");
  });

  // Cast necessário: o bullmq embala a sua própria cópia de `ioredis` como
  // dependência interna, estruturalmente idêntica mas nominalmente
  // distinta da que o projecto usa directamente — o mesmo padrão já
  // existente em src/plugins/infra/bullmq.ts para `app.redis`.
  const connection = redisConnection as unknown as ConnectionOptions;

  const filaSla = new Queue(NOME_FILA, { connection });
  filaSla.on("error", (err) => {
    app.log.error({ err }, "[ProcessEngine] Erro na fila de verificação de SLAs");
  });

  // Não bloqueia o arranque do Fastify à espera do Redis: se o Redis
  // estiver em baixo/instável neste momento, a API continua a subir na
  // mesma — só o agendamento do job repetível fica pendente e é apenas
  // registado no log. (Antes disto era `await`, e uma falha aqui chegava
  // a estourar o timeout de arranque do plugin do avvio —
  // AVV_ERR_PLUGIN_EXEC_TIMEOUT — derrubando toda a aplicação.)
  filaSla
    .add(
      NOME_JOB_REPETIVEL,
      {},
      {
        repeat: { pattern: "0 * * * *" }, // todas as horas, ao minuto 0
        jobId: NOME_JOB_REPETIVEL, // evita duplicar o job repetível em restarts
      }
    )
    .catch((err) => {
      app.log.error({ err }, "[ProcessEngine] Não foi possível agendar a verificação periódica de SLAs");
    });

  const worker = new Worker(
    NOME_FILA,
    async () => {
      const resultado = await verificarSlasPendentes();
      app.log.info(resultado, "[ProcessEngine] Verificação de SLAs concluída");
      return resultado;
    },
    { connection }
  );

  worker.on("error", (err) => {
    app.log.error({ err }, "[ProcessEngine] Erro no worker de verificação de SLAs");
  });

  worker.on("failed", (job, err) => {
    app.log.error({ err, jobId: job?.id }, "[ProcessEngine] Falha na verificação de SLAs");
  });

  app.addHook("onClose", async () => {
    await worker.close();
    await filaSla.close();
    redisConnection.disconnect();
  });
});