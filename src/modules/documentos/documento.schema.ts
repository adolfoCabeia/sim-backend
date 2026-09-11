import { z } from "zod";

export const criarPastaSchema = z.object({
  nome: z.string().min(1).max(200),
  pastaPaiId: z.string().uuid().nullable().optional(),
  direcaoId: z.string().uuid().nullable().optional(),
});

export const atualizarPastaSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
});

export const listarPastasQuerySchema = z.object({
  pastaPaiId: z.string().uuid().optional(), // omitido = raiz (pastaPaiId null)
  direcaoId: z.string().uuid().optional(),
});

export const listarDocumentosQuerySchema = z.object({
  pastaId: z.string().uuid().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export const atualizarDocumentoSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  descricao: z.string().max(2000).nullable().optional(),
  pastaId: z.string().uuid().nullable().optional(),
});

export type CriarPastaInput = z.infer<typeof criarPastaSchema>;
export type AtualizarPastaInput = z.infer<typeof atualizarPastaSchema>;
export type ListarPastasQuery = z.infer<typeof listarPastasQuerySchema>;
export type ListarDocumentosQuery = z.infer<typeof listarDocumentosQuerySchema>;
export type AtualizarDocumentoInput = z.infer<typeof atualizarDocumentoSchema>;