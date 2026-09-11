import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { parseExpiryToSeconds } from "../utils/time.js";

// ============================================================================
// Plugin de cookies. O refresh token (jwt.service.ts) passa a viver num
// cookie httpOnly, nunca no corpo da resposta JSON — isto é o que protege
// o token de ser lido por um script malicioso em caso de XSS (localStorage/
// sessionStorage são sempre legíveis por JavaScript; um cookie httpOnly não).
//
// O `secret` aqui assina os cookies (cookie signing), o que detecta
// adulteração no lado do cliente — não é encriptação, é integridade.
// ============================================================================

export const cookiePlugin = fp(async function (fastify: FastifyInstance) {
  await fastify.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
  });
});

export const REFRESH_TOKEN_COOKIE_NAME = "simviana_refresh_token";

/**
 * Opções do cookie do refresh token, centralizadas aqui para nunca haver
 * inconsistência entre o `set` (login/refresh) e o `clear` (logout).
 *
 * - httpOnly: true   → inacessível a JavaScript no browser (mitiga XSS)
 * - secure: true      → só enviado por HTTPS (em dev, false — ver env.ts)
 * - sameSite: "lax"   → enviado em navegação top-level entre subdomínios
 *                        (api.simviana.gov.ao ↔ simviana.gov.ao), mas não
 *                        em requests cross-site de terceiros (mitiga CSRF)
 * - domain            → partilhado entre api.* e o domínio raiz, para que
 *                        o frontend em simviana.gov.ao envie o cookie nos
 *                        pedidos a api.simviana.gov.ao
 * - path: "/auth"     → o cookie só é enviado em rotas /auth/*, reduzindo
 *                        a superfície de exposição noutras rotas
 * - maxAge            → alinhado com JWT_REFRESH_EXPIRES_IN, para o cookie
 *                        não sobreviver no browser além da validade real do
 *                        token na base de dados (nem morrer antes — um
 *                        cookie de sessão expiraria ao fechar o browser,
 *                        o que obrigaria a novo login mais cedo do que a
 *                        validade real do refresh token)
 */
export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    domain: env.COOKIE_DOMAIN,
    path: "/auth",
    maxAge: parseExpiryToSeconds(env.JWT_REFRESH_EXPIRES_IN),
  };
}