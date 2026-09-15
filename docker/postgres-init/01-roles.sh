set -e

: "${SIMVIANA_APP_PASSWORD:?SIMVIANA_APP_PASSWORD tem de estar definida}"
: "${SIMVIANA_BYPASS_PASSWORD:?SIMVIANA_BYPASS_PASSWORD tem de estar definida}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'simviana_app') THEN
      CREATE ROLE simviana_app LOGIN PASSWORD '${SIMVIANA_APP_PASSWORD}'
        NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'simviana_bypass') THEN
      CREATE ROLE simviana_bypass LOGIN PASSWORD '${SIMVIANA_BYPASS_PASSWORD}'
        NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;
    END IF;
  END
  \$\$;

  GRANT USAGE ON SCHEMA public TO simviana_app, simviana_bypass;

  -- Privilégios nas tabelas já existentes nesta altura (normalmente
  -- nenhuma ainda, pois este script corre antes das migrações; mantido
  -- por segurança caso a ordem de arranque mude).
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO simviana_app, simviana_bypass;

  -- Privilégios por omissão em tabelas futuras criadas pelo role de
  -- migração (bootstrap/superuser) — evita repetir GRANTs a cada
  -- nova migração/tabela.
  ALTER DEFAULT PRIVILEGES FOR ROLE "${POSTGRES_USER}" IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO simviana_app, simviana_bypass;

  ALTER DEFAULT PRIVILEGES FOR ROLE "${POSTGRES_USER}" IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO simviana_app, simviana_bypass;
EOSQL

echo "[postgres-init] roles simviana_app / simviana_bypass criados (não-superuser)."
