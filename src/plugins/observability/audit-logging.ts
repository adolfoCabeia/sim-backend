import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

const SENSITIVE_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "REGISTER",
  "PASSWORD_RESET",
  "MFA_SETUP",
  "PERMISSION_CHANGE",
  "ROLE_ASSIGNMENT",
  "USER_DEACTIVATION",
  "FINANCIAL_TRANSACTION",
];

const SENSITIVE_PATHS = [
  "/auth",
  "/users",
  "/permissions",
  "/roles",
  "/pagamentos",
  "/processos-genericos",
];

// Campos que nunca podem ir para o log de auditoria em claro — passwords,
// tokens e segredos. A lista cobre os nomes usados nos vários schemas de
// body (login, register, change-password, mfa, refresh, etc.).
const REDACTED_FIELDS = new Set([
  "password",
  "novaPassword",
  "passwordActual",
  "confirmarPassword",
  "mfaToken",
  "token",
  "refreshToken",
  "accessToken",
  "secret",
]);

function redactBody(body: unknown): unknown {
  if (body === null || typeof body !== "object") return body;
  const redacted: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(redacted)) {
    if (REDACTED_FIELDS.has(key)) redacted[key] = "[REDACTED]";
  }
  return redacted;
}

/**
 * Plugin de auditoria para registar operações sensíveis.
 * Regista todas as ações críticas no servidor para compliance e segurança.
 */
export const auditLoggingPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    // Marca início da requisição
    request.startTime = Date.now();
  });

  fastify.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isSensitive = SENSITIVE_PATHS.some((path) =>
        request.url.includes(path)
      );

      if (!isSensitive) return;

      const duration = Date.now() - (request.startTime || Date.now());
      const statusCode = reply.statusCode;
      const method = request.method;
      const url = request.url;
      const userId = request.user?.sub || "anonymous";
      const municipioId = request.user?.municipioId || "unknown";

      const auditLog = {
        timestamp: new Date().toISOString(),
        userId,
        municipioId,
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
        action: method === "POST" ? url.split("/").pop() : `${method} ${url}`,
      };

      // Log crítico para POST/DELETE/PUT sensíveis
      if (["POST", "DELETE", "PUT", "PATCH"].includes(method)) {
        // request.body pode legitimamente ser undefined (corpo vazio,
        // content-type ausente, parsing falhado antes do handler correr)
        // — JSON.stringify(undefined) devolve undefined, e chamar
        // .substring nisso rebentava o hook inteiro. Além disso, nunca
        // gravamos o corpo em claro: redactBody() apaga password/token/etc.
        const bodyPreview =
          method !== "DELETE" && request.body !== undefined
            ? JSON.stringify(redactBody(request.body)).substring(0, 200)
            : undefined;

        fastify.log.info(
          { ...auditLog, requestBody: bodyPreview },
          "Sensitive operation performed"
        );
      }

      // Alerta para erros em operações sensíveis
      if (statusCode >= 400) {
        fastify.log.warn(auditLog, `Sensitive operation failed with ${statusCode}`);
      }
    } catch (err) {
      fastify.log.error({ err }, "Audit logging error");
    }
  });
});

// Extend FastifyRequest type to include startTime
declare module "fastify" {
  interface FastifyRequest {
    startTime?: number;
  }
}