import { z } from "zod";
import { DIRECAO_SIGLAS } from "../../config/organograma.js";

const TIPOS_CONTA = [
  "INTERNO",
  "CIDADAO",
  "EMPRESA",
  "INSTITUICAO",
  "COMISSAO_MORADORES",
] as const;

const ESTADOS_UTILIZADOR = [
  "ACTIVA",
  "SUSPENSA",
  "BLOQUEADA",
  "PENDENTE_VALIDACAO",
] as const;

const AREAS_RESPONSABILIDADE = [
  "POLITICA_SOCIAL_COMUNIDADE",
  "ECONOMICA_FINANCEIRA",
  "TECNICA_INFRAESTRUTURAS_SERVICOS",
] as const;

export const listarUtilizadoresQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  estado: z.enum(ESTADOS_UTILIZADOR).optional(),
  tipoConta: z.enum(TIPOS_CONTA).optional(),
  q: z.string().min(1).optional(),
});

export type ListarUtilizadoresQuery = z.infer<
  typeof listarUtilizadoresQuerySchema
>;

export const criarUtilizadorSchema = z.object({
  nomeCompleto: z.string().min(3).max(150),

  email: z.string().email(),

  password: z
    .string()
    .min(10, "A password deve ter pelo menos 10 caracteres.")
    .regex(
      /[A-Z]/,
      "A password deve conter pelo menos uma letra maiúscula.",
    )
    .regex(
      /[a-z]/,
      "A password deve conter pelo menos uma letra minúscula.",
    )
    .regex(/[0-9]/, "A password deve conter pelo menos um número."),

  tipoConta: z.enum(TIPOS_CONTA),

  estado: z
    .enum(ESTADOS_UTILIZADOR)
    .default("PENDENTE_VALIDACAO"),

  direcaoSigla: z.enum(DIRECAO_SIGLAS).optional(),

  departamentoNome: z
    .string()
    .min(1)
    .optional(),

  municipioId: z
    .string()
    .uuid()
    .optional(),

  areaResponsabilidade: z
    .enum(AREAS_RESPONSABILIDADE)
    .optional(),

  superiorId: z
    .string()
    .uuid()
    .optional(),
});

export type CriarUtilizadorInput = z.infer<
  typeof criarUtilizadorSchema
>;

export const editarUtilizadorSchema = z.object({
  nomeCompleto: z
    .string()
    .min(3)
    .max(150)
    .optional(),

  direcaoSigla: z
    .enum(DIRECAO_SIGLAS)
    .nullable()
    .optional(),

  departamentoNome: z
    .string()
    .min(1)
    .nullable()
    .optional(),

  areaResponsabilidade: z
    .enum(AREAS_RESPONSABILIDADE)
    .nullable()
    .optional(),

  superiorId: z
    .string()
    .uuid()
    .nullable()
    .optional(),
});

export type EditarUtilizadorInput = z.infer<
  typeof editarUtilizadorSchema
>;

export const editarMeuPerfilSchema = z.object({
  nomeCompleto: z
    .string()
    .min(3)
    .max(150),
});

export type EditarMeuPerfilInput = z.infer<
  typeof editarMeuPerfilSchema
>;

export const alterarEstadoSchema = z.object({
  estado: z.enum(ESTADOS_UTILIZADOR),
  motivo: z.string().min(3).optional(),
});

export type AlterarEstadoInput = z.infer<
  typeof alterarEstadoSchema
>;

export const atribuirPerfilSchema = z.object({
  perfilId: z.string().uuid(),
});

export type AtribuirPerfilInput = z.infer<
  typeof atribuirPerfilSchema
>;

/**
 * Alteração da password do próprio utilizador.
 *
 * A confirmação da nova password é validada no frontend.
 * O backend recebe apenas:
 * - passwordActual
 * - novaPassword
 *
 * A confirmação não é necessária para executar a operação
 * e não deve ser tratada como dado de negócio.
 */
export const changePasswordSchema = z.object({
  passwordActual: z
    .string()
    .min(1, "A password actual é obrigatória."),

  novaPassword: z
    .string()
    .min(
      10,
      "A password deve ter pelo menos 10 caracteres.",
    )
    .regex(
      /[A-Z]/,
      "A password deve conter pelo menos uma letra maiúscula.",
    )
    .regex(
      /[a-z]/,
      "A password deve conter pelo menos uma letra minúscula.",
    )
    .regex(
      /[0-9]/,
      "A password deve conter pelo menos um número.",
    ),
});

export type ChangePasswordInput = z.infer<
  typeof changePasswordSchema
>;

export {
  TIPOS_CONTA,
  ESTADOS_UTILIZADOR,
  AREAS_RESPONSABILIDADE,
};