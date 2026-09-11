import { z } from "zod";

export const TipoMovimentoStockSchema = z.enum(["ENTRADA", "SAIDA", "AJUSTE"]);

export const itemStockCreateSchema = z.object({
  codigo: z.string().min(1).max(50),
  designacao: z.string().min(1).max(255),
  categoria: z.string().min(1).max(100),
  unidadeMedida: z.string().min(1).max(50),
  quantidadeActual: z.number().int().min(0).default(0),
  quantidadeMinima: z.number().int().min(0).default(0),
  pontoReposicao: z.number().int().min(0).default(0),
  cicloReposicaoMeses: z.number().int().min(1).nullable().optional(),
  fornecedorPadrao: z.string().max(255).nullable().optional(),
});

export const itemStockUpdateSchema = itemStockCreateSchema.partial();

export const itemStockParamsSchema = z.object({ id: z.string().uuid() });

export const listarItensQuerySchema = z.object({
  municipioId: z.string().uuid().optional(),
  categoria: z.string().optional(),
  abaixoMinimo: z.enum(["true", "false"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export const movimentoStockCreateSchema = z.object({
  itemStockId: z.string().uuid(),
  tipo: TipoMovimentoStockSchema,
  quantidade: z.number().int().positive(),
  motivo: z.string().min(1).max(500),
  documentoRef: z.string().max(255).nullable().optional(),
});

export const listarMovimentosQuerySchema = z.object({
  municipioId: z.string().uuid().optional(),
  itemStockId: z.string().uuid().optional(),
  tipo: TipoMovimentoStockSchema.optional(),
  desde: z.string().datetime().optional(),
  ate: z.string().datetime().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export type ItemStockCreateInput = z.infer<typeof itemStockCreateSchema>;
export type ItemStockUpdateInput = z.infer<typeof itemStockUpdateSchema>;
export type ListarItensQuery = z.infer<typeof listarItensQuerySchema>;
export type MovimentoStockCreateInput = z.infer<typeof movimentoStockCreateSchema>;
export type ListarMovimentosQuery = z.infer<typeof listarMovimentosQuerySchema>;