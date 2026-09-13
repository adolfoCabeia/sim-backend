-- ============================================================
-- RLS MULTI-TENANT — SIM-VIANA
-- ============================================================

-- ============================================================
-- UTILIZADORES
-- ============================================================

ALTER TABLE utilizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilizadores FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_utilizadores
ON utilizadores;

CREATE POLICY tenant_isolation_utilizadores
ON utilizadores
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- DIREÇÕES
-- @@map("direcoes")
-- ============================================================

ALTER TABLE direcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcoes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_direcoes
ON direcoes;

CREATE POLICY tenant_isolation_direcoes
ON direcoes
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- LOGS DE AUDITORIA
-- ============================================================

ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_logs_auditoria
ON logs_auditoria;

CREATE POLICY tenant_isolation_logs_auditoria
ON logs_auditoria
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- UTILIZADOR / PERFIS
-- ============================================================

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
        current_setting('app.current_municipio_id', true)::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM utilizadores u
    WHERE u.id = "utilizadorId"
      AND u."municipioId" =
        current_setting('app.current_municipio_id', true)::text
  )
);


-- ============================================================
-- PEDIDOS DE VALIDAÇÃO DE IDENTIDADE
-- ============================================================

ALTER TABLE pedidos_validacao_identidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_validacao_identidade FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pedidos_validacao
ON pedidos_validacao_identidade;

CREATE POLICY tenant_isolation_pedidos_validacao
ON pedidos_validacao_identidade
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- PROCESSOS GENÉRICOS
-- ============================================================

ALTER TABLE processos_genericos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_genericos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_processos_genericos
ON processos_genericos;

CREATE POLICY tenant_isolation_processos_genericos
ON processos_genericos
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- TRANSIÇÕES DE PROCESSOS
-- ============================================================

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
        current_setting('app.current_municipio_id', true)::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM processos_genericos p
    WHERE p.id = "processoId"
      AND p."municipioId" =
        current_setting('app.current_municipio_id', true)::text
  )
);


-- ============================================================
-- ANEXOS DE PROCESSOS
-- ============================================================

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
        current_setting('app.current_municipio_id', true)::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM processos_genericos p
    WHERE p.id = "processoId"
      AND p."municipioId" =
        current_setting('app.current_municipio_id', true)::text
  )
);


-- ============================================================
-- MENSAGENS DOS PROCESSOS
-- ============================================================

ALTER TABLE processos_genericos_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_genericos_mensagens FORCE ROW LEVEL SECURITY;

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
        current_setting('app.current_municipio_id', true)::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM processos_genericos p
    WHERE p.id = "processoId"
      AND p."municipioId" =
        current_setting('app.current_municipio_id', true)::text
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
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
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
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
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
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
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
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
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
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


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
        current_setting('app.current_municipio_id', true)::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM itens_stock i
    WHERE i.id = "itemStockId"
      AND i."municipioId" =
        current_setting('app.current_municipio_id', true)::text
  )
);


-- ============================================================
-- MANUTENÇÕES
-- ============================================================

ALTER TABLE manutencoes_programadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes_programadas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_manutencoes_programadas
ON manutencoes_programadas;

CREATE POLICY tenant_isolation_manutencoes_programadas
ON manutencoes_programadas
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- SERVIÇOS CONTÍNUOS
-- ============================================================

ALTER TABLE servicos_continuos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_continuos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_servicos_continuos
ON servicos_continuos;

CREATE POLICY tenant_isolation_servicos_continuos
ON servicos_continuos
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- FUNCIONÁRIOS
-- ============================================================

ALTER TABLE "Funcionario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Funcionario" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_funcionarios
ON "Funcionario";

CREATE POLICY tenant_isolation_funcionarios
ON "Funcionario"
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- HABILITAÇÕES
-- ============================================================

ALTER TABLE "Habilitacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Habilitacao" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_habilitacoes
ON "Habilitacao";

CREATE POLICY tenant_isolation_habilitacoes
ON "Habilitacao"
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- REGISTOS DE PONTO
-- ============================================================

ALTER TABLE registos_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE registos_ponto FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_registos_ponto
ON registos_ponto;

CREATE POLICY tenant_isolation_registos_ponto
ON registos_ponto
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- PEDIDOS DE FÉRIAS
-- ============================================================

ALTER TABLE "PedidoFerias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PedidoFerias" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pedidos_ferias
ON "PedidoFerias";

CREATE POLICY tenant_isolation_pedidos_ferias
ON "PedidoFerias"
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- COMISSÕES DE MORADORES
-- ============================================================

ALTER TABLE comissoes_moradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_moradores FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_comissoes_moradores
ON comissoes_moradores;

CREATE POLICY tenant_isolation_comissoes_moradores
ON comissoes_moradores
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
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
        current_setting('app.current_municipio_id', true)::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM comissoes_moradores c
    WHERE c.id = "comissaoId"
      AND c."municipioId" =
        current_setting('app.current_municipio_id', true)::text
  )
);


-- ============================================================
-- FISCALIZAÇÃO
-- ============================================================

ALTER TABLE fiscalizacao_detalhes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalizacao_detalhes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_fiscalizacao_detalhes
ON fiscalizacao_detalhes;

CREATE POLICY tenant_isolation_fiscalizacao_detalhes
ON fiscalizacao_detalhes
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- ASSINATURAS ELETRÓNICAS
-- ============================================================

ALTER TABLE assinaturas_eletronicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas_eletronicas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_assinaturas_eletronicas
ON assinaturas_eletronicas;

CREATE POLICY tenant_isolation_assinaturas_eletronicas
ON assinaturas_eletronicas
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- PASTAS
-- ============================================================

ALTER TABLE pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pastas
ON pastas;

CREATE POLICY tenant_isolation_pastas
ON pastas
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- DOCUMENTOS
-- ============================================================

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_documentos
ON documentos;

CREATE POLICY tenant_isolation_documentos
ON documentos
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- DIPLOMAS LEGAIS
-- ============================================================

ALTER TABLE diplomas_legais ENABLE ROW LEVEL SECURITY;
ALTER TABLE diplomas_legais FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_diplomas_legais
ON diplomas_legais;

CREATE POLICY tenant_isolation_diplomas_legais
ON diplomas_legais
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- PLANOS GEPE
-- ============================================================

ALTER TABLE planos_gepe ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_gepe FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_planos_gepe
ON planos_gepe;

CREATE POLICY tenant_isolation_planos_gepe
ON planos_gepe
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- RECEITAS
-- ============================================================

ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_receitas
ON receitas;

CREATE POLICY tenant_isolation_receitas
ON receitas
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- SERVIÇOS
-- ============================================================

ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_servicos
ON servicos;

CREATE POLICY tenant_isolation_servicos
ON servicos
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- CENTROS DE ACOLHIMENTO
-- ============================================================

ALTER TABLE centros_acolhimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_acolhimento FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_centros_acolhimento
ON centros_acolhimento;

CREATE POLICY tenant_isolation_centros_acolhimento
ON centros_acolhimento
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- ZONAS SENSÍVEIS
-- ============================================================

ALTER TABLE zonas_sensiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_sensiveis FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zonas_sensiveis
ON zonas_sensiveis;

CREATE POLICY tenant_isolation_zonas_sensiveis
ON zonas_sensiveis
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- BENEFICIÁRIOS
-- ============================================================

ALTER TABLE beneficiarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiarios FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_beneficiarios
ON beneficiarios;

CREATE POLICY tenant_isolation_beneficiarios
ON beneficiarios
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- CASOS SENSÍVEIS
-- ============================================================

ALTER TABLE casos_sensiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos_sensiveis FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_casos_sensiveis
ON casos_sensiveis;

CREATE POLICY tenant_isolation_casos_sensiveis
ON casos_sensiveis
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- PEDIDOS DE APOIO
-- ============================================================

ALTER TABLE pedidos_apoio ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_apoio FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pedidos_apoio
ON pedidos_apoio;

CREATE POLICY tenant_isolation_pedidos_apoio
ON pedidos_apoio
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- DISTRIBUIÇÕES DE KITS
-- ============================================================

ALTER TABLE distribuicoes_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuicoes_kits FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_distribuicoes_kits
ON distribuicoes_kits;

CREATE POLICY tenant_isolation_distribuicoes_kits
ON distribuicoes_kits
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);


-- ============================================================
-- PROGRAMAS SOCIAIS
-- ============================================================

ALTER TABLE programas_sociais ENABLE ROW LEVEL SECURITY;
ALTER TABLE programas_sociais FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_programas_sociais
ON programas_sociais;

CREATE POLICY tenant_isolation_programas_sociais
ON programas_sociais
USING (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
)
WITH CHECK (
  "municipioId" =
    current_setting('app.current_municipio_id', true)::text
);