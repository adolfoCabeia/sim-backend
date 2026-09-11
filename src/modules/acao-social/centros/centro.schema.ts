import { z } from "zod";
import { TIPOS_CENTRO, ESTADOS_CENTRO } from "../acao-social.constants.js";

const camposComuns = {
  departamentoId: z.string().uuid(),
  nome: z.string().trim().min(2).max(150),
  tipo: z.enum(TIPOS_CENTRO),
  bairro: z.string().trim().min(2).max(120),
  endereco: z.string().trim().max(250).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacidadeMaxima: z.coerce.number().int().positive().optional(),
  responsavelNome: z.string().trim().max(150).optional(),
  responsavelContacto: z.string().trim().max(60).optional(),
  observacoes: z.string().trim().max(1000).optional(),
};

export const criarCentroSchema = z.object(camposComuns);
export type CriarCentroInput = z.infer<typeof criarCentroSchema>;

export const atualizarCentroSchema = z
  .object(camposComuns)
  .partial()
  .extend({
    estado: z.enum(ESTADOS_CENTRO).optional(),
    ocupacaoAtual: z.coerce.number().int().min(0).optional(),
  });
export type AtualizarCentroInput = z.infer<typeof atualizarCentroSchema>;

export const listarCentrosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  departamentoId: z.string().uuid().optional(),
  tipo: z.enum(TIPOS_CENTRO).optional(),
  estado: z.enum(ESTADOS_CENTRO).optional(),
});
export type ListarCentrosQuery = z.infer<typeof listarCentrosQuerySchema>;
