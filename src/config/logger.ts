import pino from "pino";
import { isDevelopment } from "./env.js";

// ============================================================================
// Com exactOptionalPropertyTypes:true, `transport: condicao ? {...} : undefined`
// não é o mesmo que omitir a propriedade — o Pino tipa `transport` como
// opcional (pode estar ausente), não como "presente com valor undefined".
// Por isso construímos o objecto condicionalmente com spread, que omite a
// chave por completo quando não estamos em desenvolvimento.
// ============================================================================

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
  redact: {
    // NUNCA logar estes campos, mesmo por acidente
    paths: [
      "req.headers.authorization",
      "*.password",
      "*.passwordHash",
      "*.mfaSecret",
      "*.token",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
});