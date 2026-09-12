export type TipoOrgao = "ORGAO_APOIO_CONSULTIVO" | "SERVICO_APOIO_TECNICO" | "SERVICO_APOIO_INSTRUMENTAL" | "DIRECCAO_EXECUTIVA_DESCONCENTRADA";
export interface DirecaoTemplate {
    nome: string;
    sigla: string;
    tipo: TipoOrgao;
    areaResponsabilidade: "POLITICA_SOCIAL_COMUNIDADE" | "ECONOMICA_FINANCEIRA" | "TECNICA_INFRAESTRUTURAS_SERVICOS" | null;
    descricao: string;
    permiteIntercambioInterMunicipal?: boolean;
}
export declare const DIRECOES_TEMPLATE: DirecaoTemplate[];
export declare const DIRECAO_SIGLAS: [string, ...string[]];
export type DirecaoSigla = (typeof DIRECOES_TEMPLATE)[number]["sigla"];
export declare const DEPARTAMENTOS_POR_DIRECAO: Record<string, string[]>;
//# sourceMappingURL=organograma.d.ts.map