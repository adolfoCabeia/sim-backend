import type { FastifyRequest, FastifyReply } from "fastify";
import type { ZodType } from "zod";
export declare function validateBody(schema: ZodType): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=validate.d.ts.map