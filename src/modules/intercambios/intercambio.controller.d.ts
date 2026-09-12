import type { FastifyRequest, FastifyReply } from "fastify";
import type { EnviarIntercambioInput, ListarIntercambiosQuery } from "./intercambio.schema.js";
export declare function enviarIntercambioController(request: FastifyRequest<{
    Body: EnviarIntercambioInput;
}>, reply: FastifyReply): Promise<never>;
export declare function listarIntercambiosController(request: FastifyRequest<{
    Querystring: ListarIntercambiosQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function confirmarRecepcaoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=intercambio.controller.d.ts.map