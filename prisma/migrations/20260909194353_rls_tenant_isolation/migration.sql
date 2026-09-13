ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_logs_auditoria
ON logs_auditoria;

CREATE POLICY tenant_isolation_logs_auditoria
ON logs_auditoria
USING (
    "municipioId" = current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" = current_setting('app.current_municipio_id', true)
);

ALTER TABLE utilizador_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilizador_perfis FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_utilizador_perfis
ON utilizador_perfis;

CREATE POLICY tenant_isolation_utilizador_perfis
ON utilizador_perfis
USING (
    EXISTS (
        SELECT 1
        FROM utilizadores u
        WHERE u.id = "utilizadorId"
          AND u."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM utilizadores u
        WHERE u.id = "utilizadorId"
          AND u."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);
ALTER TABLE pedidos_validacao_identidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_validacao_identidade FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pedidos_validacao
ON pedidos_validacao_identidade;

CREATE POLICY tenant_isolation_pedidos_validacao
ON pedidos_validacao_identidade
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE processos_genericos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_genericos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_processos_genericos
ON processos_genericos;

CREATE POLICY tenant_isolation_processos_genericos
ON processos_genericos
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);
ALTER TABLE processos_genericos_transicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_genericos_transicoes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_processos_genericos_transicoes
ON processos_genericos_transicoes;

CREATE POLICY tenant_isolation_processos_genericos_transicoes
ON processos_genericos_transicoes
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

ALTER TABLE processos_genericos_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_genericos_anexos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_processos_genericos_anexos
ON processos_genericos_anexos;

CREATE POLICY tenant_isolation_processos_genericos_anexos
ON processos_genericos_anexos
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


-- ============================================================
-- PAGAMENTOS
-- ============================================================

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pagamentos
ON pagamentos;

CREATE POLICY tenant_isolation_pagamentos
ON pagamentos
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- AGENDAMENTOS
-- ============================================================

ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_agendamentos
ON agendamentos;

CREATE POLICY tenant_isolation_agendamentos
ON agendamentos
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- CONTEÚDOS PÚBLICOS
-- ============================================================

ALTER TABLE conteudos_publicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudos_publicos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_conteudos_publicos
ON conteudos_publicos;

CREATE POLICY tenant_isolation_conteudos_publicos
ON conteudos_publicos
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- CONTACTOS INSTITUCIONAIS
-- ============================================================

ALTER TABLE contactos_institucionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos_institucionais FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_contactos_institucionais
ON contactos_institucionais;

CREATE POLICY tenant_isolation_contactos_institucionais
ON contactos_institucionais
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- OFERTA ANTECIPAÇÃO
-- ============================================================

ALTER TABLE "OfertaAntecipacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OfertaAntecipacao" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ofertas_antecipacao
ON "OfertaAntecipacao";

CREATE POLICY tenant_isolation_ofertas_antecipacao
ON "OfertaAntecipacao"
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- STOCK
-- ============================================================

ALTER TABLE itens_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_stock FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_itens_stock
ON itens_stock;

CREATE POLICY tenant_isolation_itens_stock
ON itens_stock
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- MOVIMENTOS DE STOCK
-- ============================================================

ALTER TABLE movimentos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_stock FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_movimentos_stock
ON movimentos_stock;

CREATE POLICY tenant_isolation_movimentos_stock
ON movimentos_stock
USING (
    EXISTS (
        SELECT 1
        FROM itens_stock i
        WHERE i.id = "itemStockId"
          AND i."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM itens_stock i
        WHERE i.id = "itemStockId"
          AND i."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);

ALTER TABLE manutencoes_programadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes_programadas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_manutencoes_programadas
ON manutencoes_programadas;

CREATE POLICY tenant_isolation_manutencoes_programadas
ON manutencoes_programadas
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE servicos_continuos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_continuos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_servicos_continuos
ON servicos_continuos;

CREATE POLICY tenant_isolation_servicos_continuos
ON servicos_continuos
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE registos_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE registos_ponto FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_registos_ponto
ON registos_ponto;

CREATE POLICY tenant_isolation_registos_ponto
ON registos_ponto
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE comissoes_moradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_moradores FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_comissoes_moradores
ON comissoes_moradores;

CREATE POLICY tenant_isolation_comissoes_moradores
ON comissoes_moradores
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE membros_comissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comissao FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_membros_comissao
ON membros_comissao;

CREATE POLICY tenant_isolation_membros_comissao
ON membros_comissao
USING (
    EXISTS (
        SELECT 1
        FROM comissoes_moradores c
        WHERE c.id = "comissaoId"
          AND c."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM comissoes_moradores c
        WHERE c.id = "comissaoId"
          AND c."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);

ALTER TABLE fiscalizacao_detalhes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalizacao_detalhes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_fiscalizacao_detalhes
ON fiscalizacao_detalhes;

CREATE POLICY tenant_isolation_fiscalizacao_detalhes
ON fiscalizacao_detalhes
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE assinaturas_eletronicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas_eletronicas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_assinaturas_eletronicas
ON assinaturas_eletronicas;

CREATE POLICY tenant_isolation_assinaturas_eletronicas
ON assinaturas_eletronicas
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pastas
ON pastas;

CREATE POLICY tenant_isolation_pastas
ON pastas
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_documentos
ON documentos;

CREATE POLICY tenant_isolation_documentos
ON documentos
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);
ALTER TABLE diplomas_legais ENABLE ROW LEVEL SECURITY;
ALTER TABLE diplomas_legais FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_diplomas_legais
ON diplomas_legais;

CREATE POLICY tenant_isolation_diplomas_legais
ON diplomas_legais
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE planos_gepe ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_gepe FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_planos_gepe
ON planos_gepe;

CREATE POLICY tenant_isolation_planos_gepe
ON planos_gepe
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_receitas
ON receitas;

CREATE POLICY tenant_isolation_receitas
ON receitas
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE "Funcionario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Funcionario" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_funcionarios
ON "Funcionario";

CREATE POLICY tenant_isolation_funcionarios
ON "Funcionario"
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE "Habilitacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Habilitacao" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_habilitacoes
ON "Habilitacao";

CREATE POLICY tenant_isolation_habilitacoes
ON "Habilitacao"
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);

ALTER TABLE "PedidoFerias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PedidoFerias" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pedidos_ferias
ON "PedidoFerias";

CREATE POLICY tenant_isolation_pedidos_ferias
ON "PedidoFerias"
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);