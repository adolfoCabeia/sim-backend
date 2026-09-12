import type { TipoProcessoGenerico, OrigemProcessoGenerico } from "../generated/prisma/client.js";
export interface DocumentoExigido {
    codigo: string;
    nome: string;
    obrigatorio: boolean;
}
export interface ServicoMunicipal {
    codigo: string;
    nome: string;
    descricao: string;
    tipoProcesso: TipoProcessoGenerico;
    direcaoResponsavelSigla: string;
    origensPermitidas: OrigemProcessoGenerico[];
    documentosExigidos: DocumentoExigido[];
    pago: boolean;
    valorReferenciaKz?: number;
    fonte: string;
}
export declare const CATALOGO_SERVICOS_MUNICIPAIS: ServicoMunicipal[];
export declare function obterServicoPorCodigo(codigo: string): ServicoMunicipal | undefined;
export declare function filtrarServicos(criterios: {
    origem?: OrigemProcessoGenerico;
    tipoProcesso?: TipoProcessoGenerico;
    direcaoResponsavelSigla?: string;
    pago?: boolean;
}): ServicoMunicipal[];
export declare function listarServicosPorOrigem(origem: OrigemProcessoGenerico): ServicoMunicipal[];
export declare function listarServicosPorDirecao(direcaoResponsavelSigla: string): ServicoMunicipal[];
//# sourceMappingURL=catalogo-servicos.d.ts.map