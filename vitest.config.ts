import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts", "tests/**/*.{test,spec}.ts"],
    // Testes de integração (precisam de DATABASE_URL_TEST — ver
    // tests/README.md) ficam separados por convenção de nome
    // ("*.integration.test.ts") para poderem ser corridos à parte:
    //   npm run test              -> só unitários (rápidos, sem BD)
    //   npm run test:integration  -> só integração (precisa de BD de teste)
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.integration.test.ts"],
    testTimeout: 10_000,
  },
});