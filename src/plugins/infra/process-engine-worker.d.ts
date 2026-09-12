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
export declare const processEngineWorkerPlugin: (app: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("node:http").IncomingMessage, import("node:http").ServerResponse<import("node:http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>) => Promise<void>;
//# sourceMappingURL=process-engine-worker.d.ts.map