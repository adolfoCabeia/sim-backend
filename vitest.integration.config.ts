import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 30_000, // aplicar todas as migrações a sério demora mais do que os unitários
    hookTimeout: 30_000,
  },
});