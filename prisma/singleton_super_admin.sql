CREATE UNIQUE INDEX IF NOT EXISTS uniq_super_admin_singleton
  ON utilizador_perfis ("perfilId")
  WHERE "perfilId" = 'perfil_super_admin';