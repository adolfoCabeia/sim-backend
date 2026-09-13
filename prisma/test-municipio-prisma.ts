import { prisma } from "../src/config/prisma.js";

async function main() {
  console.log("Testando criação via Prisma...");

  const municipio = await prisma.municipio.create({
    data: {
      nome: "Talatona",
      codigo: "AO-Talatona-TESTE",
      provincia: "Luanda",
      activo: true,
      criadoEm: new Date(),
      alteradoEm: new Date(),
    },
  });

  console.log("✅ Município criado:");
  console.dir(municipio, { depth: null });
}

main()
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });