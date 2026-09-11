import { z } from "zod";
import { TIPOS_CASO_SENSIVEL, ESTADOS_CASO_SENSIVEL } from "../acao-social.constants.js";

export const criarCasoSensivelSchema = z.object({
  beneficiarioId: z.string().uuid().optional(),
  tipo: z.enum(TIPOS_CASO_SENSIVEL),
  descricao: z.string().trim().min(10, "Descreva a situação com mais detalhe.").max(4000),
  dataDeteccao: z.string().datetime(),
  encaminhadoPara: z.string().trim().max(200).optional(),
});
export type CriarCasoSensivelInput = z.infer<typeof criarCasoSensivelSchema>;

export const atualizarCasoSensivelSchema = z.object({
  estado: z.enum(ESTADOS_CASO_SENSIVEL).optional(),
  descricao: z.string().trim().min(10).max(4000).optional(),
  encaminhadoPara: z.string().trim().max(200).optional(),
});
export type AtualizarCasoSensivelInput = z.infer<typeof atualizarCasoSensivelSchema>;

/** Exige sempre um motivo — dados de proteção infantil não se apagam "sem mais". */
export const eliminarCasoSensivelSchema = z.object({
  motivo: z.string().trim().min(10, "Indique o motivo da eliminação.").max(500),
});
export type EliminarCasoSensivelInput = z.infer<typeof eliminarCasoSensivelSchema>;

export const listarCasosSensiveisQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  // Tecto mais baixo do que o resto da app, de propósito: cada linha
  // devolvida gera um registo de auditoria de visualização.
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  tipo: z.enum(TIPOS_CASO_SENSIVEL).optional(),
  estado: z.enum(ESTADOS_CASO_SENSIVEL).optional(),
  beneficiarioId: z.string().uuid().optional(),
});
export type ListarCasosSensiveisQuery = z.infer<typeof listarCasosSensiveisQuerySchema>;
