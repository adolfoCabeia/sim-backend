-- ============================================================================
-- POLÍTICAS RLS (Row-Level Security) — Isolamento multi-tenant por município
-- ============================================================================
--
-- MECANISMO:
-- Cada ligação à base de dados define, no início de cada transacção/pedido,
-- uma variável de sessão com o município do utilizador autenticado:
--
--     SET LOCAL app.current_municipio_id = '<uuid-do-municipio>';
--
-- Todas as políticas abaixo comparam a coluna `municipio_id` (directa ou via
-- join a uma tabela-pai) com essa variável. Se a variável não estiver
-- definida, `current_setting(..., true)` devolve NULL e a comparação falha
-- (nega o acesso) — comportamento "fail closed" intencional.
--
-- NOTA SOBRE TIPOS: os IDs no schema Prisma (`@id @default(uuid())`) são
-- gerados como texto (não há `@db.Uuid`), pelo que a variável de sessão e
-- as colunas são comparadas como `text`, sem cast para `uuid`.
--
-- TABELAS SEM RLS (catálogo partilhado por todos os municípios, por
-- desenho — ver nota no schema):
--   - municipios
--   - perfis
--   - permissoes
--   - perfis_permissoes
--
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Função auxiliar: devolve o município corrente da sessão (ou NULL)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_current_municipio_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.current_municipio_id', true);
$$;


-- ============================================================================
-- SECÇÃO A — Tabelas com municipio_id DIRECTO
-- ============================================================================
-- Padrão aplicado a cada uma: ENABLE + FORCE RLS, e uma policy única
-- "isolamento_municipio" cobrindo SELECT/INSERT/UPDATE/DELETE (USING para
-- leitura/actualização/eliminação, WITH CHECK para escrita/actualização).

DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'centros_acolhimento',
    'zonas_sensiveis',
    'beneficiarios',
    'casos_sensiveis',
    'pedidos_apoio',
    'distribuicoes_kits',
    'programas_sociais',
    'Bem',                          -- sem @@map — nome de tabela = nome do model
    'itens_stock',
    'servicos_continuos',
    'manutencoes_programadas',
    'frota_operacional',
    'direcoes',
    'requisicoes_logistica',
    'utilizadores',
    'pedidos_validacao_identidade',
    'logs_auditoria',
    'assinaturas_eletronicas',
    'pastas',
    'documentos',
    'diplomas_legais',
    'planos_gepe',
    'processos_genericos',
    'fiscalizacao_detalhes',
    'pagamentos',
    'receitas',
    'servicos',
    'agendamentos',
    'contadores_senha',
    'Funcionario',
    'registos_ponto',
    'Habilitacao',
    'Ocorrencia',
    'comissoes_moradores',
    'PedidoFerias',
    'OfertaAntecipacao',
    'conteudos_publicos',
    'contactos_institucionais'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS isolamento_municipio ON %I;', t);
    EXECUTE format($f$
      CREATE POLICY isolamento_municipio ON %I
        USING ("municipioId" = app_current_municipio_id())
        WITH CHECK ("municipioId" = app_current_municipio_id());
    $f$, t);
  END LOOP;
END $$;

-- Nota: os nomes de coluna acima assumem "municipioId" (camelCase, tal como
-- o Prisma cria por omissão quando não há @map no campo). Se o projecto
-- usar um mapeamento diferente para snake_case nas colunas, ajustar para
-- "municipio_id" consoante o caso.


-- ============================================================================
-- SECÇÃO B — Tabelas SEM municipio_id directo (join à tabela-pai)
-- ============================================================================

-- Bem* (fachadas, imagens, histórico, movimentos, regularização jurídica)
-- via bemId -> "Bem".municipioId
ALTER TABLE "BemFachada" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BemFachada" FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON "BemFachada"
  USING (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemFachada"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemFachada"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ));

ALTER TABLE "BemImagem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BemImagem" FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON "BemImagem"
  USING (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemImagem"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemImagem"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ));

ALTER TABLE "BemHistorico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BemHistorico" FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON "BemHistorico"
  USING (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemHistorico"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemHistorico"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ));

ALTER TABLE "BemMovimento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BemMovimento" FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON "BemMovimento"
  USING (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemMovimento"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemMovimento"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ));

ALTER TABLE "BemRegularizacaoJuridica" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BemRegularizacaoJuridica" FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON "BemRegularizacaoJuridica"
  USING (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemRegularizacaoJuridica"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Bem" b WHERE b.id = "BemRegularizacaoJuridica"."bemId"
      AND b."municipioId" = app_current_municipio_id()
  ));

-- movimentos_stock via itemStockId -> itens_stock.municipioId
ALTER TABLE movimentos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_stock FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON movimentos_stock
  USING (EXISTS (
    SELECT 1 FROM itens_stock i WHERE i.id = movimentos_stock."itemStockId"
      AND i."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM itens_stock i WHERE i.id = movimentos_stock."itemStockId"
      AND i."municipioId" = app_current_municipio_id()
  ));

-- departamentos via direcaoId -> direcoes.municipioId
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON departamentos
  USING (EXISTS (
    SELECT 1 FROM direcoes d WHERE d.id = departamentos."direcaoId"
      AND d."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM direcoes d WHERE d.id = departamentos."direcaoId"
      AND d."municipioId" = app_current_municipio_id()
  ));

-- utilizador_perfis via utilizadorId -> utilizadores.municipioId
-- (perfis em si são catálogo partilhado, sem RLS — só a atribuição a um
-- utilizador concreto é dado de um município)
ALTER TABLE utilizador_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilizador_perfis FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON utilizador_perfis
  USING (EXISTS (
    SELECT 1 FROM utilizadores u WHERE u.id = utilizador_perfis."utilizadorId"
      AND u."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM utilizadores u WHERE u.id = utilizador_perfis."utilizadorId"
      AND u."municipioId" = app_current_municipio_id()
  ));

-- tokens (email_confirmation_tokens, password_reset_tokens, refresh_tokens)
-- via utilizadorId -> utilizadores.municipioId
DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'email_confirmation_tokens',
    'password_reset_tokens',
    'refresh_tokens'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY isolamento_municipio ON %I
        USING (EXISTS (
          SELECT 1 FROM utilizadores u WHERE u.id = %I."utilizadorId"
            AND u."municipioId" = app_current_municipio_id()
        ))
        WITH CHECK (EXISTS (
          SELECT 1 FROM utilizadores u WHERE u.id = %I."utilizadorId"
            AND u."municipioId" = app_current_municipio_id()
        ));
    $f$, t, t, t);
  END LOOP;
END $$;

-- notificacoes via utilizadorId -> utilizadores.municipioId
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON notificacoes
  USING (EXISTS (
    SELECT 1 FROM utilizadores u WHERE u.id = notificacoes."utilizadorId"
      AND u."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM utilizadores u WHERE u.id = notificacoes."utilizadorId"
      AND u."municipioId" = app_current_municipio_id()
  ));

-- Filhos de processos_genericos, via processoId -> processos_genericos.municipioId
DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'processos_genericos_mensagens',
    'processos_genericos_transicoes',
    'processos_genericos_anexos'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY isolamento_municipio ON %I
        USING (EXISTS (
          SELECT 1 FROM processos_genericos p WHERE p.id = %I."processoId"
            AND p."municipioId" = app_current_municipio_id()
        ))
        WITH CHECK (EXISTS (
          SELECT 1 FROM processos_genericos p WHERE p.id = %I."processoId"
            AND p."municipioId" = app_current_municipio_id()
        ));
    $f$, t, t, t);
  END LOOP;
END $$;

-- Filhos de requisicoes_logistica, via requisicaoId
DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'requisicao_itens',
    'requisicao_anexos'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY isolamento_municipio ON %I
        USING (EXISTS (
          SELECT 1 FROM requisicoes_logistica r WHERE r.id = %I."requisicaoId"
            AND r."municipioId" = app_current_municipio_id()
        ))
        WITH CHECK (EXISTS (
          SELECT 1 FROM requisicoes_logistica r WHERE r.id = %I."requisicaoId"
            AND r."municipioId" = app_current_municipio_id()
        ));
    $f$, t, t, t);
  END LOOP;
END $$;

-- servico_documentos_exigidos via servicoId -> servicos.municipioId
ALTER TABLE servico_documentos_exigidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servico_documentos_exigidos FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON servico_documentos_exigidos
  USING (EXISTS (
    SELECT 1 FROM servicos s WHERE s.id = servico_documentos_exigidos."servicoId"
      AND s."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM servicos s WHERE s.id = servico_documentos_exigidos."servicoId"
      AND s."municipioId" = app_current_municipio_id()
  ));

-- membros_comissao via comissaoId -> comissoes_moradores.municipioId
ALTER TABLE membros_comissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comissao FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON membros_comissao
  USING (EXISTS (
    SELECT 1 FROM comissoes_moradores c WHERE c.id = membros_comissao."comissaoId"
      AND c."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM comissoes_moradores c WHERE c.id = membros_comissao."comissaoId"
      AND c."municipioId" = app_current_municipio_id()
  ));

-- Filhos de "Ocorrencia" (sem @@map), via ocorrenciaId
ALTER TABLE "OcorrenciaMensagem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OcorrenciaMensagem" FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON "OcorrenciaMensagem"
  USING (EXISTS (
    SELECT 1 FROM "Ocorrencia" o WHERE o.id = "OcorrenciaMensagem"."ocorrenciaId"
      AND o."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Ocorrencia" o WHERE o.id = "OcorrenciaMensagem"."ocorrenciaId"
      AND o."municipioId" = app_current_municipio_id()
  ));

ALTER TABLE "OcorrenciaAnexo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OcorrenciaAnexo" FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON "OcorrenciaAnexo"
  USING (EXISTS (
    SELECT 1 FROM "Ocorrencia" o WHERE o.id = "OcorrenciaAnexo"."ocorrenciaId"
      AND o."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Ocorrencia" o WHERE o.id = "OcorrenciaAnexo"."ocorrenciaId"
      AND o."municipioId" = app_current_municipio_id()
  ));

-- acessos_casos_sensiveis via casoSensivelId -> casos_sensiveis.municipioId
-- IMPORTANTE: esta é a tabela de auditoria imutável (só INSERT/SELECT na
-- prática) do módulo de casos sensíveis; o acesso de leitura deve, além
-- disto, ser restrito ao nível aplicacional pelos perfis autorizados —
-- o RLS aqui só garante o isolamento por município.
ALTER TABLE acessos_casos_sensiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE acessos_casos_sensiveis FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON acessos_casos_sensiveis
  USING (EXISTS (
    SELECT 1 FROM casos_sensiveis cs WHERE cs.id = acessos_casos_sensiveis."casoSensivelId"
      AND cs."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM casos_sensiveis cs WHERE cs.id = acessos_casos_sensiveis."casoSensivelId"
      AND cs."municipioId" = app_current_municipio_id()
  ));

-- participantes_programas via programaId -> programas_sociais.municipioId
-- (beneficiarioId aponta sempre para um beneficiário do mesmo município,
-- garantido pela lógica aplicacional; um único join basta para o RLS)
ALTER TABLE participantes_programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes_programas FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON participantes_programas
  USING (EXISTS (
    SELECT 1 FROM programas_sociais p WHERE p.id = participantes_programas."programaId"
      AND p."municipioId" = app_current_municipio_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM programas_sociais p WHERE p.id = participantes_programas."programaId"
      AND p."municipioId" = app_current_municipio_id()
  ));


-- ============================================================================
-- SECÇÃO C — Caso especial: intercambios (cruza dois municípios por desenho)
-- ============================================================================
-- Um Intercambio pertence simultaneamente à direcção de origem (num
-- município A) e ao município de destino (B). É visível a quem estiver
-- autenticado em QUALQUER um dos dois lados da troca.

ALTER TABLE intercambios ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercambios FORCE ROW LEVEL SECURITY;
CREATE POLICY isolamento_municipio ON intercambios
  USING (
    intercambios."municipioDestinoId" = app_current_municipio_id()
    OR EXISTS (
      SELECT 1 FROM direcoes d WHERE d.id = intercambios."direcaoOrigemId"
        AND d."municipioId" = app_current_municipio_id()
    )
  )
  WITH CHECK (
    intercambios."municipioDestinoId" = app_current_municipio_id()
    OR EXISTS (
      SELECT 1 FROM direcoes d WHERE d.id = intercambios."direcaoOrigemId"
        AND d."municipioId" = app_current_municipio_id()
    )
  );


-- ============================================================================
-- SECÇÃO D — Tabelas de catálogo partilhado: RLS explicitamente NÃO aplicado
-- ============================================================================
-- municipios, perfis, permissoes, perfis_permissoes
--
-- Ficam de fora por desenho — são dados de sistema partilhados por todos
-- os municípios, não dados de um único tenant. Não correr ALTER TABLE ...
-- ENABLE ROW LEVEL SECURITY nestas quatro tabelas.


-- ============================================================================
-- UTILIZAÇÃO NA APLICAÇÃO
-- ============================================================================
-- No início de cada pedido/transacção autenticada (ex.: middleware do
-- Prisma, ou um wrapper à volta de cada `$transaction`):
--
--   await prisma.$executeRawUnsafe(
--     `SET LOCAL app.current_municipio_id = '${municipioIdDoUtilizador}'`
--   );
--
-- Notas importantes:
--  1. Usar sempre SET LOCAL (não SET) para que o valor não escape da
--     transacção corrente — essencial em ambientes com connection pooling
--     (pgBouncer em modo transaction, Prisma connection pool, etc.).
--  2. O papel de base de dados usado pela aplicação NÃO deve ter o
--     atributo BYPASSRLS, senão as políticas acima são ignoradas.
--  3. Operações verdadeiramente administrativas/cross-tenant (relatórios
--     agregados, jobs de manutenção) devem usar um papel de BD separado
--     com BYPASSRLS, nunca a ligação da aplicação normal.
--  4. Se o schema Prisma vier a mapear os campos "municipioId" para
--     snake_case via @map (ex.: municipio_id), actualizar todas as
--     referências entre aspas duplas acima em conformidade.