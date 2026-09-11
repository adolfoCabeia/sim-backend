import { z } from "zod";
import {
  DURACAO_MINIMA_MINUTOS,
  DURACAO_MAXIMA_MINUTOS,
  DURACAO_PADRAO_MINUTOS,
} from "./agendamento.constants.js";

const TIPOS_AGENDAMENTO = ["ADMINISTRADOR", "ASSISTENTE_SOCIAL"] as const;
const ESTADOS_AGENDAMENTO = ["SOLICITADO", "CONFIRMADO", "CANCELADO", "REALIZADO", "FALTA"] as const;

export const criarAgendamentoSchema = z.object({
  tipo: z.enum(TIPOS_AGENDAMENTO),
  dataHoraInicio: z.string().datetime({ message: "dataHoraInicio deve ser uma data/hora ISO 8601 válida." }),
  duracaoMinutos: z
    .number()
    .int()
    .min(DURACAO_MINIMA_MINUTOS, `A duração mínima é de ${DURACAO_MINIMA_MINUTOS} minutos.`)
    .max(DURACAO_MAXIMA_MINUTOS, `A duração máxima é de ${DURACAO_MAXIMA_MINUTOS} minutos.`)
    .default(DURACAO_PADRAO_MINUTOS),
  motivo: z
    .string()
    .trim()
    .min(5, "O motivo deve ter pelo menos 5 caracteres.")
    .max(500, "O motivo não pode exceder 500 caracteres."),
  processoGenericoId: z.string().uuid().optional(),
});
export type CriarAgendamentoInput = z.infer<typeof criarAgendamentoSchema>;

/**
 * NOVO — reagendar. Reaproveita a mesma validação de duração do criar; a
 * duração é opcional porque, na maior parte dos casos, reagendar só muda a
 * hora, mantendo a duração original (ver agendamento.service.ts).
 */
export const reagendarAgendamentoSchema = z.object({
  novaDataHoraInicio: z.string().datetime({ message: "novaDataHoraInicio deve ser uma data/hora ISO 8601 válida." }),
  novaDuracaoMinutos: z
    .number()
    .int()
    .min(DURACAO_MINIMA_MINUTOS)
    .max(DURACAO_MAXIMA_MINUTOS)
    .optional(),
  motivo: z.string().trim().max(500).optional(),
});
export type ReagendarAgendamentoInput = z.infer<typeof reagendarAgendamentoSchema>;

export const confirmarAgendamentoSchema = z.object({
  atendidoPorId: z.string().uuid().optional(),
});
export type ConfirmarAgendamentoInput = z.infer<typeof confirmarAgendamentoSchema>;

export const cancelarAgendamentoSchema = z.object({
  motivo: z.string().trim().max(500).optional(),
});
export type CancelarAgendamentoInput = z.infer<typeof cancelarAgendamentoSchema>;

export const listarAgendamentosQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    tipo: z.enum(TIPOS_AGENDAMENTO).optional(),
    estado: z.enum(ESTADOS_AGENDAMENTO).optional(),
    desde: z.string().datetime().optional(),
    ate: z.string().datetime().optional(),
  })
  .refine((q) => !q.desde || !q.ate || new Date(q.desde) <= new Date(q.ate), {
    message: "'desde' não pode ser posterior a 'ate'.",
    path: ["desde"],
  });
export type ListarAgendamentosQuery = z.infer<typeof listarAgendamentosQuerySchema>;

/**
 * NOVO — a querystring de /agendamentos/meus nunca tinha validação nenhuma
 * (era a única rota de listagem sem validateQuery). Acrescenta também
 * filtro de estado, em falta para o cidadão conseguir ver, por exemplo,
 * só os agendamentos activos.
 */
export const listarMeusAgendamentosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  estado: z.enum(ESTADOS_AGENDAMENTO).optional(),
});
export type ListarMeusAgendamentosQuery = z.infer<typeof listarMeusAgendamentosQuerySchema>;

/**
 * NOVO — querystring de /agendamentos/hoje. Sem "desde"/"ate": o intervalo
 * do dia é calculado sempre no servidor (agendamento.timezone.ts), nunca
 * recebido do cliente — é precisamente o que evita o problema de timezone
 * que o pedido original descreve.
 */
export const listarAgendamentosHojeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  tipo: z.enum(TIPOS_AGENDAMENTO).optional(),
  estado: z.enum(ESTADOS_AGENDAMENTO).optional(),
});
export type ListarAgendamentosHojeQuery = z.infer<typeof listarAgendamentosHojeQuerySchema>;

// --- Fila virtual / ETA ---

/** Sem corpo obrigatório: o id vem nos params. Mantido para simetria e futura extensão. */
export const estouACaminhoSchema = z.object({}).optional();
export type EstouACaminhoInput = z.infer<typeof estouACaminhoSchema>;

/**
 * ALTERADO: removido `numeroSenha` — deixar o cliente enviar a própria
 * senha contradizia directamente o requisito de "geração segura contra
 * duplicação" (a senha tem de ser sempre atribuída pelo servidor, nunca
 * aceite de fora). Ver gerarNumeroSenha em agendamento.fila.service.ts.
 */
export const chamarAtendimentoSchema = z.object({}).optional();
export type ChamarAtendimentoInput = z.infer<typeof chamarAtendimentoSchema>;

// --- Ofertas de antecipação ---

export const responderOfertaSchema = z.object({
  aceitar: z.boolean(),
});
export type ResponderOfertaInput = z.infer<typeof responderOfertaSchema>;