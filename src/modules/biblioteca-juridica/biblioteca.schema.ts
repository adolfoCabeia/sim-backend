import { z } from "zod";

export const categoriaDiplomaSchema = z.enum([
  "LEGISLACAO_MUNICIPAL",
  "POSTURA_MUNICIPAL",
  "REGULAMENTO_TAXAS",
  "PLANO_DIRECTOR_MUNICIPAL",
  "CONTENCIOSO",
  "DIARIO_REPUBLICA",
  "DECRETO_PRESIDENCIAL",
  "DESPACHO_MINISTERIAL",
  "OUTRO",
]);

export const criarDiplomaSchema = z.object({
  categoria: categoriaDiplomaSchema,
  numero: z.string().max(100).nullable().optional(),
  titulo: z.string().min(3).max(300),
  dataPublicacao: z.string().datetime().nullable().optional(),
  documentoId: z.string().uuid().nullable().optional(),
});

export const atualizarDiplomaSchema = criarDiplomaSchema.partial().extend({
  estado: z.enum(["VIGENTE", "REVOGADO"]).optional(),
});

export const pesquisarDiplomasQuerySchema = z.object({
  q: z.string().optional(), // pesquisa livre por título/número
  categoria: categoriaDiplomaSchema.optional(),
  estado: z.enum(["VIGENTE", "REVOGADO"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export type CriarDiplomaInput = z.infer<typeof criarDiplomaSchema>;
export type AtualizarDiplomaInput = z.infer<typeof atualizarDiplomaSchema>;
export type PesquisarDiplomasQuery = z.infer<typeof pesquisarDiplomasQuerySchema>;