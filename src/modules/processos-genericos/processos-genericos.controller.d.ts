import type { FastifyRequest, FastifyReply } from "fastify";
import type { CriarProcessoInput, TransicionarProcessoInput, ListarProcessosGenericosQuery, AtribuirResponsavelInput, ApresentarAdministradorInput, DespacharEncaminhamentoInput, DespacharAssessorJuridicoInput, ExpedirInput, SubirRespostaInput, PrepararSaidaInput, SubmeterDespachoSaidaInput, DespacharSaidaInput, FormalizarEnvioExternoInput } from "./processos-genericos.schema.js";
export declare function criarProcessoController(request: FastifyRequest<{
    Body: CriarProcessoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function transicionarProcessoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: TransicionarProcessoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function listarProcessosController(request: FastifyRequest<{
    Querystring: ListarProcessosGenericosQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function listarAtribuidosAMimController(request: FastifyRequest<{
    Querystring: Omit<ListarProcessosGenericosQuery, "atribuidosAMim">;
}>, reply: FastifyReply): Promise<never>;
export declare function obterProcessoInternoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function obterTimelineCidadaoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function arquivarDigitalController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function arquivarMortoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function atribuirResponsavelController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: AtribuirResponsavelInput;
}>, reply: FastifyReply): Promise<never>;
export declare function anexarDocumentoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarDocumentosEmFaltaController(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function listarServicosMunicipaisController(request: FastifyRequest<{
    Querystring: {
        origem?: string;
        tipo?: string;
        direcaoSigla?: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function apresentarAoAdministradorController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: ApresentarAdministradorInput;
}>, reply: FastifyReply): Promise<never>;
export declare function despacharParaDireccaoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: DespacharEncaminhamentoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function despacharParaAssessorJuridicoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: DespacharAssessorJuridicoInput;
}>, reply: FastifyReply): Promise<never>;
export declare function expedirParaDireccaoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: ExpedirInput;
}>, reply: FastifyReply): Promise<never>;
export declare function subirRespostaController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: SubirRespostaInput;
}>, reply: FastifyReply): Promise<never>;
export declare function prepararSaidaController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: PrepararSaidaInput;
}>, reply: FastifyReply): Promise<never>;
export declare function submeterParaDespachoSaidaController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: SubmeterDespachoSaidaInput;
}>, reply: FastifyReply): Promise<never>;
export declare function despacharSaidaController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: DespacharSaidaInput;
}>, reply: FastifyReply): Promise<never>;
export declare function formalizarEnvioExternoController(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: FormalizarEnvioExternoInput;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=processos-genericos.controller.d.ts.map