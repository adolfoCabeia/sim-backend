import { z } from "zod";
declare const TIPOS_CONTA: readonly ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"];
declare const ESTADOS_UTILIZADOR: readonly ["ACTIVA", "SUSPENSA", "BLOQUEADA", "PENDENTE_VALIDACAO"];
declare const AREAS_RESPONSABILIDADE: readonly ["POLITICA_SOCIAL_COMUNIDADE", "ECONOMICA_FINANCEIRA", "TECNICA_INFRAESTRUTURAS_SERVICOS"];
export declare const listarUtilizadoresQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    estado: z.ZodOptional<z.ZodEnum<{
        ACTIVA: "ACTIVA";
        SUSPENSA: "SUSPENSA";
        BLOQUEADA: "BLOQUEADA";
        PENDENTE_VALIDACAO: "PENDENTE_VALIDACAO";
    }>>;
    tipoConta: z.ZodOptional<z.ZodEnum<{
        CIDADAO: "CIDADAO";
        EMPRESA: "EMPRESA";
        INSTITUICAO: "INSTITUICAO";
        COMISSAO_MORADORES: "COMISSAO_MORADORES";
        INTERNO: "INTERNO";
    }>>;
    q: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListarUtilizadoresQuery = z.infer<typeof listarUtilizadoresQuerySchema>;
export declare const criarUtilizadorSchema: z.ZodObject<{
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
    estado: z.ZodDefault<z.ZodEnum<{
        ACTIVA: "ACTIVA";
        SUSPENSA: "SUSPENSA";
        BLOQUEADA: "BLOQUEADA";
        PENDENTE_VALIDACAO: "PENDENTE_VALIDACAO";
    }>>;
    direcaoSigla: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    departamentoNome: z.ZodOptional<z.ZodString>;
    municipioId: z.ZodOptional<z.ZodString>;
    areaResponsabilidade: z.ZodOptional<z.ZodEnum<{
        POLITICA_SOCIAL_COMUNIDADE: "POLITICA_SOCIAL_COMUNIDADE";
        ECONOMICA_FINANCEIRA: "ECONOMICA_FINANCEIRA";
        TECNICA_INFRAESTRUTURAS_SERVICOS: "TECNICA_INFRAESTRUTURAS_SERVICOS";
    }>>;
    superiorId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CriarUtilizadorInput = z.infer<typeof criarUtilizadorSchema>;
export declare const editarUtilizadorSchema: z.ZodObject<{
    nomeCompleto: z.ZodOptional<z.ZodString>;
    direcaoSigla: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    departamentoNome: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    areaResponsabilidade: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        POLITICA_SOCIAL_COMUNIDADE: "POLITICA_SOCIAL_COMUNIDADE";
        ECONOMICA_FINANCEIRA: "ECONOMICA_FINANCEIRA";
        TECNICA_INFRAESTRUTURAS_SERVICOS: "TECNICA_INFRAESTRUTURAS_SERVICOS";
    }>>>;
    superiorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type EditarUtilizadorInput = z.infer<typeof editarUtilizadorSchema>;
export declare const editarMeuPerfilSchema: z.ZodObject<{
    nomeCompleto: z.ZodString;
}, z.core.$strip>;
export type EditarMeuPerfilInput = z.infer<typeof editarMeuPerfilSchema>;
export declare const alterarEstadoSchema: z.ZodObject<{
    estado: z.ZodEnum<{
        ACTIVA: "ACTIVA";
        SUSPENSA: "SUSPENSA";
        BLOQUEADA: "BLOQUEADA";
        PENDENTE_VALIDACAO: "PENDENTE_VALIDACAO";
    }>;
    motivo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AlterarEstadoInput = z.infer<typeof alterarEstadoSchema>;
export declare const atribuirPerfilSchema: z.ZodObject<{
    perfilId: z.ZodString;
}, z.core.$strip>;
export type AtribuirPerfilInput = z.infer<typeof atribuirPerfilSchema>;
export declare const changePasswordSchema: z.ZodObject<{
    passwordActual: z.ZodString;
    novaPassword: z.ZodString;
    confirmarPassword: z.ZodString;
}, z.core.$strip>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export { TIPOS_CONTA, ESTADOS_UTILIZADOR, AREAS_RESPONSABILIDADE };
//# sourceMappingURL=user.schema.d.ts.map