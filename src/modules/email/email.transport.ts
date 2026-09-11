import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../../config/env.js";

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface RawEmailMessage {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

export async function dispatchEmail(message: RawEmailMessage): Promise<void> {
  const recipient = message.toName
    ? { name: message.toName, address: message.to }
    : message.to;

  await getTransporter().sendMail({
    from: { name: env.EMAIL_SENDER_NAME, address: env.EMAIL_SENDER_ADDRESS },
    to: recipient,
    subject: message.subject,
    html: message.html,
  });
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch {
    return false;
  }
}