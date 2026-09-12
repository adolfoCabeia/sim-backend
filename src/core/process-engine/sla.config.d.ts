import type { TipoProcessoGenerico } from "../../generated/prisma/client.js";
/**
 * Configuração de SLA (prazo legal de resposta) por tipo de processo —
 * secção 6.1 ("Prazo legal de resposta: calculado conforme o tipo de
 * processo") e secção 6.3 ("Se o prazo legal de resposta estiver a 3 dias
 * do vencimento (configurável por tipo de processo), o sistema envia
 * alerta [...]").
 *
 * ⚠️ IMPORTANTE — OS PRAZOS ABAIXO SÃO VALORES POR OMISSÃO/EXEMPLO, NÃO
 * PRAZOS LEGAIS CONFIRMADOS. Este motor não tem acesso a nenhuma lista
 * oficial de prazos legais angolanos por tipo de processo administrativo
 * municipal — inventar esses números seria dar uma falsa sensação de
 * conformidade legal. Antes de operar em produção, a Direcção Jurídica /
 * Gabinete Jurídico deve rever e confirmar cada prazoDiasUteis abaixo
 * (idealmente tornando isto configurável via a tabela `Perfil`/admin UI,
 * não apenas por ficheiro de código).
 */
export interface SlaConfig {
    /** Prazo legal de resposta, em dias corridos a partir da criação do processo. */
    prazoDiasCorridos: number;
    /** Quantos dias antes do vencimento o alerta é disparado (regra 6.3). */
    diasAlertaAntesPrazo: number;
}
export declare const SLA_POR_TIPO: Record<TipoProcessoGenerico, SlaConfig>;
export declare function calcularPrazoLegal(tipo: TipoProcessoGenerico, criadoEm: Date): Date;
export declare function diasAlertaPara(tipo: TipoProcessoGenerico): number;
//# sourceMappingURL=sla.config.d.ts.map