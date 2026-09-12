import type { FastifyRequest, FastifyReply } from "fastify";
import type { ListarNotificacoesQuery } from "./notificacao.schema.js";
export declare function listarMinhasNotificacoesController(request: FastifyRequest<{
    Querystring: ListarNotificacoesQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function contarNaoLidasController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function marcarComoLidaController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function marcarTodasComoLidasController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=notificacao.controller.d.ts.map