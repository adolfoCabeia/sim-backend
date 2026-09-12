export declare function generateMfaSecret(): string;
export declare function generateMfaQrCodeUri(params: {
    secret: string;
    accountEmail: string;
}): string;
export declare function generateMfaQrCodeDataUrl(otpUri: string): Promise<string>;
export declare function verifyMfaToken(params: {
    secret: string;
    token: string;
}): Promise<boolean>;
//# sourceMappingURL=mfa.service.d.ts.map