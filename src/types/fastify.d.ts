import type { FastifyRequest, FastifyReply } from "fastify";
import type { Redis } from "ioredis";
import type { Queue } from "bullmq";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    redis: Redis;
    queue: Queue;
  }

  interface FastifyRequest {
    tenant?: {
      municipioId: string;
    };
  }
}

export {};