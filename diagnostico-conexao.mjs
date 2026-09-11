/**
 * Diagnóstico de ligação — corre FORA do Prisma/Fastify, com o driver
 * `pg` puro, para isolar se o problema é a rede/Supabase ou algo no
 * teu código de aplicação.
 *
 * Como correr:
 *   cd backend
 *   node diagnostico-conexao.mjs
 *
 * Não precisa de mais nada instalado — usa o "pg" que já está em
 * node_modules.
 */
import { Client } from "pg";
import { readFileSync } from "node:fs";
import dns from "node:dns";

// Lê a DATABASE_URL directamente do .env, sem passar pelo teu env.ts,
// para o teste ficar o mais "cru" possível.
const envFile = readFileSync(new URL("./.env", import.meta.url), "utf-8");
const match = envFile.match(/^DATABASE_URL="(.+)"$/m);
if (!match) {
  console.error("Não encontrei DATABASE_URL no .env");
  process.exit(1);
}
const connectionString = match[1];

const NUM_TENTATIVAS = 10;
const INTERVALO_MS = 1500;

function agora() {
  return new Date().toISOString().split("T")[1].slice(0, 12);
}

async function testarLigacao(tentativa, forcarIPv4) {
  const inicio = Date.now();
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 8000,
  });

  try {
    await client.connect();
    const ligarMs = Date.now() - inicio;

    const inicioQuery = Date.now();
    await client.query("SELECT 1");
    const queryMs = Date.now() - inicioQuery;

    console.log(
      `[${agora()}] ${forcarIPv4 ? "IPv4  " : "padrão"} #${tentativa} ✅ sucesso — ligar: ${ligarMs}ms, query: ${queryMs}ms, total: ${Date.now() - inicio}ms`
    );
    await client.end();
    return { ok: true, ligarMs };
  } catch (error) {
    const totalMs = Date.now() - inicio;
    console.log(
      `[${agora()}] ${forcarIPv4 ? "IPv4  " : "padrão"} #${tentativa} ❌ FALHOU depois de ${totalMs}ms — ${error.message}`
    );
    try {
      await client.end();
    } catch {
      // já morreu, ignora
    }
    return { ok: false, ligarMs: null };
  }
}

console.log(`A testar ligação a: ${connectionString.replace(/:[^:@]+@/, ":****@")}`);
console.log(`${NUM_TENTATIVAS} tentativas com DNS padrão, depois ${NUM_TENTATIVAS} forçando IPv4...\n`);

const resultadosPadrao = [];
for (let i = 1; i <= NUM_TENTATIVAS; i++) {
  resultadosPadrao.push(await testarLigacao(i, false));
  if (i < NUM_TENTATIVAS) await new Promise((r) => setTimeout(r, INTERVALO_MS));
}

console.log("");
// dns.setDefaultResultOrder é global e afecta dns.lookup() em todo o
// processo — é a forma oficial e documentada do Node para preferir
// endereços IPv4 antes de IPv6. Aplicamos só agora, depois do lote
// "padrão" já ter corrido, precisamente para conseguirmos comparar os
// dois comportamentos num único processo sem ambiguidade.
dns.setDefaultResultOrder("ipv4first");
const resultadosIPv4 = [];
for (let i = 1; i <= NUM_TENTATIVAS; i++) {
  resultadosIPv4.push(await testarLigacao(i, true));
  if (i < NUM_TENTATIVAS) await new Promise((r) => setTimeout(r, INTERVALO_MS));
}

function resumo(resultados, label) {
  const sucessos = resultados.filter((r) => r.ok);
  const falhas = resultados.length - sucessos.length;
  const media = sucessos.length
    ? Math.round(sucessos.reduce((a, r) => a + r.ligarMs, 0) / sucessos.length)
    : null;
  console.log(
    `${label}: ${sucessos.length} sucesso(s), ${falhas} falha(s), tempo médio a ligar: ${media ?? "n/a"}ms`
  );
}

console.log("\n=== Resumo ===");
resumo(resultadosPadrao, "DNS padrão");
resumo(resultadosIPv4, "Forçado a IPv4");
console.log(
  "\nSe o tempo médio a ligar com IPv4 forçado for MUITO menor (ex.: <1000ms vs >3000ms), " +
    "confirma que o problema é resolução de IPv6 avariada — e a correcção é forçar IPv4 no pool do Prisma."
);

