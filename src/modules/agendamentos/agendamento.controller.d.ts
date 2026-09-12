import type { FastifyRequest, FastifyReply } from "fastify";
import type { CriarAgendamentoInput, ConfirmarAgendamentoInput, CancelarAgendamentoInput, ListarAgendamentosQuery } from "./agendamento.schema.js";
/** Cidadão/Empresa/Instituição marca uma audiência — evita filas presenciais. */
export declare function criarAgendamentoController(request: FastifyRequest<{
    Body: CriarAgendamentoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function confirmarAgendamentoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: ConfirmarAgendamentoInput;
}>, reply: FastifyReply): Promise<never>;
/** O próprio cidadão pode cancelar o seu agendamento; staff cancela qualquer um a que tenha acesso. */
export declare function cancelarAgendamentoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: CancelarAgendamentoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function marcarRealizadoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function marcarFaltaController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
/** O cidadão vê só os seus próprios agendamentos. */
export declare function listarMeusAgendamentosController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/** Staff vê a agenda toda (Administrador/Assistente Social). */
export declare function listarAgendamentosController(request: FastifyRequest<{
    Querystring: ListarAgendamentosQuery;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=agendamento.controller.d.ts.map