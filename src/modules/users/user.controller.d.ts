import type { FastifyRequest, FastifyReply } from "fastify";
import type { ListarUtilizadoresQuery, CriarUtilizadorInput, EditarUtilizadorInput, EditarMeuPerfilInput, AlterarEstadoInput, ChangePasswordInput, AtribuirPerfilInput } from "./user.schema.js";
export declare function listarUtilizadoresController(request: FastifyRequest<{
    Querystring: ListarUtilizadoresQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function obterUtilizadorController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function criarUtilizadorController(request: FastifyRequest<{
    Body: CriarUtilizadorInput;
}>, reply: FastifyReply): Promise<never>;
export declare function editarUtilizadorController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: EditarUtilizadorInput;
}>, reply: FastifyReply): Promise<never>;
export declare function alterarEstadoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: AlterarEstadoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function desactivarUtilizadorController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function obterMeuPerfilController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function editarMeuPerfilController(request: FastifyRequest<{
    Body: EditarMeuPerfilInput;
}>, reply: FastifyReply): Promise<never>;
export declare function changePasswordController(request: FastifyRequest<{
    Body: ChangePasswordInput;
}>, reply: FastifyReply): Promise<never>;
/**
 * "o Administrador municipal ou o RH podem redefinir a conta dele para uma
 * senha default ou temporária que vai obriga-lo a alterar a senha no
 * primeiro login" — a password temporária é devolvida uma única vez, aqui,
 * a quem executou a acção (e também enviada por email ao funcionário).
 */
export declare function redefinirPasswordController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarPerfisDoUtilizadorController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function atribuirPerfilController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: AtribuirPerfilInput;
}>, reply: FastifyReply): Promise<never>;
export declare function revogarPerfilController(request: FastifyRequest<{
    Params: {
        id: string;
        perfilId: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarPerfisDisponiveisController(_request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function listarPermissoesDisponiveisController(_request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=user.controller.d.ts.map