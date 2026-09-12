import { EstadoProcessoGenerico } from "../../generated/prisma/client.js";
/**
 * Máquina de estados — transcrita literalmente do stateDiagram-v2 da
 * secção 6.2:
 *
 *   [*] --> Recebido
 *   Recebido --> EmAnalise
 *   EmAnalise --> EmParecer
 *   EmParecer --> AguardandoDespacho
 *   AguardandoDespacho --> Deferido
 *   AguardandoDespacho --> Indeferido
 *   Deferido --> Concluido
 *   Indeferido --> Concluido
 *   EmAnalise --> Devolvido: falta de informação
 *   Devolvido --> EmAnalise
 */
export declare const TRANSICOES_PERMITIDAS: Record<EstadoProcessoGenerico, EstadoProcessoGenerico[]>;
/**
 * Estados finais — chegado aqui, o processo só pode seguir para arquivo
 * (ver moverParaArquivoDigital / moverParaArquivoMorto).
 */
export declare const ESTADOS_FINAIS: EstadoProcessoGenerico[];
/**
 * Transições cuja observação é, por natureza, um detalhe interno de
 * tramitação (parecer, análise) e por isso NUNCA deve ser exposta ao
 * cidadão na timeline pública — regra 6.3:
 * "o cidadão [...] vê sempre [...] a timeline [...] — nunca os detalhes
 * internos de tramitação (pareceres, observações internas)".
 *
 * O estado em si (ex.: "Em Parecer") é sempre visível — é a OBSERVAÇÃO
 * textual associada que fica oculta nessas transições.
 */
export declare const ESTADOS_COM_OBSERVACAO_INTERNA: EstadoProcessoGenerico[];
/**
 * Estados de "despacho final" — a decisão de mérito sobre o processo
 * (deferir/indeferir). Distintos dos estados de mera "instrução"
 * (Recebido → Em Análise → Em Parecer → Aguardando Despacho, e
 * Devolvido). Usado por `transicionar()` para exigir a permissão extra
 * `processos_genericos:despacho_final` nestas duas transições — ver
 * secção 5.2: "Fiscalização: [...] Aplicação de despacho final sobre
 * coimas (vai a despacho do Administrador)" e "Secretário Geral: Não
 * pode: Despacho final (compete ao Administrador)".
 */
export declare const ESTADOS_DESPACHO_FINAL: EstadoProcessoGenerico[];
export declare function transicaoEhValida(estadoAnterior: EstadoProcessoGenerico, estadoNovo: EstadoProcessoGenerico): boolean;
//# sourceMappingURL=process-engine.states.d.ts.map