import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida");
}

console.log(
  "Host:",
  connectionString.replace(/^.*@([^/]+)\/.*$/, "$1")
);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  try {
    console.log("Testando pg diretamente com SSL...");

    const result = await pool.query(`
      SELECT
        current_database(),
        current_user,
        version();
    `);

    console.log("Resultado:");
    console.table(result.rows);

    console.log("✅ pg + SSL conecta corretamente.");
  } catch (error) {
    console.error("❌ Erro do pg + SSL:");

    console.dir(error, {
      depth: null,
    });
  } finally {
    await pool.end();
  }
}

main();