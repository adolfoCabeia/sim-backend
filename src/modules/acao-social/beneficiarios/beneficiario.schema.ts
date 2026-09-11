import { z } from "zod";
import { NIVEIS_RISCO_ZONA } from "../acao-social.constants.js";

export const criarZonaSensivelSchema = z.object({
  bairro: z.string().trim().min(2).max(120),
  nivelRisco: z.enum(NIVEIS_RISCO_ZONA),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  descricao: z.string().trim().max(1000).optional(),
});
export type CriarZonaSensivelInput = z.infer<typeof criarZonaSensivelSchema>;

const camposComunsBeneficiario = {
  nome: z.string().trim().min(2).max(150),
  bairro: z.string().trim().min(2).max(120),
  contacto: z.string().trim().max(60).optional(),
  numeroMembrosAgregado: z.coerce.number().int().positive().optional(),
  zonaSensivelId: z.string().uuid().optional(),
  criancasSemRegistoCivil: z.coerce.number().int().min(0).default(0),
  observacoes: z.string().trim().max(1000).optional(),
};

export const criarBeneficiarioSchema = z.object(camposComunsBeneficiario);
export type CriarBeneficiarioInput = z.infer<typeof criarBeneficiarioSchema>;

export const atualizarBeneficiarioSchema = z.object(camposComunsBeneficiario).partial().extend({
  ativo: z.boolean().optional(),
});
export type AtualizarBeneficiarioInput = z.infer<typeof atualizarBeneficiarioSchema>;

export const listarBeneficiariosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  bairro: z.string().trim().optional(),
  zonaSensivelId: z.string().uuid().optional(),
  pesquisa: z.string().trim().max(200).optional(),
  ativo: z.coerce.boolean().optional(),
});
export type ListarBeneficiariosQuery = z.infer<typeof listarBeneficiariosQuerySchema>;
