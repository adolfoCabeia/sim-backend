/**
 * Ponto de extensão: cada referenciaTipo precisa de um resolver que vá
 * buscar o conteúdo ACTUAL do documento na sua própria tabela. É isto que
 * torna a verificação pública auto-suficiente (não depende do chamador
 * enviar o conteúdo).
 */
type ConteudoResolver = (referenciaId: string, municipioId: string) => Promise<string | null>;

const resolvers = new Map<string, ConteudoResolver>();

export function registrarResolverConteudo(referenciaTipo: string, resolver: ConteudoResolver) {
  resolvers.set(referenciaTipo, resolver);
}

export async function resolverConteudoAtual(
  referenciaTipo: string,
  referenciaId: string,
  municipioId: string
): Promise<string | null> {
  const resolver = resolvers.get(referenciaTipo);
  if (!resolver) {
    throw new Error(`Nenhum resolver de conteúdo registado para referenciaTipo="${referenciaTipo}".`);
  }
  return resolver(referenciaId, municipioId);
}

// Exemplo de registo (adaptar aos teus módulos reais, chamar no bootstrap da app):
// import { withTenantTransaction } from "../../config/prisma.js";
// registrarResolverConteudo("DESPACHO", async (id, municipioId) =>
//   withTenantTransaction(municipioId, (tx) => tx.despacho.findUnique({ where: { id } }).then(d => d?.texto ?? null))
// );