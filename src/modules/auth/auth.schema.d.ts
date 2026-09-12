import { z } from "zod";
export declare const TIPOS_CONTA: readonly ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"];
export declare const AREAS_RESPONSABILIDADE: readonly ["POLITICA_SOCIAL_COMUNIDADE", "ECONOMICA_FINANCEIRA", "TECNICA_INFRAESTRUTURAS_SERVICOS"];
export declare const registerSchema: z.ZodObject<{
    municipioId: z.ZodString;
    nomeCompleto: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    tipoConta: z.ZodEnum<{
        CIDADAO: "CIDADAO";
        EMPRESA: "EMPRESA";
        INSTITUICAO: "INSTITUICAO";
        COMISSAO_MORADORES: "COMISSAO_MORADORES";
        INTERNO: "INTERNO";
    }>;
    direcaoSigla: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    areaResponsabilidade: z.ZodOptional<z.ZodEnum<{
        POLITICA_SOCIAL_COMUNIDADE: "POLITICA_SOCIAL_COMUNIDADE";
        ECONOMICA_FINANCEIRA: "ECONOMICA_FINANCEIRA";
        TECNICA_INFRAESTRUTURAS_SERVICOS: "TECNICA_INFRAESTRUTURAS_SERVICOS";
    }>>;
    nif: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
    endereco: z.ZodOptional<z.ZodString>;
    nomeEmpresa: z.ZodOptional<z.ZodString>;
    nifEmpresa: z.ZodOptional<z.ZodString>;
    nomeInstituicao: z.ZodOptional<z.ZodString>;
    nipcInstituicao: z.ZodOptional<z.ZodString>;
    nomeComissao: z.ZodOptional<z.ZodString>;
    bairroZona: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export declare const confirmEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
export declare const loginSchema: z.ZodObject<{
    identificador: z.ZodString;
    password: z.ZodString;
    mfaToken: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export declare const activateMfaSchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
export type ActivateMfaInput = z.infer<typeof activateMfaSchema>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    novaPassword: z.ZodString;
    confirmarPassword: z.ZodString;
}, z.core.$strip>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export declare const validateIdentitySchema: z.ZodObject<{
    utilizadorId: z.ZodString;
    documentoIdentidade: z.ZodString;
    numeroDocumento: z.ZodString;
    dataEmissao: z.ZodString;
    dataValidade: z.ZodString;
    autoridade: z.ZodString;
    funcao: z.ZodOptional<z.ZodString>;
    enderecoProfissional: z.ZodOptional<z.ZodString>;
    dataNascimento: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ValidateIdentityInput = z.infer<typeof validateIdentitySchema>;
//# sourceMappingURL=auth.schema.d.ts.map