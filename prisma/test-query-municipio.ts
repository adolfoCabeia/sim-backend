import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString,

  max: 5,

  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,

  keepAlive: true,

  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("\n========== PG POOL ERROR ==========");
  console.error(err);
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL pool: conexão estabelecida");
});

const adapter = new PrismaPg(pool);

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
    console.log("Testando conexão via pg.Pool + PrismaPg...\n");

    console.log("1. SELECT simples...\n");

    const database = await prisma.$queryRaw`
      SELECT
        current_database() AS database,
        current_user AS user,
        version() AS version
    `;

    console.dir(database, { depth: null });

    console.log("\n2. SELECT municipios...\n");

    const municipios = await prisma.$queryRaw`
      SELECT *
      FROM "municipios"
      LIMIT 5
    `;

    console.dir(municipios, { depth: null });

    console.log("\n3. COUNT municipios...\n");

    const count = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM "municipios"
    `;

    console.dir(count, { depth: null });

    console.log("\n4. findUnique via Prisma Model...\n");

    const municipio = await prisma.municipio.findUnique({
      where: {
        codigo: "AO-LUA-TESTE",
      },
    });

    console.log("Municipio:");
    console.dir(municipio, { depth: null });

    console.log("\n✅ TODOS OS TESTES FUNCIONARAM.");
  } catch (error) {
    console.error("\n❌ TESTE FALHOU:");
    console.dir(error, { depth: null });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();