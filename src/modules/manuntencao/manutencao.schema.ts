import { z } from "zod";

export const manutencaoCreateSchema = z.object({
  municipioId: z.string().uuid().optional(),
  bemId: z.string().uuid(),
  tipoManutencao: z.string().min(1).max(100),
  periodicidadeMeses: z.number().int().min(1),
  dataUltima: z.string().datetime().nullable().optional(),
  dataProxima: z.string().datetime().nullable().optional(),
  especificacoesTecnicas: z.string().nullable().optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  estado: z.string().default("AGENDADA"),
  observacoes: z.string().nullable().optional(),
});

export const manutencaoUpdateSchema = manutencaoCreateSchema.partial().omit({ municipioId: true, bemId: true });

export const manutencaoParamsSchema = z.object({ id: z.string().uuid() });

export const listarManutencaoQuerySchema = z.object({
  municipioId: z.string().uuid().optional(),
  bemId: z.string().uuid().optional(),
  tipoManutencao: z.string().optional(),
  estado: z.string().optional(),
  proximas: z.enum(["true", "false"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export const concluirManutencaoSchema = z.object({
  dataRealizacao: z.string().datetime(),
  observacoes: z.string().nullable().optional(),
  responsavelId: z.string().uuid().optional(),
});

export type ManutencaoCreateInput = z.infer<typeof manutencaoCreateSchema>;
export type ManutencaoUpdateInput = z.infer<typeof manutencaoUpdateSchema>;
export type ListarManutencaoQuery = z.infer<typeof listarManutencaoQuerySchema>;
export type ConcluirManutencaoInput = z.infer<typeof concluirManutencaoSchema>;