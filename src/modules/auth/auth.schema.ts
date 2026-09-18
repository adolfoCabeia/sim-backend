import { z } from "zod";
import { DIRECAO_SIGLAS } from "../../config/organograma.js";

export const TIPOS_CONTA = [
  "INTERNO",
  "CIDADAO",
  "EMPRESA",
  "INSTITUICAO",
  "COMISSAO_MORADORES",
] as const;

// Tipos que podem passar pelo registo público via POST /auth/register.
// INTERNO e COMISSAO_MORADORES ficam de fora: ambos são criados por
// um funcionário (INTERNO pelo RH/Admin, COMISSAO_MORADORES por um
// funcionário municipal via POST /comissoes-moradores).
export const TIPOS_CONTA_REGISTO_PUBLICO = [
  "CIDADAO",
  "EMPRESA",
  "INSTITUICAO",
] as const;

export const AREAS_RESPONSABILIDADE = [
  "POLITICA_SOCIAL_COMUNIDADE",
  "ECONOMICA_FINANCEIRA",
  "TECNICA_INFRAESTRUTURAS_SERVICOS",
] as const;

export const DOCUMENTO_TIPOS = ["BI", "PASSAPORTE", "CARTAO_CIDADAO"] as const;

export const registerSchema = z.object({
  municipioId: z.string().uuid(),
  nomeCompleto: z.string().min(3).max(150),
  email: z.string().email(),
  password: z
    .string()
    .min(10, "A password deve ter pelo menos 10 caracteres.")
    .regex(/[A-Z]/, "A password deve conter pelo menos uma letra maiúscula.")
    .regex(/[a-z]/, "A password deve conter pelo menos uma letra minúscula.")
    .regex(/[0-9]/, "A password deve conter pelo menos um número."),
  tipoConta: z.enum(TIPOS_CONTA_REGISTO_PUBLICO),

  nif: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),

  documentoTipo: z.enum(DOCUMENTO_TIPOS).optional(),
  documentoNumero: z.string().min(3).max(50).optional(),

  nomeEmpresa: z.string().optional(),
  nifEmpresa: z.string().optional(),

  nomeInstituicao: z.string().optional(),
  nipcInstituicao: z.string().optional(),
}).refine(
  (data) => (data.documentoTipo === undefined) === (data.documentoNumero === undefined),
  { message: "documentoTipo e documentoNumero têm de ser preenchidos em conjunto", path: ["documentoNumero"] }
);

export type RegisterInput = z.infer<typeof registerSchema>;

// NOVO: criação de conta de Comissão de Moradores por um funcionário
// autenticado. Cria um Utilizador (tipoConta COMISSAO_MORADORES) e os
// dados operacionais da comissão apontando para ele.
export const createComissaoModeradoresSchema = z.object({
  municipioId: z.string().uuid(),
  nomeComissao: z.string().min(3).max(150).optional(), // usado como nomeCompleto do Utilizador; default = presidenteNome
  email: z.string().email(),
  password: z
    .string()
    .min(10, "A password deve ter pelo menos 10 caracteres.")
    .regex(/[A-Z]/, "A password deve conter pelo menos uma letra maiúscula.")
    .regex(/[a-z]/, "A password deve conter pelo menos uma letra minúscula.")
    .regex(/[0-9]/, "A password deve conter pelo menos um número."),

  bairro: z.string().min(2),
  coordenadasLat: z.number().optional(),
  coordenadasLng: z.number().optional(),
  presidenteNome: z.string().min(3),
  presidenteContacto: z.string().optional(),
  documentacaoLegalUrl: z.string().url().optional(),
  observacoes: z.string().optional(),
});
export type CreateComissaoModeradoresInput = z.infer<typeof createComissaoModeradoresSchema>;

export const confirmEmailSchema = z.object({
  token: z.string().min(1),
});
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;

export const loginSchema = z.object({
  identificador: z.string().min(3, "Indica o teu email ou número de BI."),
  password: z.string().min(1),
  mfaToken: z.string().length(6).optional(),
  // NOVO: quando true, e já existir uma sessão activa (utilizador INTERNO
  // online noutro dispositivo), essa sessão anterior é revogada e o login
  // prossegue. Sem esta flag, um segundo login simultâneo é recusado (409).
  forcarNovaSessao: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const activateMfaSchema = z.object({
  token: z.string().length(6),
});
export type ActivateMfaInput = z.infer<typeof activateMfaSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const PASSWORD_REGEX_MESSAGE = {
  min: "A password deve ter pelo menos 10 caracteres.",
  maiuscula: "A password deve conter pelo menos uma letra maiúscula.",
  minuscula: "A password deve conter pelo menos uma letra minúscula.",
  numero: "A password deve conter pelo menos um número.",
};

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    novaPassword: z
      .string()
      .min(10, PASSWORD_REGEX_MESSAGE.min)
      .regex(/[A-Z]/, PASSWORD_REGEX_MESSAGE.maiuscula)
      .regex(/[a-z]/, PASSWORD_REGEX_MESSAGE.minuscula)
      .regex(/[0-9]/, PASSWORD_REGEX_MESSAGE.numero),
    confirmarPassword: z.string(),
  })
  .refine((data) => data.novaPassword === data.confirmarPassword, {
    message: "As passwords não coincidem.",
    path: ["confirmarPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const validateIdentitySchema = z.object({
  utilizadorId: z.string().uuid(),
  documentoIdentidade: z.string(),
  numeroDocumento: z.string(),
  dataEmissao: z.string().datetime(),
  dataValidade: z.string().datetime(),
  autoridade: z.string(),
  funcao: z.string().optional(),
  enderecoProfissional: z.string().optional(),
  dataNascimento: z.string().datetime().optional(),
});
export type ValidateIdentityInput = z.infer<typeof validateIdentitySchema>;