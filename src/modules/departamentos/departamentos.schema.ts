import { z } from "zod";

export const criarDepartamentoSchema = z.object({
  direcaoId: z.string().uuid("Direção inválida."),
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(150),
  descricao: z.string().max(1000).optional(),
});
export type CriarDepartamentoInput = z.infer<typeof criarDepartamentoSchema>;

export const atualizarDepartamentoSchema = z.object({
  nome: z.string().min(2).max(150).optional(),
  descricao: z.string().max(1000).optional(),
  // mudar de direção é uma operação sensível (afecta hierarquia/permissões
  // dos utilizadores ligados); mantém-se aqui mas fica sujeita a validação
  // extra no serviço.
  direcaoId: z.string().uuid().optional(),
});
export type AtualizarDepartamentoInput = z.infer<typeof atualizarDepartamentoSchema>;