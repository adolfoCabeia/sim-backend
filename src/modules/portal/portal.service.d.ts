import type { OrigemProcessoGenerico } from "../../generated/prisma/client.js";
import type { CriarPedidoPortalInput, ListarMeusProcessosQuery, ListarServicosPortalQuery } from "./portal.schema.js";
export declare class ProcessoNaoEncontradoError extends Error {
}
export declare class DocumentoNaoDisponivelError extends Error {
}
export declare class OrigemNaoPermitidaError extends Error {
}
export declare function origemParaTipoConta(tipoConta: string): OrigemProcessoGenerico;
export declare function listarServicosDisponiveis(params: {
    tipoConta: string;
    query?: ListarServicosPortalQuery;
}): Promise<import("../../config/catalogo-servicos.js").ServicoMunicipal[]>;
export declare function obterCapacidadesPortal(params: {
    tipoConta: string;
}): Promise<{
    portal: string;
    origem: import("../../generated/prisma/index.js").$Enums.OrigemProcessoGenerico;
    autenticacao: string;
    servicosDisponiveis: {
        codigo: string;
        nome: string;
        tipoProcesso: import("../../generated/prisma/index.js").$Enums.TipoProcessoGenerico;
        pago: boolean;
        valorReferenciaKz: number | undefined;
    }[];
    modulosTransversais: {
        registoDeOcorrencias?: string;
        comunicacaoDirectaComAdministracao?: string;
        intercambioDeDocumentos?: string;
        solicitacaoDeCredenciais?: string;
        directorioInstitucional?: string;
        sugestoes?: string;
        doacoes?: string;
        solicitarServicosDocumentos: string;
        acompanharProcessos: string;
        obterDocumentoFinal: string;
        pagarTaxas: string;
        marcarAudiencia: string;
        reclamacoesEDenuncias: string;
    };
}>;
export declare function criarPedidoPortal(params: {
    municipioId: string;
    utilizadorId: string;
    tipoConta: string;
    input: CriarPedidoPortalInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoProcessoGenerico;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico;
    numero: string;
    origem: import("../../generated/prisma/index.js").$Enums.OrigemProcessoGenerico;
    assunto: string;
    requerenteUtilizadorId: string | null;
    direcaoOrigemId: string | null;
    direcaoAtualId: string | null;
    direcaoDespachadaId: string | null;
    responsavelActualId: string | null;
    resultado: string | null;
    localizacaoActual: import("../../generated/prisma/index.js").$Enums.LocalizacaoProcesso;
    prazoLegalResposta: Date | null;
    diasAlertaAntesPrazo: number;
    alertaEnviadoEm: Date | null;
    escaladoEm: Date | null;
    arquivoDigitalEm: Date | null;
    arquivoMortoEm: Date | null;
    aguardaPagamento: boolean;
    servicoCodigo: string | null;
}>;
export declare function listarMeusProcessos(params: {
    municipioId: string;
    utilizadorId: string;
    query: ListarMeusProcessosQuery;
}): Promise<{
    items: {
        id: string;
        criadoEm: Date;
        alteradoEm: Date;
        tipo: import("../../generated/prisma/index.js").$Enums.TipoProcessoGenerico;
        estado: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico;
        numero: string;
        assunto: string;
        resultado: string | null;
        aguardaPagamento: boolean;
        servicoCodigo: string | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
export declare function obterMeuProcesso(params: {
    municipioId: string;
    utilizadorId: string;
    processoId: string;
}): Promise<{
    pagamentos: {
        id: string;
        expiraEm: Date | null;
        estado: import("../../generated/prisma/index.js").$Enums.EstadoPagamento;
        entidade: string;
        referencia: string;
        valor: import("@prisma/client-runtime-utils").Decimal;
        pagoEm: Date | null;
    }[];
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoProcessoGenerico;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico;
    numero: string;
    assunto: string;
    resultado: string | null;
    aguardaPagamento: boolean;
    servicoCodigo: string | null;
    transicoes: {
        id: string;
        criadoEm: Date;
        estadoAnterior: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico | null;
        estadoNovo: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico;
        observacao: string | null;
    }[];
    anexos: {
        id: string;
        criadoEm: Date;
        nomeFicheiro: string;
        versao: number;
        tipoDocumentoCodigo: string | null;
        utilizadorUploadId: string | null;
    }[];
}>;
export declare function obterDocumentoFinal(params: {
    municipioId: string;
    utilizadorId: string;
    processoId: string;
}): Promise<{
    nomeFicheiro: string;
    url: string;
    expiraEmSegundos: number;
}>;
//# sourceMappingURL=portal.service.d.ts.map