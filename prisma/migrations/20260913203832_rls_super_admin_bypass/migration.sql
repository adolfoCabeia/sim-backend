-- ============================================================================
-- Adiciona o bypass de app.is_super_admin a TODAS as políticas RLS
-- já criadas em rls_policies.sql, sem alterar a lógica de isolamento
-- por município — só acrescenta a condição extra que withAuthBypass já
-- assume existir.
-- ============================================================================
--
-- Antes:  USING ("municipioId" = app_current_municipio_id())
-- Depois: USING (
--           "municipioId" = app_current_municipio_id()
--           OR current_setting('app.is_super_admin', true) = 'true'
--         )
--
-- Isto cobre exactamente os fluxos de auth (login/registo/confirmação de
-- email/recovery de password) ANTES de se conhecer o município do
-- utilizador — nesse momento não há municipioId para comparar, por isso
-- o bypass explícito é a única forma de a query ver a linha.


-- ----------------------------------------------------------------------------
-- Função auxiliar nova: reconhece o bypass de super-admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.is_super_admin', true) = 'true';
$$;


-- ----------------------------------------------------------------------------
-- Recriar a policy em todas as tabelas DIRECTAS (Secção A do script original)
-- ----------------------------------------------------------------------------
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
    'Bem',
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
    EXECUTE format('DROP POLICY IF EXISTS isolamento_municipio ON %I;', t);
    EXECUTE format($f$
      CREATE POLICY isolamento_municipio ON %I
        USING ("municipioId" = app_current_municipio_id() OR app_is_super_admin())
        WITH CHECK ("municipioId" = app_current_municipio_id() OR app_is_super_admin());
    $f$, t);
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- Recriar a policy em todas as tabelas INDIRECTAS (Secção B do script original)
-- Mesmo padrão: acrescenta "OR app_is_super_admin()" ao EXISTS.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _rls_reaplica_join(
  p_tabela text,
  p_tabela_pai text,
  p_fk_coluna text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS isolamento_municipio ON %I;', p_tabela);
  EXECUTE format($f$
    CREATE POLICY isolamento_municipio ON %I
      USING (
        app_is_super_admin()
        OR EXISTS (
          SELECT 1 FROM %I pai WHERE pai.id = %I.%I
            AND pai."municipioId" = app_current_municipio_id()
        )
      )
      WITH CHECK (
        app_is_super_admin()
        OR EXISTS (
          SELECT 1 FROM %I pai WHERE pai.id = %I.%I
            AND pai."municipioId" = app_current_municipio_id()
        )
      );
  $f$, p_tabela, p_tabela_pai, p_tabela, p_fk_coluna, p_tabela_pai, p_tabela, p_fk_coluna);
END;
$$;

SELECT _rls_reaplica_join('BemFachada', 'Bem', 'bemId');
SELECT _rls_reaplica_join('BemImagem', 'Bem', 'bemId');
SELECT _rls_reaplica_join('BemHistorico', 'Bem', 'bemId');
SELECT _rls_reaplica_join('BemMovimento', 'Bem', 'bemId');
SELECT _rls_reaplica_join('BemRegularizacaoJuridica', 'Bem', 'bemId');
SELECT _rls_reaplica_join('movimentos_stock', 'itens_stock', 'itemStockId');
SELECT _rls_reaplica_join('departamentos', 'direcoes', 'direcaoId');
SELECT _rls_reaplica_join('utilizador_perfis', 'utilizadores', 'utilizadorId');
SELECT _rls_reaplica_join('email_confirmation_tokens', 'utilizadores', 'utilizadorId');
SELECT _rls_reaplica_join('password_reset_tokens', 'utilizadores', 'utilizadorId');
SELECT _rls_reaplica_join('refresh_tokens', 'utilizadores', 'utilizadorId');
SELECT _rls_reaplica_join('notificacoes', 'utilizadores', 'utilizadorId');
SELECT _rls_reaplica_join('processos_genericos_mensagens', 'processos_genericos', 'processoId');
SELECT _rls_reaplica_join('processos_genericos_transicoes', 'processos_genericos', 'processoId');
SELECT _rls_reaplica_join('processos_genericos_anexos', 'processos_genericos', 'processoId');
SELECT _rls_reaplica_join('requisicao_itens', 'requisicoes_logistica', 'requisicaoId');
SELECT _rls_reaplica_join('requisicao_anexos', 'requisicoes_logistica', 'requisicaoId');
SELECT _rls_reaplica_join('servico_documentos_exigidos', 'servicos', 'servicoId');
SELECT _rls_reaplica_join('membros_comissao', 'comissoes_moradores', 'comissaoId');
SELECT _rls_reaplica_join('OcorrenciaMensagem', 'Ocorrencia', 'ocorrenciaId');
SELECT _rls_reaplica_join('OcorrenciaAnexo', 'Ocorrencia', 'ocorrenciaId');
SELECT _rls_reaplica_join('acessos_casos_sensiveis', 'casos_sensiveis', 'casoSensivelId');
SELECT _rls_reaplica_join('participantes_programas', 'programas_sociais', 'programaId');

DROP FUNCTION _rls_reaplica_join(text, text, text);


-- ----------------------------------------------------------------------------
-- Caso especial: intercambios
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS isolamento_municipio ON intercambios;
CREATE POLICY isolamento_municipio ON intercambios
  USING (
    app_is_super_admin()
    OR intercambios."municipioDestinoId" = app_current_municipio_id()
    OR EXISTS (
      SELECT 1 FROM direcoes d WHERE d.id = intercambios."direcaoOrigemId"
        AND d."municipioId" = app_current_municipio_id()
    )
  )
  WITH CHECK (
    app_is_super_admin()
    OR intercambios."municipioDestinoId" = app_current_municipio_id()
    OR EXISTS (
      SELECT 1 FROM direcoes d WHERE d.id = intercambios."direcaoOrigemId"
        AND d."municipioId" = app_current_municipio_id()
    )
  );

-- ============================================================================
-- Depois de aplicar: os fluxos que usam withAuthBypass (login, registo,
-- confirmação de email, recovery de password) passam a poder ler/escrever
-- em "utilizadores" e tabelas relacionadas mesmo sem app.current_municipio_id
-- definido, exactamente como o comentário em prisma.ts já assumia.
-- ============================================================================