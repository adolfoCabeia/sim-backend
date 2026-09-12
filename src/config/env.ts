import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),

  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  SEED_DATABASE_URL: z
    .string()
    .optional(),

  REDIS_URL: z.string().min(1, "REDIS_URL é obrigatório"),
  ALERTAS_OPERACIONAIS_CRON: z.string().optional(), // ex: "0 * * * *" = de hora a hora
  ALERTAS_OPERACIONAIS_CRON_ACTIVO: z.coerce.boolean().default(true),

/*   MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_USE_SSL: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  MINIO_BUCKET_DOCUMENTOS: z.string().default("simviana-documentos"), */

  AWS_REGION: z.string().min(1, "AWS_REGION é obrigatório"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID é obrigatório"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY é obrigatório"),
  S3_BUCKET_NAME: z.string().min(1, "S3_BUCKET_NAME é obrigatório"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  ASSINATURA_ELETRONICA_SECRET: z
    .string()
    .min(32, "ASSINATURA_ELETRONICA_SECRET deve ter pelo menos 32 caracteres"),

  MFA_ISSUER_NAME: z.string().default("SIM-VIANA"),

  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET deve ter pelo menos 32 caracteres"),
  COOKIE_DOMAIN: z.string().default("localhost"),

  SMTP_HOST: z.string().min(1, "SMTP_HOST é obrigatório"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().min(1, "SMTP_USER é obrigatório"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD é obrigatório"),
  EMAIL_SENDER_NAME: z.string().default("SIM-MUNICIPAL"),
  EMAIL_SENDER_ADDRESS: z.string().email(),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  EMAIL_CONFIRMATION_EXPIRES_IN_HOURS: z.coerce.number().default(24),
  PASSWORD_RESET_EXPIRES_IN_HOURS: z.coerce.number().default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";