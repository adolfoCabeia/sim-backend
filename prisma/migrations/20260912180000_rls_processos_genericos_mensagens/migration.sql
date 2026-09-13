ALTER TABLE processos_genericos_mensagens
ENABLE ROW LEVEL SECURITY;

ALTER TABLE processos_genericos_mensagens
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_processos_genericos_mensagens
ON processos_genericos_mensagens;

CREATE POLICY tenant_isolation_processos_genericos_mensagens
ON processos_genericos_mensagens
USING (
    EXISTS (
        SELECT 1
        FROM processos_genericos p
        WHERE p.id = "processoId"
          AND p."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM processos_genericos p
        WHERE p.id = "processoId"
          AND p."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);