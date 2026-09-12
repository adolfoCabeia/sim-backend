import type { FastifyRequest, FastifyReply } from "fastify";
import type { CriarContactoInput, EditarContactoInput, ListarContactosQuery, ListarContactosPublicoQuery } from "./contacto.schema.js";
export declare function criarContactoController(request: FastifyRequest<{
    Body: CriarContactoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function editarContactoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: EditarContactoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function eliminarContactoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarContactosAdminController(request: FastifyRequest<{
    Querystring: ListarContactosQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function listarContactosPublicoController(request: FastifyRequest<{
    Querystring: ListarContactosPublicoQuery;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=contacto.controller.d.ts.map