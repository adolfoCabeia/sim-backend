ALTER TABLE beneficiarios
ENABLE ROW LEVEL SECURITY;

ALTER TABLE beneficiarios
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_beneficiarios
ON beneficiarios;

CREATE POLICY tenant_isolation_beneficiarios
ON beneficiarios
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);