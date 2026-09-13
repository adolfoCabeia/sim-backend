-- ============================================================
-- COMPLETE RLS TENANT ISOLATION
-- ============================================================
-- Objetivo:
--   Garantir isolamento entre municípios em todas as tabelas
--   que ainda não possuíam RLS.
--
-- Contexto esperado:
--   app.current_municipio_id
--
-- A aplicação deve definir este valor dentro de uma transação:
--
--   SELECT set_config(
--       'app.current_municipio_id',
--       '<municipio-id>',
--       true
--   );
--
-- IMPORTANTE:
--   Todas as tabelas protegidas usam FORCE ROW LEVEL SECURITY.
-- ============================================================


-- ============================================================
-- 1. BEM
-- ============================================================

ALTER TABLE "Bem"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Bem"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_bem
ON "Bem";

CREATE POLICY tenant_isolation_bem
ON "Bem"
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND (
        "direcaoId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM direcoes d
            WHERE d.id = "direcaoId"
              AND d."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


-- ============================================================
-- 2. BEM - TABELAS FILHAS
-- ============================================================

ALTER TABLE "BemFachada"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "BemFachada"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_bem_fachada
ON "BemFachada";

CREATE POLICY tenant_isolation_bem_fachada
ON "BemFachada"
USING (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


ALTER TABLE "BemHistorico"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "BemHistorico"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_bem_historico
ON "BemHistorico";

CREATE POLICY tenant_isolation_bem_historico
ON "BemHistorico"
USING (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


ALTER TABLE "BemImagem"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "BemImagem"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_bem_imagem
ON "BemImagem";

CREATE POLICY tenant_isolation_bem_imagem
ON "BemImagem"
USING (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


ALTER TABLE "BemMovimento"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "BemMovimento"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_bem_movimento
ON "BemMovimento";

CREATE POLICY tenant_isolation_bem_movimento
ON "BemMovimento"
USING (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


ALTER TABLE "BemRegularizacaoJuridica"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "BemRegularizacaoJuridica"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_bem_regularizacao_juridica
ON "BemRegularizacaoJuridica";

CREATE POLICY tenant_isolation_bem_regularizacao_juridica
ON "BemRegularizacaoJuridica"
USING (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 3. FROTA OPERACIONAL
--    frota_operacional -> Bem
-- ============================================================

ALTER TABLE frota_operacional
ENABLE ROW LEVEL SECURITY;

ALTER TABLE frota_operacional
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_frota_operacional
ON frota_operacional;

CREATE POLICY tenant_isolation_frota_operacional
ON frota_operacional
USING (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Bem" b
        WHERE b.id = "bemId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 4. OCORRENCIAS
-- ============================================================

ALTER TABLE "Ocorrencia"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Ocorrencia"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ocorrencia
ON "Ocorrencia";

CREATE POLICY tenant_isolation_ocorrencia
ON "Ocorrencia"
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND (
        "criadoPorId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM utilizadores u
            WHERE u.id = "criadoPorId"
              AND u."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )

    AND (
        "responsavelId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM utilizadores u
            WHERE u.id = "responsavelId"
              AND u."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )

    AND (
        "comissaoId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM comissoes_moradores c
            WHERE c.id = "comissaoId"
              AND c."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


ALTER TABLE "OcorrenciaAnexo"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "OcorrenciaAnexo"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ocorrencia_anexo
ON "OcorrenciaAnexo";

CREATE POLICY tenant_isolation_ocorrencia_anexo
ON "OcorrenciaAnexo"
USING (
    EXISTS (
        SELECT 1
        FROM "Ocorrencia" o
        WHERE o.id = "ocorrenciaId"
          AND o."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Ocorrencia" o
        WHERE o.id = "ocorrenciaId"
          AND o."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


ALTER TABLE "OcorrenciaMensagem"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "OcorrenciaMensagem"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ocorrencia_mensagem
ON "OcorrenciaMensagem";

CREATE POLICY tenant_isolation_ocorrencia_mensagem
ON "OcorrenciaMensagem"
USING (
    EXISTS (
        SELECT 1
        FROM "Ocorrencia" o
        WHERE o.id = "ocorrenciaId"
          AND o."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "Ocorrencia" o
        WHERE o.id = "ocorrenciaId"
          AND o."municipioId" =
              current_setting('app.current_municipio_id', true)
    )

    AND (
        "autorId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM utilizadores u
            WHERE u.id = "autorId"
              AND u."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


-- ============================================================
-- 5. BENEFICIARIOS
-- ============================================================

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

    AND (
        "zonaSensivelId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM zonas_sensiveis z
            WHERE z.id = "zonaSensivelId"
              AND z."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


-- ============================================================
-- 6. CASOS SENSÍVEIS
-- ============================================================

ALTER TABLE casos_sensiveis
ENABLE ROW LEVEL SECURITY;

ALTER TABLE casos_sensiveis
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_casos_sensiveis
ON casos_sensiveis;

CREATE POLICY tenant_isolation_casos_sensiveis
ON casos_sensiveis
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND (
        "beneficiarioId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM beneficiarios b
            WHERE b.id = "beneficiarioId"
              AND b."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


ALTER TABLE acessos_casos_sensiveis
ENABLE ROW LEVEL SECURITY;

ALTER TABLE acessos_casos_sensiveis
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_acessos_casos_sensiveis
ON acessos_casos_sensiveis;

CREATE POLICY tenant_isolation_acessos_casos_sensiveis
ON acessos_casos_sensiveis
USING (
    EXISTS (
        SELECT 1
        FROM casos_sensiveis c
        WHERE c.id = "casoSensivelId"
          AND c."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM casos_sensiveis c
        WHERE c.id = "casoSensivelId"
          AND c."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 7. CENTROS DE ACOLHIMENTO
-- ============================================================

ALTER TABLE centros_acolhimento
ENABLE ROW LEVEL SECURITY;

ALTER TABLE centros_acolhimento
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_centros_acolhimento
ON centros_acolhimento;

CREATE POLICY tenant_isolation_centros_acolhimento
ON centros_acolhimento
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND EXISTS (
        SELECT 1
        FROM direcoes d
        WHERE d.id = "departamentoId"
          AND d."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 8. DISTRIBUIÇÕES DE KITS
-- ============================================================

ALTER TABLE distribuicoes_kits
ENABLE ROW LEVEL SECURITY;

ALTER TABLE distribuicoes_kits
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_distribuicoes_kits
ON distribuicoes_kits;

CREATE POLICY tenant_isolation_distribuicoes_kits
ON distribuicoes_kits
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND (
        "centroAcolhimentoId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM centros_acolhimento c
            WHERE c.id = "centroAcolhimentoId"
              AND c."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )

    AND EXISTS (
        SELECT 1
        FROM beneficiarios b
        WHERE b.id = "beneficiarioId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )

    AND EXISTS (
        SELECT 1
        FROM utilizadores u
        WHERE u.id = "distribuidoPorId"
          AND u."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 9. CONTADORES DE SENHA
-- ============================================================

ALTER TABLE contadores_senha
ENABLE ROW LEVEL SECURITY;

ALTER TABLE contadores_senha
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_contadores_senha
ON contadores_senha;

CREATE POLICY tenant_isolation_contadores_senha
ON contadores_senha
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- 10. PEDIDOS DE APOIO
-- ============================================================

ALTER TABLE pedidos_apoio
ENABLE ROW LEVEL SECURITY;

ALTER TABLE pedidos_apoio
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pedidos_apoio
ON pedidos_apoio;

CREATE POLICY tenant_isolation_pedidos_apoio
ON pedidos_apoio
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND EXISTS (
        SELECT 1
        FROM beneficiarios b
        WHERE b.id = "beneficiarioId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )

    AND (
        "resolvidoPorId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM utilizadores u
            WHERE u.id = "resolvidoPorId"
              AND u."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


-- ============================================================
-- 11. PROGRAMAS SOCIAIS
-- ============================================================

ALTER TABLE programas_sociais
ENABLE ROW LEVEL SECURITY;

ALTER TABLE programas_sociais
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_programas_sociais
ON programas_sociais;

CREATE POLICY tenant_isolation_programas_sociais
ON programas_sociais
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


ALTER TABLE participantes_programas
ENABLE ROW LEVEL SECURITY;

ALTER TABLE participantes_programas
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_participantes_programas
ON participantes_programas;

CREATE POLICY tenant_isolation_participantes_programas
ON participantes_programas
USING (
    EXISTS (
        SELECT 1
        FROM programas_sociais p
        WHERE p.id = "programaId"
          AND p."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM programas_sociais p
        WHERE p.id = "programaId"
          AND p."municipioId" =
              current_setting('app.current_municipio_id', true)
    )

    AND EXISTS (
        SELECT 1
        FROM beneficiarios b
        WHERE b.id = "beneficiarioId"
          AND b."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 12. REQUISIÇÕES LOGÍSTICAS
-- ============================================================

ALTER TABLE requisicoes_logistica
ENABLE ROW LEVEL SECURITY;

ALTER TABLE requisicoes_logistica
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_requisicoes_logistica
ON requisicoes_logistica;

CREATE POLICY tenant_isolation_requisicoes_logistica
ON requisicoes_logistica
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND EXISTS (
        SELECT 1
        FROM utilizadores u
        WHERE u.id = "requerenteId"
          AND u."municipioId" =
              current_setting('app.current_municipio_id', true)
    )

    AND (
        "direcaoId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM direcoes d
            WHERE d.id = "direcaoId"
              AND d."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


ALTER TABLE requisicao_anexos
ENABLE ROW LEVEL SECURITY;

ALTER TABLE requisicao_anexos
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_requisicao_anexos
ON requisicao_anexos;

CREATE POLICY tenant_isolation_requisicao_anexos
ON requisicao_anexos
USING (
    EXISTS (
        SELECT 1
        FROM requisicoes_logistica r
        WHERE r.id = "requisicaoId"
          AND r."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM requisicoes_logistica r
        WHERE r.id = "requisicaoId"
          AND r."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


ALTER TABLE requisicao_itens
ENABLE ROW LEVEL SECURITY;

ALTER TABLE requisicao_itens
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_requisicao_itens
ON requisicao_itens;

CREATE POLICY tenant_isolation_requisicao_itens
ON requisicao_itens
USING (
    EXISTS (
        SELECT 1
        FROM requisicoes_logistica r
        WHERE r.id = "requisicaoId"
          AND r."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM requisicoes_logistica r
        WHERE r.id = "requisicaoId"
          AND r."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 13. SERVIÇOS
-- ============================================================

ALTER TABLE servicos
ENABLE ROW LEVEL SECURITY;

ALTER TABLE servicos
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_servicos
ON servicos;

CREATE POLICY tenant_isolation_servicos
ON servicos
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)

    AND EXISTS (
        SELECT 1
        FROM direcoes d
        WHERE d.id = "direcaoResponsavelId"
          AND d."municipioId" =
              current_setting('app.current_municipio_id', true)
    )

    AND (
        "criadoPorId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM utilizadores u
            WHERE u.id = "criadoPorId"
              AND u."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )

    AND (
        "alteradoPorId" IS NULL
        OR EXISTS (
            SELECT 1
            FROM utilizadores u
            WHERE u.id = "alteradoPorId"
              AND u."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )
);


ALTER TABLE servico_documentos_exigidos
ENABLE ROW LEVEL SECURITY;

ALTER TABLE servico_documentos_exigidos
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_servico_documentos_exigidos
ON servico_documentos_exigidos;

CREATE POLICY tenant_isolation_servico_documentos_exigidos
ON servico_documentos_exigidos
USING (
    EXISTS (
        SELECT 1
        FROM servicos s
        WHERE s.id = "servicoId"
          AND s."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM servicos s
        WHERE s.id = "servicoId"
          AND s."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);


-- ============================================================
-- 14. ZONAS SENSÍVEIS
-- ============================================================

ALTER TABLE zonas_sensiveis
ENABLE ROW LEVEL SECURITY;

ALTER TABLE zonas_sensiveis
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zonas_sensiveis
ON zonas_sensiveis;

CREATE POLICY tenant_isolation_zonas_sensiveis
ON zonas_sensiveis
USING (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
)
WITH CHECK (
    "municipioId" =
        current_setting('app.current_municipio_id', true)
);


-- ============================================================
-- 15. TOKENS DE UTILIZADORES
-- ============================================================

ALTER TABLE email_confirmation_tokens
ENABLE ROW LEVEL SECURITY;

ALTER TABLE email_confirmation_tokens
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_email_confirmation_tokens
ON email_confirmation_tokens;

CREATE POLICY tenant_isolation_email_confirmation_tokens
ON email_confirmation_tokens
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


ALTER TABLE password_reset_tokens
ENABLE ROW LEVEL SECURITY;

ALTER TABLE password_reset_tokens
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_password_reset_tokens
ON password_reset_tokens;

CREATE POLICY tenant_isolation_password_reset_tokens
ON password_reset_tokens
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


ALTER TABLE refresh_tokens
ENABLE ROW LEVEL SECURITY;

ALTER TABLE refresh_tokens
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_refresh_tokens
ON refresh_tokens;

CREATE POLICY tenant_isolation_refresh_tokens
ON refresh_tokens
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


ALTER TABLE notificacoes
ENABLE ROW LEVEL SECURITY;

ALTER TABLE notificacoes
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_notificacoes
ON notificacoes;

CREATE POLICY tenant_isolation_notificacoes
ON notificacoes
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


-- ============================================================
-- 16. INTERCÂMBIOS
-- ============================================================
-- Um intercâmbio pode envolver dois municípios:
--
--   município de origem
--          ↓
--       direção
--          ↓
--     intercâmbio
--          ↓
--   município destino
--
-- Cada município participante pode visualizar o intercâmbio.
-- ============================================================

ALTER TABLE intercambios
ENABLE ROW LEVEL SECURITY;

ALTER TABLE intercambios
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_intercambios
ON intercambios;

CREATE POLICY tenant_isolation_intercambios
ON intercambios
USING (
    "municipioDestinoId" =
        current_setting('app.current_municipio_id', true)

    OR EXISTS (
        SELECT 1
        FROM direcoes d
        WHERE d.id = "direcaoOrigemId"
          AND d."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
)
WITH CHECK (
    (
        "municipioDestinoId" =
            current_setting('app.current_municipio_id', true)

        OR EXISTS (
            SELECT 1
            FROM direcoes d
            WHERE d.id = "direcaoOrigemId"
              AND d."municipioId" =
                  current_setting('app.current_municipio_id', true)
        )
    )

    AND EXISTS (
        SELECT 1
        FROM direcoes d
        WHERE d.id = "direcaoOrigemId"
          AND d."municipioId" =
              current_setting('app.current_municipio_id', true)
    )
);