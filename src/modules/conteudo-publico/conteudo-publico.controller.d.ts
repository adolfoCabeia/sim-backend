import type { FastifyRequest, FastifyReply } from "fastify";
import type { CriarConteudoPublicoInput, EditarConteudoPublicoInput, PublicarConteudoPublicoInput, ListarConteudosPublicosQuery, ListarConteudosPublicosPublicoQuery } from "./conteudo-publico.schema.js";
export declare function criarConteudoPublicoController(request: FastifyRequest<{
    Body: CriarConteudoPublicoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function editarConteudoPublicoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: EditarConteudoPublicoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function publicarConteudoPublicoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: PublicarConteudoPublicoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function despublicarConteudoPublicoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function eliminarConteudoPublicoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarConteudosPublicosAdminController(request: FastifyRequest<{
    Querystring: ListarConteudosPublicosQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function obterConteudoPublicoAdminController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarConteudosPublicosController(request: FastifyRequest<{
    Querystring: ListarConteudosPublicosPublicoQuery & {
        municipioId?: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function obterConteudoPublicoPorChaveController(request: FastifyRequest<{
    Params: {
        chave: string;
    };
    Querystring: {
        municipioId?: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarConteudosRestritosController(request: FastifyRequest<{
    Querystring: ListarConteudosPublicosPublicoQuery;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=conteudo-publico.controller.d.ts.map