import { z } from "zod";

export const tipoPlanoGepeSchema = z.enum(["PDM", "PLANO_ANUAL_ACTIVIDADES"]);

export const criarPlanoSchema = z.object({
  tipo: tipoPlanoGepeSchema,
  titulo: z.string().min(3).max(300),
  ano: z.number().int().min(2000).max(2100).nullable().optional(),
  periodoInicio: z.string().datetime().nullable().optional(),
  periodoFim: z.string().datetime().nullable().optional(),
  objectivos: z.string().max(5000).nullable().optional(),
  documentoId: z.string().uuid().nullable().optional(),
});

export const atualizarPlanoSchema = criarPlanoSchema.partial();

export const rejeitarPlanoSchema = z.object({
  observacoesAdministrador: z.string().min(1).max(2000),
});

export const listarPlanosQuerySchema = z.object({
  tipo: tipoPlanoGepeSchema.optional(),
  estado: z.enum(["RASCUNHO", "SUBMETIDO", "APROVADO", "REJEITADO"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export type CriarPlanoInput = z.infer<typeof criarPlanoSchema>;
export type AtualizarPlanoInput = z.infer<typeof atualizarPlanoSchema>;
export type RejeitarPlanoInput = z.infer<typeof rejeitarPlanoSchema>;
export type ListarPlanosQuery = z.infer<typeof listarPlanosQuerySchema>;