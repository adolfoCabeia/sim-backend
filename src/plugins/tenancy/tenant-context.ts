// ============================================================================
// tenant-context — NOTA ARQUITECTURAL (auditoria 27/06 + verificação 28/06)
// ============================================================================
// Este ficheiro deixou de registar um hook global de preHandler.
//
// PRIMEIRA VERSÃO: fazia `prisma.$executeRaw(SELECT set_config(...))` solto,
// fora de qualquer transacção. Com @prisma/adapter-pg (pool de ligações),
// isso não é fiável — o set_config desaparece ao fim da instrução (ver
// explicação completa em config/prisma.ts, withTenantTransaction).
//
// SEGUNDA VERSÃO (a que isto substituiu): passou a só resolver e validar
// request.tenant a partir de request.user, como um hook global de
// preHandler (app.addHook). MAS isso introduziu um bug de ORDEM DE
// EXECUÇÃO: hooks preHandler registados via app.addHook() correm sempre
// ANTES dos preHandler passados nas opções de uma rota (como
// fastify.authenticate, usado em auth.routes.ts / validation.routes.ts).
// Isto significa que este hook tentava ler request.user.municipioId ANTES
// do JWT ter sido verificado — request.user estava sempre vazio, e a app
// respondia 401 "Tenant não resolvido" em TODAS as rotas autenticadas.
//
// VERSÃO ACTUAL: a resolução de request.tenant foi movida para dentro de
// plugins/security/authenticate.ts, no preHandler `fastify.authenticate`,
// imediatamente depois do jwtVerify(). Isto garante, por construção, que
// request.tenant nunca é lido antes do JWT ter sido validado.
//
// Quem precisa de RLS continua a usar withTenantTransaction(municipioId,
// async (tx) => {...}) — ver config/prisma.ts — não este ficheiro.
// ============================================================================

export {};
