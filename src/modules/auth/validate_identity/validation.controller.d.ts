import type { FastifyRequest, FastifyReply } from "fastify";
import type { AprovarPedidoInput, RejeitarPedidoInput } from "./validation.schema.js";
export declare function submeterDocumentoController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function listarPedidosPendentesController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function obterPedidoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function obterUrlDocumentoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function solicitarCorrecaoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: RejeitarPedidoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function rejeitarDefinitivamenteController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: RejeitarPedidoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function aprovarNivel1Controller(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: AprovarPedidoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function aprovarNivel2Controller(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: AprovarPedidoInput;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=validation.controller.d.ts.map