/**
 * Regras de negócio do módulo de Agendamentos.
 * Centralizadas aqui para que possam, no futuro, passar a ser configuráveis
 * por município ou por tipo de serviço sem caçar números mágicos no código.
 */

// --- Antecedência ---
export const ANTECEDENCIA_MINIMA_MINUTOS = 30; // não se marca "daqui a 2 min"
export const ANTECEDENCIA_MAXIMA_DIAS = 90; // não se marca com 1 ano de distância

// --- Duração ---
export const DURACAO_MINIMA_MINUTOS = 15;
export const DURACAO_MAXIMA_MINUTOS = 240;
export const DURACAO_PADRAO_MINUTOS = 30;

// --- Horário de expediente (hora local do servidor) ---
export const EXPEDIENTE_HORA_INICIO = 8; // 08:00
export const EXPEDIENTE_HORA_FIM = 16; // 16:00 (último início permitido é antes disto)
export const EXPEDIENTE_DIAS_UTEIS = [1, 2, 3, 4, 5]; // 0=Dom ... 6=Sáb

// --- Limites por utilizador (evita abuso / açambarcamento de vagas) ---
export const MAX_AGENDAMENTOS_ATIVOS_POR_UTILIZADOR = 3;

// --- Fila virtual / ETA ---
export const TEMPO_MEDIO_ATENDIMENTO_PADRAO_MINUTOS = 15; // fallback sem histórico
export const AMOSTRA_HISTORICO_TEMPO_MEDIO = 20; // últimos N atendimentos concluídos
export const LIMIAR_NOTIFICACAO_PROXIMO_MINUTOS = 20; // avisa quando faltar <= 20 min
export const INTERVALO_MINIMO_ENTRE_NOTIFICACOES_MINUTOS = 10; // evita spam de push

// --- Antecipação por cancelamento ---
export const GANHO_MINIMO_PARA_OFERTA_MINUTOS = 15; // só oferece se ganhar >= 15 min
export const EXPIRACAO_OFERTA_MINUTOS = 4;

export const PREFIXO_SENHA: Record<string, string> = {
  ADMINISTRADOR: "A",
  ASSISTENTE_SOCIAL: "S",
};