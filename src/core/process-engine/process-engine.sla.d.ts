/**
 * Regra 6.3: "Se o prazo legal de resposta estiver a 3 dias do vencimento
 * (configurável por tipo de processo), o sistema envia alerta ao
 * responsável actual e, em escalada, ao superior hierárquico."
 *
 * ⚠️ Nota de multi-tenancy / RLS: as tabelas `utilizadores`, `direcoes` e
 * `processos` têm Row-Level Security FORÇADA (ver prisma/enable_rls.sql),
 * dependente da variável de sessão `app.current_municipio_id`. As novas
 * tabelas do motor genérico (`processos_genericos` e afins) seguem o
 * mesmo padrão (ver migração de RLS adicionada). Isto significa que uma
 * query "global" sem `withTenantTransaction` devolve SEMPRE zero linhas.
 * Por isso este job itera explicitamente por município e só faz queries
 * dentro de `withTenantTransaction`.
 */
export declare function verificarSlasPendentes(): Promise<{
    alertados: number;
    escalados: number;
}>;
//# sourceMappingURL=process-engine.sla.d.ts.map