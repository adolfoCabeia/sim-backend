import type { ListarNotificacoesQuery } from "./notificacao.schema.js";
export declare class NotificacaoNaoEncontradaError extends Error {
}
export declare function listarMinhasNotificacoes(params: {
    utilizadorId: string;
    query: ListarNotificacoesQuery;
}): Promise<{
    items: {
        id: string;
        criadoEm: Date;
        utilizadorId: string;
        titulo: string;
        mensagem: string;
        lida: boolean;
        lidaEm: Date | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    naoLidas: number;
}>;
export declare function contarNaoLidas(params: {
    utilizadorId: string;
}): Promise<{
    naoLidas: number;
}>;
export declare function marcarComoLida(params: {
    utilizadorId: string;
    notificacaoId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    utilizadorId: string;
    titulo: string;
    mensagem: string;
    lida: boolean;
    lidaEm: Date | null;
}>;
export declare function marcarTodasComoLidas(params: {
    utilizadorId: string;
}): Promise<{
    actualizadas: number;
}>;
//# sourceMappingURL=notificacao.service.d.ts.map