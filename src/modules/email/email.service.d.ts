export declare function sendConfirmationEmail(params: {
    to: string;
    toName: string;
    municipioNome: string;
    confirmationUrl: string;
    expiresInHours: number;
}): Promise<void>;
export declare function sendContaBloqueadaEmail(params: {
    to: string;
    toName: string;
    municipioNome: string;
    dataHoraBloqueio: Date;
    duracaoBloqueioMinutos: number;
    ipOrigem?: string;
}): Promise<void>;
export declare function sendPasswordResetEmail(params: {
    to: string;
    toName: string;
    municipioNome: string;
    resetUrl: string;
    expiresInHours: number;
}): Promise<void>;
export declare function sendTemporaryPasswordEmail(params: {
    to: string;
    toName: string;
    municipioNome: string;
    temporaryPassword: string;
    loginUrl: string;
    redefinidoPorNome: string;
}): Promise<void>;
//# sourceMappingURL=email.service.d.ts.map