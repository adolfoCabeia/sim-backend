import fp from "fastify-plugin";
import cron from "node-cron";
import type { FastifyInstance } from "fastify";
import { executarVerificacaoAlertasOperacionais } from "../../core/jobs/alertas-operacionais.service.js";
import { env } from "../../config/env.js";

export default fp(async function alertasOperacionaisScheduler(fastify: FastifyInstance) {
  const expressao = env.ALERTAS_OPERACIONAIS_CRON ?? "0 * * * *";

  if (env.ALERTAS_OPERACIONAIS_CRON_ACTIVO === false) {
    fastify.log.info("[scheduler] Verificação de alertas operacionais desactivada por configuração.");
    return;
  }

  if (!cron.validate(expressao)) {
    fastify.log.error(`[scheduler] Expressão cron inválida para ALERTAS_OPERACIONAIS_CRON: "${expressao}".`);
    return;
  }

  let emExecucao = false;

  const tarefa = cron.schedule(
    expressao,
    async () => {
      if (emExecucao) {
        fastify.log.warn("[scheduler] Verificação de alertas operacionais ainda em curso — execução seguinte ignorada.");
        return;
      }
      emExecucao = true;
      const inicio = Date.now();
      try {
        const resultado = await executarVerificacaoAlertasOperacionais();
        fastify.log.info(
          { ...resultado, duracaoMs: Date.now() - inicio },
          "[scheduler] Verificação de alertas operacionais concluída."
        );
        if (resultado.erros.length > 0) {
          fastify.log.warn({ erros: resultado.erros }, "[scheduler] Erros durante a verificação de alertas.");
        }
      } catch (erro) {
        fastify.log.error({ erro }, "[scheduler] Falha inesperada na verificação de alertas operacionais.");
      } finally {
        emExecucao = false;
      }
    }
  );

  fastify.log.info(`[scheduler] Verificação de alertas operacionais agendada com a expressão "${expressao}".`);

  fastify.addHook("onClose", (_instance, done) => {
    tarefa.stop();
    done();
  });
});