import { z } from "zod";

export const frotaCreateSchema = z.object({
  municipioId: z.string().uuid().optional(),
  bemId: z.string().uuid(),
  alocacaoActual: z.string().max(255).nullable().optional(),
  kmActual: z.number().int().min(0).default(0),
  dataUltimaRevisao: z.string().datetime().nullable().optional(),
  kmProximaRevisao: z.number().int().min(0).nullable().optional(),
  dataProximaRevisao: z.string().datetime().nullable().optional(),
  consumoMedio: z
  .number()
  .min(0)
  .max(100, "O consumo médio não pode ser superior a 100 km/l.")
  .nullable()
  .optional(),
  ultimoAbastecimento: z.string().datetime().nullable().optional(),
  tipoCombustivel: z.string().max(100).nullable().optional(),
});

export const frotaUpdateSchema = frotaCreateSchema.partial().omit({ municipioId: true, bemId: true });

export const frotaParamsSchema = z.object({ id: z.string().uuid() });

export const listarFrotaQuerySchema = z.object({
  municipioId: z.string().uuid().optional(),
  alocacaoActual: z.string().optional(),
  revisaoPendente: z.enum(["true", "false"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export const registrarUsoSchema = z.object({
  kmPercorridos: z.number().int().min(0),
  alocacaoActual: z.string().max(255).nullable().optional(),
  data: z.string().datetime().optional(),
});

export const registrarRevisaoSchema = z.object({
  dataRevisao: z.string().datetime(),
  kmProximaRevisao: z.number().int().min(0),
  observacoes: z.string().nullable().optional(),
});

export const registrarAbastecimentoSchema = z.object({
  data: z.string().datetime(),
  quantidadeLitros: z.number().positive(),
  valor: z.number().nonnegative(),
  kmAtual: z.number().int().min(0),
});

export type FrotaCreateInput = z.infer<typeof frotaCreateSchema>;
export type FrotaUpdateInput = z.infer<typeof frotaUpdateSchema>;
export type ListarFrotaQuery = z.infer<typeof listarFrotaQuerySchema>;
export type RegistrarUsoInput = z.infer<typeof registrarUsoSchema>;
export type RegistrarRevisaoInput = z.infer<typeof registrarRevisaoSchema>;
export type RegistrarAbastecimentoInput = z.infer<typeof registrarAbastecimentoSchema>;