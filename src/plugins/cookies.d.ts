import type { FastifyInstance } from "fastify";
export declare const cookiePlugin: (fastify: FastifyInstance) => Promise<void>;
export declare const REFRESH_TOKEN_COOKIE_NAME = "simviana_refresh_token";
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
export declare function getRefreshCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    domain: string;
    path: string;
    maxAge: number;
};
//# sourceMappingURL=cookies.d.ts.map