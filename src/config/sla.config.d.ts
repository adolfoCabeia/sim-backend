import type { TipoProcessoGenerico } from "../generated/prisma/client.js";
export interface SlaConfig {
    prazoDiasCorridos: number;
    diasAlertaAntesPrazo: number;
}
export declare const SLA_POR_TIPO: Record<TipoProcessoGenerico, SlaConfig>;
export declare function calcularPrazoLegal(tipo: TipoProcessoGenerico, criadoEm: Date): Date;
export declare function diasAlertaPara(tipo: TipoProcessoGenerico): number;
//# sourceMappingURL=sla.config.d.ts.map