import type { RegisterInput, LoginInput } from "./auth.schema.js";
export declare class CredenciaisInvalidasError extends Error {
}
export declare class ContaBloqueadaError extends Error {
}
export declare class ContaNaoActivaError extends Error {
}
export declare class EmailNaoConfirmadoError extends Error {
}
export declare class MfaObrigatorioError extends Error {
}
export declare class MfaTokenInvalidoError extends Error {
}
export declare class EmailJaExisteError extends Error {
}
export declare class DirecaoNaoEncontradaError extends Error {
}
export declare class TokenConfirmacaoInvalidoError extends Error {
}
export declare class TokenRedefinicaoInvalidoError extends Error {
}
export declare function registerUser(input: RegisterInput): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    areaResponsabilidade: import("../../generated/prisma/index.js").$Enums.AreaResponsabilidade | null;
    deveTrocarPassword: boolean;
    email: string;
    nifEmpresa: string | null;
    nipcInstituicao: string | null;
    documentoNumero: string | null;
    municipioId: string;
    nomeCompleto: string;
    passwordHash: string;
    tipoConta: import("../../generated/prisma/index.js").$Enums.TipoConta;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoUtilizador;
    emailConfirmado: boolean;
    emailConfirmadoEm: Date | null;
    telefone: string | null;
    endereco: string | null;
    dataNascimento: Date | null;
    direcaoId: string | null;
    superiorId: string | null;
    departamentoId: string | null;
    funcao: string | null;
    nomeEmpresa: string | null;
    nomeInstituicao: string | null;
    nomeComissao: string | null;
    bairroZona: string | null;
    cargoComissao: string | null;
    documentoTipo: string | null;
    documentoValidadoEm: Date | null;
    documentoValidadoPorId: string | null;
    mfaActivo: boolean;
    mfaSecret: string | null;
    tentativasLoginFalhadas: number;
    bloqueadoAte: Date | null;
    ativo: boolean;
}>;
export declare function confirmEmail(rawToken: string): Promise<void>;
interface LoginResult {
    utilizador: {
        id: string;
        nomeCompleto: string;
        email: string;
        municipioId: string;
        tipoConta: string;
        estado: string;
        mfaActivo: boolean;
        deveTrocarPassword: boolean;
    };
    refreshToken: string;
}
export declare function loginUser(input: LoginInput, context: {
    ipOrigem?: string;
    userAgent?: string;
}): Promise<LoginResult>;
export declare function initiateMfaSetup(params: {
    utilizadorId: string;
    municipioId: string;
}): Promise<{
    qrCodeDataUrl: string;
    secret: string;
}>;
export declare function confirmMfaSetup(params: {
    utilizadorId: string;
    municipioId: string;
    token: string;
}): Promise<void>;
export declare function requestPasswordReset(email: string): Promise<void>;
export declare function resetPassword(rawToken: string, novaPassword: string): Promise<void>;
export {};
//# sourceMappingURL=auth.service.d.ts.map