import type { Prisma, TipoProcessoGenerico, OrigemProcessoGenerico } from "../../generated/prisma/client.js";
import { EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import { type DocumentoExigido } from "../../config/catalogo-servicos.js";
export declare class ProcessoGenericoNaoEncontradoError extends Error {
}
export declare class TransicaoGenericaInvalidaError extends Error {
}
export declare class ProcessoJaArquivadoError extends Error {
}
export declare class ProcessoNaoConcluidoError extends Error {
}
export declare class DespachoFinalNaoAutorizadoError extends Error {
}
export declare class AreaForaDaDelegacaoError extends Error {
}
export declare class AtribuicaoInvalidaError extends Error {
}
export declare class PagamentoPendenteError extends Error {
}
export declare class ServicoNaoEncontradoError extends Error {
}
export declare class ServicoIncompativelError extends Error {
}
export declare class DocumentacaoIncompletaError extends Error {
}
export declare class AnexoNaoAutorizadoError extends Error {
}
export declare class CircuitoTransicaoInvalidaError extends Error {
}
export declare class DespachoRoteamentoNaoAutorizadoError extends Error {
}
export declare class ExpedicaoNaoAutorizadaError extends Error {
}
export declare class DirecaoNaoEncontradaError extends Error {
}
export declare class DocumentoSaidaForaDeContextoError extends Error {
}
export declare class DocumentoSaidaObrigatorioError extends Error {
}
export declare function documentosEmFalta(tx: Prisma.TransactionClient, processoId: string, servicoCodigo: string): Promise<DocumentoExigido[]>;
export declare function criarProcesso(params: {
    municipioId: string;
    tipo: TipoProcessoGenerico;
    origem: OrigemProcessoGenerico;
    assunto: string;
    requerenteUtilizadorId?: string;
    direcaoOrigemId?: string;
    responsavelActualId?: string;
    servicoCodigo?: string;
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
export declare function apresentarAoAdministrador(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    observacao?: string;
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
export declare function despacharParaDireccao(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    direcaoDespachadaSigla: string;
    observacao?: string;
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
export declare function despacharParaAssessorJuridico(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    assessorUtilizadorId: string;
    observacao?: string;
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
export declare function expedirParaDireccao(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    observacao?: string;
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
export declare function subirResposta(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    viaExpediente: boolean;
    observacao?: string;
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
export declare function prepararSaida(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    observacao?: string;
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
export declare function submeterParaDespachoSaida(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    observacao?: string;
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
export declare function despacharSaida(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    autorizar: boolean;
    observacao?: string;
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
export declare function formalizarEnvioExterno(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    destinoExterno: string;
    observacao?: string;
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
export declare function transicionar(params: {
    municipioId: string;
    processoId: string;
    novoEstado: EstadoProcessoGenerico;
    executorId: string;
    observacao?: string;
    visivelAoCidadao?: boolean;
    novoResponsavelActualId?: string;
    novaDirecaoAtualId?: string;
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
export declare function atribuirResponsavel(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
    novoResponsavelActualId: string;
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
export declare function obterTimelineCidadao(params: {
    municipioId: string;
    processoId: string;
    utilizadorId: string;
}): Promise<{
    timeline: {
        id: string;
        criadoEm: Date;
        estadoAnterior: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico | null;
        estadoNovo: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico;
        observacao: string | null;
    }[];
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
export declare function obterProcessoInterno(params: {
    municipioId: string;
    processoId: string;
    executorId: string;
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
    transicoes: {
        utilizador: {
            id: string;
            nomeCompleto: string;
        } | null;
        id: string;
        criadoEm: Date;
        estadoAnterior: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico | null;
        estadoNovo: import("../../generated/prisma/index.js").$Enums.EstadoProcessoGenerico;
        observacao: string | null;
        visivelAoCidadao: boolean;
    }[];
    anexos: {
        id: string;
        criadoEm: Date;
        nomeFicheiro: string;
        versao: number;
        utilizadorUpload: {
            id: string;
            nomeCompleto: string;
        } | null;
    }[];
}>;
export declare function adicionarAnexo(params: {
    municipioId: string;
    processoId: string;
    nomeFicheiro: string;
    storageKey: string;
    utilizadorUploadId: string;
    tipoDocumentoCodigo?: string;
    exigirRequerente?: boolean;
    tipoAnexo?: "ENTRADA" | "SAIDA";
    origemInterna?: boolean;
}): Promise<{
    id: string;
    criadoEm: Date;
    storageKey: string;
    processoId: string;
    nomeFicheiro: string;
    versao: number;
    tipoDocumentoCodigo: string | null;
    tipoAnexo: import("../../generated/prisma/index.js").$Enums.TipoAnexoProcesso;
    utilizadorUploadId: string | null;
}>;
export declare function moverParaArquivoDigital(params: {
    municipioId: string;
    processoId: string;
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
export declare function moverParaArquivoMorto(params: {
    municipioId: string;
    processoId: string;
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
export declare function listarDocumentosEmFalta(params: {
    municipioId: string;
    processoId: string;
}): Promise<DocumentoExigido[]>;
export declare function listarProcessos(params: {
    municipioId: string;
    executorId: string;
    tipo?: TipoProcessoGenerico;
    estado?: EstadoProcessoGenerico;
    origem?: OrigemProcessoGenerico;
    departamentoId?: string;
    atribuidosAMim?: boolean;
    page: number;
    pageSize: number;
}): Promise<{
    items: {
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
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
//# sourceMappingURL=process-engine.service.d.ts.map