import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
  log: [
    { level: "query", emit: "event" },
    { level: "error", emit: "event" },
  ],
});

prisma.$on("query", (event) => {
  console.log("\n========== QUERY ==========");
  console.log(event.query);
  console.log("Params:", event.params);
  console.log("Duration:", event.duration, "ms");
});

prisma.$on("error", (event) => {
  console.error("\n========== PRISMA ERROR ==========");
  console.error(event);
});

async function main() {
  console.log("Testando UPSERT do Municipio...\n");

  try {
    const municipio = await prisma.municipio.upsert({
      where: {
        codigo: "AO-LUA-TESTE",
      },
      update: {
        nome: "Municipio Teste",
        provincia: "Luanda",
      },
      create: {
        nome: "Municipio Teste",
        codigo: "AO-LUA-TESTE",
        provincia: "Luanda",
      },
    });

    console.log("\nResultado:");
    console.log(municipio);

    console.log("\n✅ UPSERT funcionou.");
  } catch (error) {
    console.error("\n❌ UPSERT FALHOU:");
    console.dir(error, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main();