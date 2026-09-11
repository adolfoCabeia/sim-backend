import { LocalizacaoProcesso } from "../../generated/prisma/client.js";


export const CIRCUITO_TRANSICOES_PERMITIDAS: Record<LocalizacaoProcesso, LocalizacaoProcesso[]> = {
  [LocalizacaoProcesso.EXPEDIENTE]: [LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO],
  [LocalizacaoProcesso.GABINETE_ADMINISTRADOR]: [LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO],
  [LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO]: [
    LocalizacaoProcesso.EXPEDIENTE_A_ENVIAR,
    LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO,
  ],
  [LocalizacaoProcesso.EXPEDIENTE_A_ENVIAR]: [LocalizacaoProcesso.DIRECCAO_COMPETENTE],
  [LocalizacaoProcesso.DIRECCAO_COMPETENTE]: [
    LocalizacaoProcesso.RESPOSTA_A_SUBIR,
    LocalizacaoProcesso.PREPARACAO_SAIDA,
  ],
  [LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO]: [LocalizacaoProcesso.RESPOSTA_A_SUBIR],
  [LocalizacaoProcesso.RESPOSTA_A_SUBIR]: [LocalizacaoProcesso.GABINETE_ADMINISTRADOR],
  [LocalizacaoProcesso.CONCLUIDO_NOTIFICADO]: [],
  [LocalizacaoProcesso.PREPARACAO_SAIDA]: [LocalizacaoProcesso.AGUARDA_DESPACHO_SAIDA],
  [LocalizacaoProcesso.AGUARDA_DESPACHO_SAIDA]: [
    LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR,
    LocalizacaoProcesso.DIRECCAO_COMPETENTE,
  ],
  [LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR]: [LocalizacaoProcesso.EXPEDIDO_EXTERNO],
  [LocalizacaoProcesso.EXPEDIDO_EXTERNO]: [],
};


export const LOCALIZACOES_DOC_SAIDA_AUTORIZADO: LocalizacaoProcesso[] = [
  LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR,
  LocalizacaoProcesso.EXPEDIDO_EXTERNO,
];

export function circuitoTransicaoEhValida(actual: LocalizacaoProcesso, novo: LocalizacaoProcesso): boolean {
  return CIRCUITO_TRANSICOES_PERMITIDAS[actual]?.includes(novo) ?? false;
}