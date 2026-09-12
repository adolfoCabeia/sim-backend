import type { FastifyRequest, FastifyReply } from "fastify";
export declare function requirePermission(permissaoChave: string): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
export declare function requireAnyPermission(...permissoesChave: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=hasPermission.d.ts.map