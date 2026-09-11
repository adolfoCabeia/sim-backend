import { z } from "zod";
import { TIPOS_PROGRAMA, ESTADOS_PROGRAMA } from "../acao-social.constants.js";

export const criarProgramaSchema = z.object({
  nome: z.string().trim().min(2).max(200),
  tipo: z.enum(TIPOS_PROGRAMA),
  descricao: z.string().trim().max(1000).optional(),
  dataInicio: z.string().datetime(),
  dataFim: z.string().datetime().optional(),
});
export type CriarProgramaInput = z.infer<typeof criarProgramaSchema>;

export const atualizarProgramaSchema = criarProgramaSchema.partial().extend({
  estado: z.enum(ESTADOS_PROGRAMA).optional(),
});
export type AtualizarProgramaInput = z.infer<typeof atualizarProgramaSchema>;

export const inscreverParticipanteSchema = z.object({
  beneficiarioId: z.string().uuid(),
  observacoes: z.string().trim().max(500).optional(),
});
export type InscreverParticipanteInput = z.infer<typeof inscreverParticipanteSchema>;

export const listarProgramasQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  tipo: z.enum(TIPOS_PROGRAMA).optional(),
  estado: z.enum(ESTADOS_PROGRAMA).optional(),
});
export type ListarProgramasQuery = z.infer<typeof listarProgramasQuerySchema>;
