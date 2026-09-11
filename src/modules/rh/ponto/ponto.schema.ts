import { z } from "zod";

export const registarPontoSchema = z.object({
  funcionarioId: z.string().uuid(),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  metodo: z.enum(["BIOMETRICO", "MANUAL"]).default("BIOMETRICO"),
  observacoes: z.string().max(500).nullable().optional(),
});

export const registarPontoManualSchema = registarPontoSchema
  .extend({ metodo: z.literal("MANUAL"), observacoes: z.string().min(1).max(500) });

export const listarRegistosPontoQuerySchema = z.object({
  funcionarioId: z.string().uuid().optional(),
  tipo: z.enum(["ENTRADA", "SAIDA"]).optional(),
  desde: z.string().datetime().optional(),
  ate: z.string().datetime().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
});

export type RegistarPontoInput = z.infer<typeof registarPontoSchema>;
export type RegistarPontoManualInput = z.infer<typeof registarPontoManualSchema>;
export type ListarRegistosPontoQuery = z.infer<typeof listarRegistosPontoQuerySchema>;