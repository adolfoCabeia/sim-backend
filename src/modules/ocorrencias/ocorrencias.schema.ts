import { z } from "zod";

export const CATEGORIAS_OCORRENCIA = [
  "INFRAESTRUTURA",
  "SANEAMENTO",
  "SEGURANCA",
  "SAUDE",
  "EDUCACAO",
  "AMBIENTE",
  "OUTRO",
] as const;

export const ESTADOS_OCORRENCIA = ["REGISTADA", "EM_ANALISE", "EM_RESOLUCAO", "RESOLVIDA", "ARQUIVADA"] as const;

export const criarOcorrenciaSchema = z.object({
  bairroZona: z.string().min(2).max(120),
  categoria: z.enum(CATEGORIAS_OCORRENCIA),
  titulo: z.string().min(5).max(150),
  descricao: z.string().min(10).max(3000),
  comissaoId: z.string().uuid().optional(),
});

export type CriarOcorrenciaInput = z.infer<typeof criarOcorrenciaSchema>;

export const responderOcorrenciaSchema = z.object({
  mensagem: z.string().min(1).max(2000),
});

export type ResponderOcorrenciaInput = z.infer<typeof responderOcorrenciaSchema>;

export const mudarEstadoOcorrenciaSchema = z.object({
  estado: z.enum(ESTADOS_OCORRENCIA),
  observacao: z.string().max(500).optional(),
});

export const MAX_IMAGENS_OCORRENCIA = 4;
export const MIN_IMAGENS_OCORRENCIA = 1;

export type MudarEstadoOcorrenciaInput = z.infer<typeof mudarEstadoOcorrenciaSchema>;