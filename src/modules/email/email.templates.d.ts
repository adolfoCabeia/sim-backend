export interface EmailContent {
    subject: string;
    html: string;
}
export declare function confirmationEmailTemplate(params: {
    nomeCompleto: string;
    municipioNome: string;
    confirmationUrl: string;
    expiresInHours: number;
}): EmailContent;
export declare function contaBloqueadaEmailTemplate(params: {
    nomeCompleto: string;
    municipioNome: string;
    dataHoraBloqueio: Date;
    duracaoBloqueioMinutos: number;
    ipOrigem?: string;
}): EmailContent;
export declare function passwordResetEmailTemplate(params: {
    nomeCompleto: string;
    municipioNome: string;
    resetUrl: string;
    expiresInHours: number;
}): EmailContent;
export declare function temporaryPasswordEmailTemplate(params: {
    nomeCompleto: string;
    municipioNome: string;
    temporaryPassword: string;
    loginUrl: string;
    redefinidoPorNome: string;
}): EmailContent;
//# sourceMappingURL=email.templates.d.ts.map