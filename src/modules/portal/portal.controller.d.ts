import type { FastifyRequest, FastifyReply } from "fastify";
import type { CriarPedidoPortalInput, ListarMeusProcessosQuery, ListarServicosPortalQuery } from "./portal.schema.js";
export declare function listarServicosDisponiveisController(request: FastifyRequest<{
    Querystring: ListarServicosPortalQuery;
}>, reply: FastifyReply): Promise<never>;
/**
 * "Coloque tudo que cada um dos portais externos pode fazer" — manifesto
 * consolidado (serviços do catálogo já filtrados pela origem do utilizador +
 * módulos transversais: pagamentos, agendamentos, intercâmbios, credenciais).
 */
export declare function obterCapacidadesPortalController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function criarPedidoPortalController(request: FastifyRequest<{
    Body: CriarPedidoPortalInput;
}>, reply: FastifyReply): Promise<never>;
/** "Acompanhar processos (estado + timeline)". */
export declare function listarMeusProcessosController(request: FastifyRequest<{
    Querystring: ListarMeusProcessosQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function obterMeuProcessoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function obterDocumentoFinalController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=portal.controller.d.ts.map