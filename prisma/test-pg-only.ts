import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("❌ PG POOL ERROR:");
  console.error(err);
});

async function main() {
  try {
    console.log("Testando pg puro...\n");

    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS user,
        version()
    `);

    console.log("✅ PostgreSQL respondeu:");
    console.table(result.rows);

    const municipios = await pool.query(`
      SELECT *
      FROM "municipios"
      LIMIT 5
    `);

    console.log("\nMunicipios:");
    console.table(municipios.rows);

    console.log("\n✅ PG PURO FUNCIONOU.");
  } catch (error) {
    console.error("\n❌ PG PURO FALHOU:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();