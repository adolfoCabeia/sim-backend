import { z } from "zod";

export const listarLogsQuerySchema = z.object({
  utilizadorId: z.string().uuid().optional(),
  entidade: z.string().optional(),
  entidadeId: z.string().optional(),
  accao: z.string().optional(),
  desde: z.string().datetime().optional(),
  ate: z.string().datetime().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
});

export type ListarLogsQuery = z.infer<typeof listarLogsQuerySchema>;

export const exportarLogsQuerySchema = listarLogsQuerySchema.omit({ page: true, limit: true });

export type ExportarLogsQuery = z.infer<typeof exportarLogsQuerySchema>;