import type { FastifyInstance } from "fastify";
import type { AccessTokenPayload } from "../../modules/auth/jwt.service.js";
declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: AccessTokenPayload;
        user: AccessTokenPayload;
    }
}
export declare const jwtPlugin: (fastify: FastifyInstance) => Promise<void>;
//# sourceMappingURL=jwt.d.ts.map