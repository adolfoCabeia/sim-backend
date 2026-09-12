import type { Prisma } from "../../generated/prisma/client.js";
import type { ConfirmarPagamentoInput, CancelarPagamentoInput, AjustarValorPagamentoInput, ListarPagamentosQuery } from "./pagamento.schema.js";
export declare class PagamentoNaoEncontradoError extends Error {
}
export declare class PagamentoJaProcessadoError extends Error {
}
export declare class PagamentoNaoAutorizadoError extends Error {
}
export declare class PagamentoExpiradoError extends Error {
}
export declare function listarPagamentosDoProcesso(params: {
    municipioId: string;
    processoId: string;
    utilizadorSolicitanteId?: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    expiraEm: Date | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoPagamento;
    entidade: string;
    processoId: string;
    referencia: string;
    valor: Prisma.Decimal;
    criadoPorId: string | null;
    pagoEm: Date | null;
    metadadosConfirmacao: Prisma.JsonValue | null;
}[]>;
export declare function listarMeusPagamentos(params: {
    municipioId: string;
    utilizadorId: string;
    query: ListarPagamentosQuery;
}): Promise<{
    items: ({
        processo: {
            id: string;
            tipo: import("../../generated/prisma/index.js").$Enums.TipoProcessoGenerico;
            numero: string;
            assunto: string;
        };
    } & {
        id: string;
        criadoEm: Date;
        alteradoEm: Date;
        expiraEm: Date | null;
        municipioId: string;
        estado: import("../../generated/prisma/index.js").$Enums.EstadoPagamento;
        entidade: string;
        processoId: string;
        referencia: string;
        valor: Prisma.Decimal;
        criadoPorId: string | null;
        pagoEm: Date | null;
        metadadosConfirmacao: Prisma.JsonValue | null;
    })[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
export declare function listarPagamentos(params: {
    municipioId: string;
    query: ListarPagamentosQuery;
}): Promise<{
    items: ({
        processo: {
            id: string;
            tipo: import("../../generated/prisma/index.js").$Enums.TipoProcessoGenerico;
            numero: string;
            assunto: string;
        };
    } & {
        id: string;
        criadoEm: Date;
        alteradoEm: Date;
        expiraEm: Date | null;
        municipioId: string;
        estado: import("../../generated/prisma/index.js").$Enums.EstadoPagamento;
        entidade: string;
        processoId: string;
        referencia: string;
        valor: Prisma.Decimal;
        criadoPorId: string | null;
        pagoEm: Date | null;
        metadadosConfirmacao: Prisma.JsonValue | null;
    })[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
export declare function confirmarPagamento(params: {
    municipioId: string;
    pagamentoId: string;
    executorId: string;
    input: ConfirmarPagamentoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    expiraEm: Date | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoPagamento;
    entidade: string;
    processoId: string;
    referencia: string;
    valor: Prisma.Decimal;
    criadoPorId: string | null;
    pagoEm: Date | null;
    metadadosConfirmacao: Prisma.JsonValue | null;
}>;
export declare function ajustarValorPagamento(params: {
    municipioId: string;
    pagamentoId: string;
    executorId: string;
    input: AjustarValorPagamentoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    expiraEm: Date | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoPagamento;
    entidade: string;
    processoId: string;
    referencia: string;
    valor: Prisma.Decimal;
    criadoPorId: string | null;
    pagoEm: Date | null;
    metadadosConfirmacao: Prisma.JsonValue | null;
}>;
export declare function cancelarPagamento(params: {
    municipioId: string;
    pagamentoId: string;
    executorId: string;
    input: CancelarPagamentoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    expiraEm: Date | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoPagamento;
    entidade: string;
    processoId: string;
    referencia: string;
    valor: Prisma.Decimal;
    criadoPorId: string | null;
    pagoEm: Date | null;
    metadadosConfirmacao: Prisma.JsonValue | null;
}>;
export declare function marcarPagamentosExpirados(params: {
    municipioId: string;
}): Promise<{
    actualizados: number;
}>;
//# sourceMappingURL=pagamento.service.d.ts.map