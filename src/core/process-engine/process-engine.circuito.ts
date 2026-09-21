import { LocalizacaoProcesso } from "../../generated/prisma/client.js";

const L = LocalizacaoProcesso;

export const CIRCUITO_TRANSICOES_PERMITIDAS: Record<LocalizacaoProcesso, LocalizacaoProcesso[]> = {
  // Processo novo na Secretaria Geral, ou resposta que o director subiu por ela.
  [L.EXPEDIENTE]: [
    L.AGUARDA_DESPACHO_ROTEAMENTO, // SG apresenta o processo novo ao Administrador
    L.GABINETE_ADMINISTRADOR, // SG entrega ao Gabinete a resposta subida pelo director
  ],

  [L.GABINETE_ADMINISTRADOR]: [L.AGUARDA_DESPACHO_ROTEAMENTO],

  [L.AGUARDA_DESPACHO_ROTEAMENTO]: [
    L.EXPEDIENTE_A_ENVIAR, // despacho para outra direcção: a SG tem de expedir
    L.DIRECCAO_COMPETENTE, // despacho para a própria SG: fica logo lá, sem expedir
    L.PARECER_ASSESSOR_JURIDICO,
  ],

  [L.EXPEDIENTE_A_ENVIAR]: [L.DIRECCAO_COMPETENTE],

  [L.DIRECCAO_COMPETENTE]: [
    L.RESPOSTA_A_SUBIR, // funcionário deixa a resposta pronta para a chefia
    L.GABINETE_ADMINISTRADOR, // director sobe directamente ao Gabinete
    L.EXPEDIENTE, // director sobe à Secretaria Geral
    L.PREPARACAO_SAIDA,
  ],

  [L.PARECER_ASSESSOR_JURIDICO]: [
    L.RESPOSTA_A_SUBIR,
    L.GABINETE_ADMINISTRADOR, // o Assessor sobe o parecer directamente ao Gabinete
    L.EXPEDIENTE,
  ],

  [L.RESPOSTA_A_SUBIR]: [
    L.GABINETE_ADMINISTRADOR, // a chefia sobe a resposta do funcionário ao Gabinete
    L.EXPEDIENTE, // ...ou à Secretaria Geral
  ],

  [L.CONCLUIDO_NOTIFICADO]: [],
  [L.PREPARACAO_SAIDA]: [L.AGUARDA_DESPACHO_SAIDA],
  [L.AGUARDA_DESPACHO_SAIDA]: [L.EXPEDIENTE_SAIDA_A_FORMALIZAR, L.DIRECCAO_COMPETENTE],
  [L.EXPEDIENTE_SAIDA_A_FORMALIZAR]: [L.EXPEDIDO_EXTERNO],
  [L.EXPEDIDO_EXTERNO]: [],
};

export const LOCALIZACOES_DOC_SAIDA_AUTORIZADO: LocalizacaoProcesso[] = [
  L.EXPEDIENTE_SAIDA_A_FORMALIZAR,
  L.EXPEDIDO_EXTERNO,
];

export function circuitoTransicaoEhValida(actual: LocalizacaoProcesso, novo: LocalizacaoProcesso): boolean {
  return CIRCUITO_TRANSICOES_PERMITIDAS[actual]?.includes(novo) ?? false;
}