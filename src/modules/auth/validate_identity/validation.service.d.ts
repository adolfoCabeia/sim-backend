export declare class PedidoNaoEncontradoError extends Error {
}
export declare class EstadoInvalidoParaOperacaoError extends Error {
}
export declare class SemPermissaoNivel2Error extends Error {
}
export declare function submeterDocumento(params: {
    utilizadorId: string;
    municipioId: string;
    documentoTipo: string;
    documentoNumero: string;
    perfilSolicitadoId?: string;
    ficheiroBuffer: Buffer;
    nomeOriginal?: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    utilizadorId: string;
    documentoNumero: string | null;
    municipioId: string;
    estado: string;
    documentoTipo: string | null;
    documentoStorageKey: string | null;
    documentoNomeOriginal: string | null;
    perfilSolicitadoId: string | null;
    motivoRejeicao: string | null;
    aprovacaoNivel1PorId: string | null;
    aprovacaoNivel1Em: Date | null;
    aprovacaoNivel2PorId: string | null;
    aprovacaoNivel2Em: Date | null;
}>;
export declare function listarPedidosPendentes(municipioId: string): Promise<({
    utilizador: {
        id: string;
        email: string;
        nomeCompleto: string;
        tipoConta: import("../../../generated/prisma/index.js").$Enums.TipoConta;
    };
} & {
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    utilizadorId: string;
    documentoNumero: string | null;
    municipioId: string;
    estado: string;
    documentoTipo: string | null;
    documentoStorageKey: string | null;
    documentoNomeOriginal: string | null;
    perfilSolicitadoId: string | null;
    motivoRejeicao: string | null;
    aprovacaoNivel1PorId: string | null;
    aprovacaoNivel1Em: Date | null;
    aprovacaoNivel2PorId: string | null;
    aprovacaoNivel2Em: Date | null;
})[]>;
export declare function obterPedido(pedidoId: string, municipioId: string): Promise<{
    utilizador: {
        id: string;
        email: string;
        nomeCompleto: string;
        tipoConta: import("../../../generated/prisma/index.js").$Enums.TipoConta;
    };
} & {
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    utilizadorId: string;
    documentoNumero: string | null;
    municipioId: string;
    estado: string;
    documentoTipo: string | null;
    documentoStorageKey: string | null;
    documentoNomeOriginal: string | null;
    perfilSolicitadoId: string | null;
    motivoRejeicao: string | null;
    aprovacaoNivel1PorId: string | null;
    aprovacaoNivel1Em: Date | null;
    aprovacaoNivel2PorId: string | null;
    aprovacaoNivel2Em: Date | null;
}>;
/**
 * Gera uma URL temporária para o revisor visualizar o documento anexado,
 * sem nunca expor o ficheiro publicamente.
 */
export declare function obterUrlDocumento(pedidoId: string, municipioId: string): Promise<string>;
/**
 * Passo "Pedido de Correcção" do fluxograma: revisor (nível 1) rejeita o
 * documento por estar ilegível, inconsistente, etc. Volta ao utilizador
 * para reenvio — NÃO é uma rejeição definitiva da conta.
 */
export declare function solicitarCorrecao(params: {
    pedidoId: string;
    municipioId: string;
    motivoRejeicao: string;
    executorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    utilizadorId: string;
    documentoNumero: string | null;
    municipioId: string;
    estado: string;
    documentoTipo: string | null;
    documentoStorageKey: string | null;
    documentoNomeOriginal: string | null;
    perfilSolicitadoId: string | null;
    motivoRejeicao: string | null;
    aprovacaoNivel1PorId: string | null;
    aprovacaoNivel1Em: Date | null;
    aprovacaoNivel2PorId: string | null;
    aprovacaoNivel2Em: Date | null;
}>;
/**
 * Rejeição definitiva (diferente de "pedido de correcção" — esta encerra
 * o pedido, não convida a reenviar). Usada quando o documento é
 * fraudulento ou os dados não correspondem de forma irrecuperável.
 */
export declare function rejeitarDefinitivamente(params: {
    pedidoId: string;
    municipioId: string;
    motivoRejeicao: string;
    executorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    utilizadorId: string;
    documentoNumero: string | null;
    municipioId: string;
    estado: string;
    documentoTipo: string | null;
    documentoStorageKey: string | null;
    documentoNomeOriginal: string | null;
    perfilSolicitadoId: string | null;
    motivoRejeicao: string | null;
    aprovacaoNivel1PorId: string | null;
    aprovacaoNivel1Em: Date | null;
    aprovacaoNivel2PorId: string | null;
    aprovacaoNivel2Em: Date | null;
}>;
/**
 * Passo "Aprovação por um Segundo Nível" do fluxograma — só se aplica de
 * facto a perfis críticos (PERFIS_QUE_EXIGEM_DUPLA_APROVACAO). Para os
 * restantes, aprovarNivel1 já conclui o fluxo directamente.
 *
 * O executor (revisor de nível 1) NUNCA pode ser o próprio utilizador a
 * validar — isso seria auto-validação de identidade, exactamente o tipo de
 * contorno que a secção 5.4 (regras de governação) quer impedir.
 */
export declare function aprovarNivel1(params: {
    pedidoId: string;
    municipioId: string;
    executorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    utilizadorId: string;
    documentoNumero: string | null;
    municipioId: string;
    estado: string;
    documentoTipo: string | null;
    documentoStorageKey: string | null;
    documentoNomeOriginal: string | null;
    perfilSolicitadoId: string | null;
    motivoRejeicao: string | null;
    aprovacaoNivel1PorId: string | null;
    aprovacaoNivel1Em: Date | null;
    aprovacaoNivel2PorId: string | null;
    aprovacaoNivel2Em: Date | null;
}>;
/**
 * Segundo nível de aprovação — só chamável quando o pedido está em
 * AGUARDANDO_NIVEL_2. O executor do nível 2 tem de ser diferente do
 * executor do nível 1 (dois pares de olhos reais) e diferente do próprio
 * utilizador.
 */
export declare function aprovarNivel2(params: {
    pedidoId: string;
    municipioId: string;
    executorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    utilizadorId: string;
    documentoNumero: string | null;
    municipioId: string;
    estado: string;
    documentoTipo: string | null;
    documentoStorageKey: string | null;
    documentoNomeOriginal: string | null;
    perfilSolicitadoId: string | null;
    motivoRejeicao: string | null;
    aprovacaoNivel1PorId: string | null;
    aprovacaoNivel1Em: Date | null;
    aprovacaoNivel2PorId: string | null;
    aprovacaoNivel2Em: Date | null;
}>;
//# sourceMappingURL=validation.service.d.ts.map