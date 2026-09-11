import type { TipoProcessoGenerico } from "../../generated/prisma/client.js";

export interface SlaConfig {
  /** Prazo legal de resposta, em dias corridos a partir da criação do processo. */
  prazoDiasCorridos: number;
  /** Quantos dias antes do vencimento o alerta é disparado (regra 6.3). */
  diasAlertaAntesPrazo: number;
}

export const SLA_POR_TIPO: Record<TipoProcessoGenerico, SlaConfig> = {
  EXPEDIENTE: { prazoDiasCorridos: 15, diasAlertaAntesPrazo: 3 },
  PARECER_JURIDICO: { prazoDiasCorridos: 30, diasAlertaAntesPrazo: 5 },
  REQUISICAO_BEM_SERVICO: { prazoDiasCorridos: 20, diasAlertaAntesPrazo: 3 },
  REQUISICAO_EMPREITADA: { prazoDiasCorridos: 45, diasAlertaAntesPrazo: 7 },
  PEDIDO_AUDIENCIA: { prazoDiasCorridos: 10, diasAlertaAntesPrazo: 2 },
  RECLAMACAO: { prazoDiasCorridos: 15, diasAlertaAntesPrazo: 3 },
  DENUNCIA: { prazoDiasCorridos: 15, diasAlertaAntesPrazo: 3 },
  LICENCIAMENTO: { prazoDiasCorridos: 30, diasAlertaAntesPrazo: 5 },
  SUGESTAO: { prazoDiasCorridos: 15, diasAlertaAntesPrazo: 3 },
  DOACAO: { prazoDiasCorridos: 20, diasAlertaAntesPrazo: 3 },
  AUTO_NOTICIA: { prazoDiasCorridos: 15, diasAlertaAntesPrazo: 3 },
  CONTRA_ORDENACAO: { prazoDiasCorridos: 30, diasAlertaAntesPrazo: 5 },
  VISTORIA: { prazoDiasCorridos: 20, diasAlertaAntesPrazo: 3 },
};

export function calcularPrazoLegal(tipo: TipoProcessoGenerico, criadoEm: Date): Date {
  const config = SLA_POR_TIPO[tipo];
  if (!config) {
    throw new Error(`Sem configuração de SLA para o tipo de processo "${tipo}".`);
  }
  const prazo = new Date(criadoEm);
  prazo.setDate(prazo.getDate() + config.prazoDiasCorridos);
  return prazo;
}

export function diasAlertaPara(tipo: TipoProcessoGenerico): number {
  const config = SLA_POR_TIPO[tipo];
  if (!config) {
    throw new Error(`Sem configuração de SLA para o tipo de processo "${tipo}".`);
  }
  return config.diasAlertaAntesPrazo;
}