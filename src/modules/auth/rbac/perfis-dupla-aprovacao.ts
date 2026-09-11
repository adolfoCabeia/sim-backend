/**
 * Perfis que exigem dupla aprovação na validação de identidade
 * (secção 5.1 / fluxo em validation.service.ts).
 *
 * HISTÓRICO: isto vivia antes dentro de `rbac_matrix.ts`, um ficheiro que
 * definia um `RoleType` enum e uma `RBAC_MATRIX` inteiros, hardcoded, e
 * usados em NENHUM outro sítio do código — o RBAC real é dinâmico, guiado
 * pela tabela `Perfil`/`Permissao` da base de dados (ver
 * src/modules/auth/rbac/rbac.service.ts e prisma/seed.ts). Só esta
 * constante `PERFIS_QUE_EXIGEM_DUPLA_APROVACAO` era efectivamente
 * importada por outro módulo (`validate_identity/validation.service.ts`).
 *
 * Por estar presa dentro do `RoleType` enum morto, esta lista nunca foi
 * actualizada quando novos perfis foram adicionados ao seed —
 * SECRETARIO_GERAL, DIRECTOR_GEPE, DIRECTOR_JURIDICO, DIRECTOR_RH e
 * DIRECTOR_COMUNICACAO_SOCIAL não estavam aqui, apesar de serem perfis
 * privilegiados que, pela mesma lógica dos outros Directores, deveriam
 * exigir dupla aprovação. Corrigido nesta lista (fonte: `PERFIS_DATA` em
 * prisma/seed.ts).
 */
export const PERFIS_QUE_EXIGEM_DUPLA_APROVACAO: string[] = [
  "ADMINISTRADOR_MUNICIPAL",
  "ADMINISTRADOR_ADJUNTO_POLITICA",
  "ADMINISTRADOR_ADJUNTO_ECONOMICA",
  "ADMINISTRADOR_ADJUNTO_TECNICA",

  "SECRETARIO_GERAL",
  "DIRECTOR_GEPE",
  "DIRECTOR_JURIDICO",
  "DIRECTOR_RH",
  "DIRECTOR_COMUNICACAO_SOCIAL",

  "DIRECTOR_EDUCACAO",
  "DIRECTOR_SAUDE",
  "DIRECTOR_DESENVOLVIMENTO_ECONOMICO",
  "DIRECTOR_AMBIENTE_SANEAMENTO",
  "DIRECTOR_TRANSPORTES",
  "DIRECTOR_ACCAO_SOCIAL",
  "DIRECTOR_TURISMO_CULTURA",
  "DIRECTOR_TEMPOS_LIVRES",
  "DIRECTOR_ENERGIA_AGUAS",
  "DIRECTOR_INFRAESTRUTURAS",
  "DIRECTOR_AGRICULTURA",
  "DIRECTOR_REGISTOS",
  "DIRECTOR_FISCALIZACAO",

  "CHEFE_DIRECÇÃO",
];
