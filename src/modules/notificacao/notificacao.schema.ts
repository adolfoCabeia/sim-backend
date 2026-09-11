import { z } from "zod";

export const listarNotificacoesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  apenasNaoLidas: z.coerce.boolean().default(false),
});
export type ListarNotificacoesQuery = z.infer<typeof listarNotificacoesQuerySchema>;