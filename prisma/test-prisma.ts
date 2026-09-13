import "dotenv/config";

import { prisma } from "../src/config/prisma.js";

async function main() {
  try {
    console.log("Testando Prisma Client REAL...");

    const resultado = await prisma.$queryRaw<
      {
        current_database: string;
        current_user: string;
        version: string;
      }[]
    >`
      SELECT
        current_database(),
        current_user,
        version();
    `;

    console.log("Resultado:");
    console.table(resultado);

    const municipios = await prisma.municipio.count();

    console.log("Municípios:", municipios);

    console.log("✅ Prisma Client real conectado corretamente.");
  } catch (error) {
    console.error("❌ Erro:");

    console.dir(error, {
      depth: null,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();