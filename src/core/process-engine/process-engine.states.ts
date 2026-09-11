import { EstadoProcessoGenerico } from "../../generated/prisma/client.js";


export const TRANSICOES_PERMITIDAS: Record<EstadoProcessoGenerico, EstadoProcessoGenerico[]> = {
  [EstadoProcessoGenerico.RECEBIDO]: [EstadoProcessoGenerico.EM_ANALISE],
  [EstadoProcessoGenerico.EM_ANALISE]: [
    EstadoProcessoGenerico.EM_PARECER,
    EstadoProcessoGenerico.DEVOLVIDO,
  ],
  [EstadoProcessoGenerico.EM_PARECER]: [EstadoProcessoGenerico.AGUARDANDO_DESPACHO],
  [EstadoProcessoGenerico.AGUARDANDO_DESPACHO]: [
    EstadoProcessoGenerico.DEFERIDO,
    EstadoProcessoGenerico.INDEFERIDO,
  ],
  [EstadoProcessoGenerico.DEFERIDO]: [EstadoProcessoGenerico.CONCLUIDO],
  [EstadoProcessoGenerico.INDEFERIDO]: [EstadoProcessoGenerico.CONCLUIDO],
  [EstadoProcessoGenerico.DEVOLVIDO]: [EstadoProcessoGenerico.EM_ANALISE],
  [EstadoProcessoGenerico.CONCLUIDO]: [],
};

export const ESTADOS_FINAIS: EstadoProcessoGenerico[] = [EstadoProcessoGenerico.CONCLUIDO];

export const ESTADOS_COM_OBSERVACAO_INTERNA: EstadoProcessoGenerico[] = [
  EstadoProcessoGenerico.EM_PARECER,
  EstadoProcessoGenerico.EM_ANALISE,
];

export const ESTADOS_DESPACHO_FINAL: EstadoProcessoGenerico[] = [
  EstadoProcessoGenerico.DEFERIDO,
  EstadoProcessoGenerico.INDEFERIDO,
];

export function transicaoEhValida(
  estadoAnterior: EstadoProcessoGenerico,
  estadoNovo: EstadoProcessoGenerico
): boolean {
  return TRANSICOES_PERMITIDAS[estadoAnterior]?.includes(estadoNovo) ?? false;
}
