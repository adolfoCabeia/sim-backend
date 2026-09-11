import { z } from "zod";
import { TipoOrgao, AreaResponsabilidade } from "../../generated/prisma/client.js";

export const criarDirecaoSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(150),
  sigla: z.string().min(2, "A sigla deve ter pelo menos 2 caracteres.").max(20),
  descricao: z.string().max(1000).optional(),
  tipo: z.nativeEnum(TipoOrgao).optional(),
  areaResponsabilidade: z.nativeEnum(AreaResponsabilidade).optional(),
  responsavel: z.string().max(150).optional(),
  contacto: z.string().max(150).optional(),
  permiteIntercambioInterMunicipal: z.boolean().optional(),
});
export type CriarDirecaoInput = z.infer<typeof criarDirecaoSchema>;

export const atualizarDirecaoSchema = criarDirecaoSchema.partial();
export type AtualizarDirecaoInput = z.infer<typeof atualizarDirecaoSchema>;