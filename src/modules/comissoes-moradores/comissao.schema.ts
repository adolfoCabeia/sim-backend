import { z } from "zod";

const membroSchema = z.object({
  nome: z.string().min(1).max(200),
  cargo: z.string().min(1).max(100),
  contacto: z.string().max(50).nullable().optional(),
});

// NOVO: a comissão já não cria a conta aqui — liga-se a um Utilizador
// existente (tipoConta COMISSAO_MORADORES), criado antes por um fluxo
// administrativo de contas. Mesmo padrão do módulo de Funcionários.
export const comissaoCreateSchema = z.object({
  utilizadorId: z.string().uuid("Selecciona um utilizador."),
  bairro: z.string().min(1).max(200),
  coordenadasLat: z.number().min(-90).max(90).nullable().optional(),
  coordenadasLng: z.number().min(-180).max(180).nullable().optional(),
  presidenteNome: z.string().min(1).max(200),
  presidenteContacto: z.string().max(50).nullable().optional(),
  documentacaoLegalUrl: z.string().url().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  membros: z.array(membroSchema).optional().default([]),
});

// Update nunca mexe em utilizadorId nem em estado — só dados operacionais.
export const comissaoUpdateSchema = comissaoCreateSchema
  .omit({ membros: true, utilizadorId: true })
  .partial();

export const alterarEstadoComissaoSchema = z
  .object({
    estado: z.enum(["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"]),
    motivo: z.string().min(3).max(500).optional(),
  })
  .refine((data) => data.estado !== "INACTIVA" || !!data.motivo, {
    message: "É obrigatório indicar um motivo ao desactivar uma comissão.",
    path: ["motivo"],
  });

export const comissaoParamsSchema = z.object({ id: z.string().uuid() });

export const listarComissoesQuerySchema = z.object({
  bairro: z.string().optional(),
  estado: z.enum(["ACTIVA", "INACTIVA", "EM_REGULARIZACAO"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export const adicionarMembroSchema = membroSchema;
export const membroParamsSchema = z.object({ id: z.string().uuid(), membroId: z.string().uuid() });

export type ComissaoCreateInput = z.infer<typeof comissaoCreateSchema>;
export type ComissaoUpdateInput = z.infer<typeof comissaoUpdateSchema>;
export type AlterarEstadoComissaoInput = z.infer<typeof alterarEstadoComissaoSchema>;
export type ListarComissoesQuery = z.infer<typeof listarComissoesQuerySchema>;
export type AdicionarMembroInput = z.infer<typeof adicionarMembroSchema>;