import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // ACHADO DE AUDITORIA: estava "tests/integration/**" — directório que
    // não existe no projecto (os testes de integração estão em
    // "test/", singular, na raiz). `npm run test:integration` nunca
    // encontrava nem corria rls.isolation.integration.test.ts.
    include: ["test/**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 30_000, // aplicar todas as migrações a sério demora mais do que os unitários
    hookTimeout: 30_000,
  },
});