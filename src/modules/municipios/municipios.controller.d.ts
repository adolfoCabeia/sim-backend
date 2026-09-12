import type { FastifyRequest, FastifyReply } from "fastify";
import type { CriarMunicipioInput } from "./municipios.schema.js";
export declare function listarMunicipiosController(_request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function listarDirecoesDoMunicipioController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function criarMunicipioController(request: FastifyRequest<{
    Body: CriarMunicipioInput;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=municipios.controller.d.ts.map