export interface RawEmailMessage {
    to: string;
    toName?: string;
    subject: string;
    html: string;
}
export declare function dispatchEmail(message: RawEmailMessage): Promise<void>;
export declare function verifySmtpConnection(): Promise<boolean>;
//# sourceMappingURL=email.transport.d.ts.map