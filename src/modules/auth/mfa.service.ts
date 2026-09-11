import { generateSecret, verify, generateURI } from "otplib";
import QRCode from "qrcode";
import { env } from "../../config/env.js";

export function generateMfaSecret(): string {
  return generateSecret();
}

export function generateMfaQrCodeUri(params: {
  secret: string;
  accountEmail: string;
}): string {
  return generateURI({
    issuer: env.MFA_ISSUER_NAME,
    label: params.accountEmail,
    secret: params.secret,
  });
}

export async function generateMfaQrCodeDataUrl(otpUri: string): Promise<string> {
  return QRCode.toDataURL(otpUri);
}

export async function verifyMfaToken(params: { secret: string; token: string }): Promise<boolean> {
  const resultado = await verify({ secret: params.secret, token: params.token });
  return resultado.valid;
}