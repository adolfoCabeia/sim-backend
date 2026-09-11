import { z } from "zod";
import { TIPOS_PERIODO } from "../receitas/receita.periodos.js";

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD.");

const periodoQueryBase = {
  tipo: z.enum(TIPOS_PERIODO).default("ESTE_MES"),
  dataInicio: dataISO.optional(),
  dataFim: dataISO.optional(),
  direcaoId: z.string().uuid().optional(),
};

export const resumoPagamentosQuerySchema = z.object(periodoQueryBase);
export type ResumoPagamentosQuery = z.infer<typeof resumoPagamentosQuerySchema>;

export const comparacaoPagamentosQuerySchema = z.object(periodoQueryBase);
export type ComparacaoPagamentosQuery = z.infer<typeof comparacaoPagamentosQuerySchema>;

export const evolucaoPagamentosQuerySchema = z.object({
  ...periodoQueryBase,
  granularidade: z.enum(["dia", "mes"]).default("dia"),
});
export type EvolucaoPagamentosQuery = z.infer<typeof evolucaoPagamentosQuerySchema>;

export const rankingDiasPagamentosQuerySchema = z.object({
  ...periodoQueryBase,
  ordem: z.enum(["maior", "menor"]).default("maior"),
  limite: z.coerce.number().int().positive().max(100).default(10),
});
export type RankingDiasPagamentosQuery = z.infer<typeof rankingDiasPagamentosQuerySchema>;

export const resumoPorDirecaoPagamentosQuerySchema = z.object(periodoQueryBase);
export type ResumoPorDirecaoPagamentosQuery = z.infer<typeof resumoPorDirecaoPagamentosQuerySchema>;
