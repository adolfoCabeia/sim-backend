import type { FastifyRequest, FastifyReply } from "fastify";
import type { ZodType } from "zod";
export declare function validateQuery(schema: ZodType): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=validateQuery.d.ts.map