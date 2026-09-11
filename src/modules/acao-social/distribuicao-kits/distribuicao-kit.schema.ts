import { z } from "zod";

export const criarDistribuicaoKitSchema = z.object({
  beneficiarioId: z.string().uuid(),
  centroAcolhimentoId: z.string().uuid().optional(),
  quantidadeKits: z.coerce.number().int().positive().default(1),
  requisicaoId: z.string().uuid().optional(), // TODO: ligar ao model real de Requisicao (ver README)
  observacoes: z.string().trim().max(500).optional(),
});
export type CriarDistribuicaoKitInput = z.infer<typeof criarDistribuicaoKitSchema>;

export const listarDistribuicoesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  beneficiarioId: z.string().uuid().optional(),
  centroAcolhimentoId: z.string().uuid().optional(),
  desde: z.string().datetime().optional(),
  ate: z.string().datetime().optional(),
});
export type ListarDistribuicoesQuery = z.infer<typeof listarDistribuicoesQuerySchema>;
