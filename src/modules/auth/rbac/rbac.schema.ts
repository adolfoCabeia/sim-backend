import { z } from "zod";

export const criarPerfilSchema = z.object({
  nome: z.string().trim().min(3, "O nome do perfil deve ter pelo menos 3 caracteres.").max(80),
  descricao: z.string().trim().max(500).optional(),
});
export type CriarPerfilInput = z.infer<typeof criarPerfilSchema>;

export const criarPermissaoSchema = z.object({
  recurso: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, "O recurso só pode conter letras minúsculas, números, hífen e underscore."),
  accao: z

  
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, "A acção só pode conter letras minúsculas, números, hífen e underscore."),
  descricao: z.string().trim().max(500).optional(),
});
export type CriarPermissaoInput = z.infer<typeof criarPermissaoSchema>;

export const associarPermissaoSchema = z.object({
  permissaoId: z.string().uuid(),
});
export type AssociarPermissaoInput = z.infer<typeof associarPermissaoSchema>;

export const definirAcessoIlimitadoPontoSchema = z.object({
  acessoIlimitadoPonto: z.boolean(),
});
export type DefinirAcessoIlimitadoPontoInput = z.infer<typeof definirAcessoIlimitadoPontoSchema>;