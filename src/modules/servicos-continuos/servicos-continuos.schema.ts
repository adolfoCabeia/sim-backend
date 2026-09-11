import { z } from "zod";

export const TipoServicoContinuoSchema = z.enum(["ENERGIA", "INTERNET", "VOZ", "TELEVISAO"]);
export const EstadoServicoContinuoSchema = z.enum(["ACTIVO", "SUSPENSO", "CANCELADO"]);

export const servicoContinuoCreateSchema = z.object({
  municipioId: z.string().uuid().optional(),
  tipo: TipoServicoContinuoSchema,
  designacao: z.string().min(1).max(255),
  fornecedor: z.string().max(255).nullable().optional(),
  numeroContrato: z.string().max(255).nullable().optional(),
  estado: EstadoServicoContinuoSchema.default("ACTIVO"),
  dataUltimoCarregamento: z.string().datetime().nullable().optional(),
  valorUltimoCarregamento: z.number().nonnegative().nullable().optional(),
  consumoEstimadoDias: z.number().int().positive().nullable().optional(),
  dataPrevistaEsgotamento: z.string().datetime().nullable().optional(),
  dataProximoCarregamento: z.string().datetime().nullable().optional(),
  alertaDiasAntes: z.number().int().min(1).default(7),
});

export const servicoContinuoUpdateSchema = servicoContinuoCreateSchema.partial().omit({ municipioId: true });

export const servicoContinuoParamsSchema = z.object({ id: z.string().uuid() });

export const listarServicosQuerySchema = z.object({
  municipioId: z.string().uuid().optional(),
  tipo: TipoServicoContinuoSchema.optional(),
  estado: EstadoServicoContinuoSchema.optional(),
  proximoVencimento: z.enum(["true", "false"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export const recargaSchema = z.object({
  dataCarregamento: z.string().datetime(),
  valor: z.number().nonnegative(),
  consumoEstimadoDias: z.number().int().positive().nullable().optional(),
  alertaDiasAntes: z.number().int().min(1).optional(),
});

export type ServicoContinuoCreateInput = z.infer<typeof servicoContinuoCreateSchema>;
export type ServicoContinuoUpdateInput = z.infer<typeof servicoContinuoUpdateSchema>;
export type ListarServicosQuery = z.infer<typeof listarServicosQuerySchema>;
export type RecargaInput = z.infer<typeof recargaSchema>;