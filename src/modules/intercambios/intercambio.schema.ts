import { z } from "zod";

export const enviarIntercambioSchema = z.object({
  municipioDestinoId: z.string().uuid(),
  assunto: z.string().min(5).max(300),
  documentoStorageKey: z.string().optional(),
});
export type EnviarIntercambioInput = z.infer<typeof enviarIntercambioSchema>;

export const listarIntercambiosQuerySchema = z.object({
  direcao: z.enum(["ENVIADOS", "RECEBIDOS"]).default("RECEBIDOS"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ListarIntercambiosQuery = z.infer<typeof listarIntercambiosQuerySchema>;
