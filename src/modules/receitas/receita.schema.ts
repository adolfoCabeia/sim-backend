import { z } from "zod";
import { TIPOS_PERIODO } from "./receita.periodos.js";

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD.");

const valorMonetario = z
  .number()
  .nonnegative("O valor não pode ser negativo.")
  .max(999_999_999_999, "Valor excede o limite permitido.");

export const criarReceitaSchema = z.object({
  direcaoId: z.string().uuid().optional(),
  data: dataISO,
  orgaoArrecadador: z.string().min(2).max(200),
  servicoNome: z.string().min(2).max(200),
  servicoCodigo: z.string().max(50).optional(),
  numeroDli: z.string().max(100).optional(),
  valorCobradoDli: valorMonetario,
  numeroDar: z.string().max(100).optional(),
  valorPagoDar: valorMonetario,
  numeroRupe: z.string().max(100).optional(),
  observacao: z.string().max(1000).optional(),
});
export type CriarReceitaInput = z.infer<typeof criarReceitaSchema>;

export const actualizarReceitaSchema = criarReceitaSchema.partial();
export type ActualizarReceitaInput = z.infer<typeof actualizarReceitaSchema>;

export const listarReceitasQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
  direcaoId: z.string().uuid().optional(),
  dataInicio: dataISO.optional(),
  dataFim: dataISO.optional(),
  servicoNome: z.string().max(200).optional(),
  ordenarPor: z.enum(["data", "valorPagoDar"]).default("data"),
  ordem: z.enum(["asc", "desc"]).default("desc"),
});
export type ListarReceitasQuery = z.infer<typeof listarReceitasQuerySchema>;

const periodoQueryBase = {
  tipo: z.enum(TIPOS_PERIODO).default("ESTE_MES"),
  dataInicio: dataISO.optional(),
  dataFim: dataISO.optional(),
  direcaoId: z.string().uuid().optional(),
};

export const resumoFinanceiroQuerySchema = z.object(periodoQueryBase);
export type ResumoFinanceiroQuery = z.infer<typeof resumoFinanceiroQuerySchema>;

export const comparacaoQuerySchema = z.object(periodoQueryBase);
export type ComparacaoQuery = z.infer<typeof comparacaoQuerySchema>;

export const evolucaoQuerySchema = z.object({
  ...periodoQueryBase,
  granularidade: z.enum(["dia", "mes"]).default("dia"),
});
export type EvolucaoQuery = z.infer<typeof evolucaoQuerySchema>;

export const rankingDiasQuerySchema = z.object({
  ...periodoQueryBase,
  ordem: z.enum(["maior", "menor"]).default("maior"),
  limite: z.coerce.number().int().positive().max(100).default(10),
});
export type RankingDiasQuery = z.infer<typeof rankingDiasQuerySchema>;

export const resumoPorDirecaoQuerySchema = z.object(periodoQueryBase);
export type ResumoPorDirecaoQuery = z.infer<typeof resumoPorDirecaoQuerySchema>;

export const exportarReceitasQuerySchema = z.object({
  ...periodoQueryBase,
  formato: z.enum(["xlsx", "pdf"]),
});
export type ExportarReceitasQuery = z.infer<typeof exportarReceitasQuerySchema>;
