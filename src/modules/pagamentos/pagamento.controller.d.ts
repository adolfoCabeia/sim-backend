import type { FastifyRequest, FastifyReply } from "fastify";
import type { ConfirmarPagamentoInput, CancelarPagamentoInput, AjustarValorPagamentoInput, ListarPagamentosQuery } from "./pagamento.schema.js";
export declare function listarPagamentosDoProcessoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarMeusPagamentosController(request: FastifyRequest<{
    Querystring: ListarPagamentosQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function listarPagamentosController(request: FastifyRequest<{
    Querystring: ListarPagamentosQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function confirmarPagamentoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: ConfirmarPagamentoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function ajustarValorPagamentoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: AjustarValorPagamentoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function cancelarPagamentoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: CancelarPagamentoInput;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=pagamento.controller.d.ts.map