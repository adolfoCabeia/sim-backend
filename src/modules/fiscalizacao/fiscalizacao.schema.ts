import { z } from "zod";

export const tipoAccaoFiscalizacaoSchema = z.enum(["AUTO_NOTICIA", "CONTRA_ORDENACAO", "VISTORIA"]);

export const criarAccaoFiscalizacaoSchema = z.object({
  tipoAccao: tipoAccaoFiscalizacaoSchema,
  assunto: z.string().min(5).max(200),
  estabelecimentoNome: z.string().max(200).nullable().optional(),
  estabelecimentoEndereco: z.string().max(300).nullable().optional(),
  tipoInfraccao: z.string().max(200).nullable().optional(),
  descricaoInfraccao: z.string().max(3000).nullable().optional(),
  dataVistoria: z.string().datetime().nullable().optional(),
  fiscalResponsavelId: z.string().uuid().nullable().optional(),
});

export const registarCoimaSchema = z.object({
  valorCoima: z.number().positive(),
});

export const listarAccoesQuerySchema = z.object({
  tipoAccao: tipoAccaoFiscalizacaoSchema.optional(),
  estabelecimentoNome: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export type CriarAccaoFiscalizacaoInput = z.infer<typeof criarAccaoFiscalizacaoSchema>;
export type RegistarCoimaInput = z.infer<typeof registarCoimaSchema>;
export type ListarAccoesQuery = z.infer<typeof listarAccoesQuerySchema>;