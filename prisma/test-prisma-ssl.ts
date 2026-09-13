import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida");
}

console.log(
  "Host:",
  connectionString.replace(/^.*@([^/]+)\/.*$/, "$1")
);

const adapter = new PrismaPg({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  try {
    console.log("Testando PrismaPg + SSL...");

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

    console.log("✅ PrismaPg + SSL funciona corretamente.");
  } catch (error) {
    console.error("❌ Erro PrismaPg + SSL:");

    console.dir(error, {
      depth: null,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();