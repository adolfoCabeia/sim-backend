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
  try {
    console.log("1. Testando findUnique...\n");

    const existente = await prisma.municipio.findUnique({
      where: {
        codigo: "AO-LUA-TESTE",
      },
    });

    console.log("findUnique:", existente);

    console.log("\n2. Testando create...\n");

    const criado = await prisma.municipio.create({
      data: {
        nome: "Municipio Teste",
        codigo: "AO-LUA-TESTE",
        provincia: "Luanda",
      },
    });

    console.log("\nResultado create:");
    console.log(criado);

    console.log("\n3. Testando update...\n");

    const atualizado = await prisma.municipio.update({
      where: {
        id: criado.id,
      },
      data: {
        nome: "Municipio Teste Atualizado",
      },
    });

    console.log("\nResultado update:");
    console.log(atualizado);

    console.log("\n4. Testando findUnique novamente...\n");

    const final = await prisma.municipio.findUnique({
      where: {
        codigo: "AO-LUA-TESTE",
      },
    });

    console.log("Resultado final:", final);

    console.log("\n✅ FIND + CREATE + UPDATE FUNCIONARAM.");
  } catch (error) {
    console.error("\n❌ TESTE FALHOU:");
    console.dir(error, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main();