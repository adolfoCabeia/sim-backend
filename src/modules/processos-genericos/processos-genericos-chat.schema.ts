import { z } from "zod";

export const enviarMensagemProcessoSchema = z.object({
  mensagem: z.string().trim().min(1, "A mensagem não pode estar vazia.").max(2000),
});
export type EnviarMensagemProcessoInput = z.infer<typeof enviarMensagemProcessoSchema>;

export const enviarAnexoMensagemSchema = z.object({
  mensagem: z.string().trim().max(2000).optional(),
});

export const listarMensagensProcessoQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
export type ListarMensagensProcessoQuery = z.infer<typeof listarMensagensProcessoQuerySchema>;

export const listarConversasQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ListarConversasQuery = z.infer<typeof listarConversasQuerySchema>;
