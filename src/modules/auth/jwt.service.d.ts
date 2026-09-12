export interface AccessTokenPayload {
    sub: string;
    municipioId: string;
    tipoConta: string;
}
export declare function issueRefreshToken(params: {
    utilizadorId: string;
    ipOrigem?: string;
    userAgent?: string;
}): Promise<string>;
export interface RotateResult {
    novoRefreshToken: string;
    utilizadorId: string;
}
export declare class RefreshTokenInvalidoError extends Error {
}
export declare class RefreshTokenReutilizadoError extends Error {
}
export declare function rotateRefreshToken(rawToken: string, params: {
    ipOrigem?: string;
    userAgent?: string;
}): Promise<RotateResult>;
export declare function revokeRefreshToken(rawToken: string): Promise<void>;
export declare function revokeAllRefreshTokens(utilizadorId: string): Promise<void>;
//# sourceMappingURL=jwt.service.d.ts.map