import { env } from "../../config/env.js";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_ACCOUNT_URL = "https://api.brevo.com/v3/account";

const TIMEOUT_MS = 8_000;

export class EmailDispatchError extends Error {}

export interface RawEmailMessage {
  to: string;
  toName?: string | undefined;
  subject: string;
  html: string;
}

export async function dispatchEmail(message: RawEmailMessage): Promise<void> {
  const payload = {
    sender: { name: env.EMAIL_SENDER_NAME, email: env.EMAIL_SENDER_ADDRESS },
    to: [
      message.toName
        ? { email: message.to, name: message.toName }
        : { email: message.to },
    ],
    subject: message.subject,
    htmlContent: message.html,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new EmailDispatchError(`Falha de rede ao contactar a API da Brevo: ${motivo}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const corpo = await response.text().catch(() => "");
    throw new EmailDispatchError(
      `Brevo respondeu ${response.status} ${response.statusText}: ${corpo}`
    );
  }
}

export async function verifyEmailProvider(): Promise<boolean> {
  try {
    const response = await fetch(BREVO_ACCOUNT_URL, {
      headers: { Accept: "application/json", "api-key": env.BREVO_API_KEY },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Alias para não partir imports existentes de `verifySmtpConnection`.
 * Podes remover este alias assim que actualizares os chamadores. */
export const verifySmtpConnection = verifyEmailProvider;