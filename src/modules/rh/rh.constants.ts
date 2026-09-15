// --- Vínculo ---
export const LIMIAR_ALERTA_FIM_VINCULO_DIAS = 30; // avisa quando faltar <= 30 dias
export const INTERVALO_MINIMO_NOTIFICACAO_FIM_VINCULO_DIAS = 7; // não repete o aviso todos os dias

export const DIAS_FERIAS_ANUAIS_PADRAO = 22;
export const ANTECEDENCIA_MINIMA_PEDIDO_FERIAS_DIAS = 15;
export const MAX_DIAS_FERIAS_POR_PEDIDO = 30;

export const NIVEIS_HABILITACAO = [
  "ENSINO_PRIMARIO",
  "ENSINO_SECUNDARIO",
  "TECNICO_MEDIO",
  "BACHARELATO",
  "LICENCIATURA",
  "POS_GRADUACAO",
  "MESTRADO",
  "DOUTORAMENTO",
  "CERTIFICACAO_PROFISSIONAL",
  "OUTRO",
] as const;

export const TIPOS_VINCULO = ["QUADRO", "CONTRATO", "ESTAGIARIO"] as const;
export const ESTADOS_FUNCIONARIO = ["ATIVO", "EM_FERIAS", "SUSPENSO", "OUTRO"] as const;
export const ESTADOS_PEDIDO_FERIAS = ["SOLICITADO", "APROVADO", "REJEITADO", "CANCELADO"] as const;

export const HORARIO_PADRAO_INICIO_HORA = 8; // 08h00
export const HORARIO_PADRAO_FIM_HORA = 16; // 16h00 — ACHADO DE AUDITORIA: estava 20 (contradizia o próprio comentário "16h00" e a secção 9.1 da especificação: acesso 08h-16h). Dava 4 horas extra de acesso não autorizado ao sistema todos os dias, até às 20h.

export const INTERVALO_MINIMO_NOTIFICACAO_AUSENCIA_PONTO_DIAS = 1;