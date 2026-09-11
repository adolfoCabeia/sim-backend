#!/usr/bin/env node
/**
 * Teste de carga da API SIM-VIANA — usa `autocannon` (biblioteca Node,
 * sem binário externo a instalar) contra um servidor JÁ A CORRER
 * (`npm run dev` ou `npm start` noutro terminal).
 *
 * USO:
 *   node tests/load/load-test.mjs
 *
 * CONFIGURAÇÃO (variáveis de ambiente, todas opcionais):
 *   LOAD_TEST_BASE_URL       (default: http://localhost:3000)
 *   LOAD_TEST_DURATION       segundos por cenário (default: 15)
 *   LOAD_TEST_CONNECTIONS    ligações concorrentes (default: 20)
 *   LOAD_TEST_EMAIL          credenciais para o cenário autenticado
 *   LOAD_TEST_PASSWORD
 *   LOAD_TEST_ITEM_STOCK_ID  um ID real de item de stock, para o cenário 4b
 *                            (escrita) — sem isto, esse cenário específico
 *                            falha com 404/400, mas os restantes correm na mesma.
 *
 * Sem LOAD_TEST_EMAIL/PASSWORD, os cenários que exigem autenticação são
 * saltados automaticamente (com aviso) — só corre o cenário público.
 *
 * NOTA DE ÂMBITO: isto testa a CAMADA HTTP (Fastify + rotas + validação +
 * ida à base de dados) sob concorrência — não substitui testes de carga
 * mais realistas com dados de produção nem testa o comportamento dos
 * workers em background (alertas-operacionais, process-engine).
 */

import autocannon from "  ";

const BASE_URL = process.env.LOAD_TEST_BASE_URL ?? "http://localhost:3000";
const DURATION = Number(process.env.LOAD_TEST_DURATION ?? 15);
const CONNECTIONS = Number(process.env.LOAD_TEST_CONNECTIONS ?? 20);
const EMAIL = process.env.LOAD_TEST_EMAIL;
const PASSWORD = process.env.LOAD_TEST_PASSWORD;

/** Formata um resultado do autocannon num resumo legível em português. */
function resumir(resultado) {
  return {
    pedidosPorSegundo: resultado.requests.average,
    latenciaMediaMs: resultado.latency.average,
    latenciaP99Ms: resultado.latency.p99,
    erros: resultado.errors,
    timeouts: resultado.timeouts,
    codigos2xx: resultado["2xx"],
    codigosNao2xx: resultado.non2xx,
  };
}

function imprimirResumo(titulo, resultado) {
  const r = resumir(resultado);
  console.log(`\n── ${titulo} ──`);
  console.log(`  Pedidos/seg (média):     ${r.pedidosPorSegundo}`);
  console.log(`  Latência média:          ${r.latenciaMediaMs} ms`);
  console.log(`  Latência p99:            ${r.latenciaP99Ms} ms`);
  console.log(`  Respostas 2xx:           ${r.codigos2xx}`);
  console.log(`  Respostas NÃO-2xx:       ${r.codigosNao2xx}`);
  console.log(`  Erros de ligação:        ${r.erros}`);
  console.log(`  Timeouts:                ${r.timeouts}`);

  if (r.codigosNao2xx > 0) {
    console.warn(`  ⚠ Há respostas não-2xx — investigar antes de considerar o resultado válido.`);
  }
  if (r.erros > 0 || r.timeouts > 0) {
    console.warn(`  ⚠ Há erros/timeouts de ligação — o servidor pode estar a saturar nesta concorrência.`);
  }
}

async function autenticar() {
  if (!EMAIL || !PASSWORD) {
    console.warn(
      "\n⚠ LOAD_TEST_EMAIL/LOAD_TEST_PASSWORD não definidos — a saltar os cenários autenticados.\n" +
        "  Define-os (uma conta de teste, nunca uma de produção) para testar as rotas protegidas.\n"
    );
    return null;
  }

  const resposta = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador: EMAIL, password: PASSWORD }),
  });

  if (!resposta.ok) {
    console.error(`\n✗ Falha ao autenticar (${resposta.status}) — a saltar os cenários autenticados.`);
    return null;
  }

  const dados = await resposta.json();
  const token = dados.accessToken ?? dados.token ?? dados?.data?.accessToken;
  if (!token) {
    console.error("\n✗ Login respondeu 2xx mas não encontrei o accessToken no corpo — a saltar cenários autenticados.");
    return null;
  }
  return token;
}

async function correrCenario(titulo, opcoes) {
  const resultado = await autocannon({
    url: BASE_URL,
    duration: DURATION,
    connections: CONNECTIONS,
    ...opcoes,
  });
  imprimirResumo(titulo, resultado);
  return resultado;
}

async function main() {
  console.log(`Teste de carga SIM-VIANA`);
  console.log(`Alvo: ${BASE_URL}  |  Duração/cenário: ${DURATION}s  |  Ligações: ${CONNECTIONS}`);

  // ── Cenário 1: endpoint público, sem BD (baseline do próprio Fastify) ──
  await correrCenario("Cenário 1 — GET /health (baseline, sem BD)", {
    requests: [{ method: "GET", path: "/health" }],
  });

  // ── Cenário 2: login sob carga (bcrypt + BD — tipicamente o mais pesado) ──
  if (EMAIL && PASSWORD) {
    await correrCenario("Cenário 2 — POST /auth/login (bcrypt + BD)", {
      connections: Math.min(CONNECTIONS, 10), // bcrypt é caro de propósito — não exagerar aqui
      requests: [
        {
          method: "POST",
          path: "/auth/login",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ identificador: EMAIL, password: PASSWORD }),
        },
      ],
    });
  }

  // ── Cenário 3: rotas autenticadas típicas, com token real ──
  const token = await autenticar();
  if (token) {
    const headers = { authorization: `Bearer ${token}` };

    await correrCenario("Cenário 3a — GET /dashboards/minha-direccao (agregação, autenticado)", {
      requests: [{ method: "GET", path: "/dashboards/minha-direccao", headers }],
    });

    await correrCenario("Cenário 3b — GET /documentos (listagem paginada, autenticado)", {
      requests: [{ method: "GET", path: "/documentos", headers }],
    });

    await correrCenario("Cenário 3c — GET /stock/alertas (cálculo em memória por item, autenticado)", {
      requests: [{ method: "GET", path: "/stock/alertas", headers }],
    });

    // ── Cenário 4: os pontos mais prováveis de saturar o pool de 5 ligações ──
    // Cada um destes abre a sua própria transacção (withTenantTransaction) —
    // é aqui, não nos GETs simples, que o limite de 5 ligações aparece primeiro.
    await correrCenario("Cenário 4a — GET /dashboards/administrador (7 queries agregadas numa só transacção)", {
      requests: [{ method: "GET", path: "/dashboards/administrador", headers }],
    });

    await correrCenario("Cenário 4b — POST /stock/movimentos (escrita + validação de regra de negócio)", {
      connections: Math.min(CONNECTIONS, 5), // de propósito — é o tamanho real do pool
      requests: [
        {
          method: "POST",
          path: "/stock/movimentos",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            itemStockId: process.env.LOAD_TEST_ITEM_STOCK_ID ?? "SUBSTITUIR-POR-UM-ID-REAL",
            tipo: "AJUSTE",
            quantidade: 1,
            motivo: "Teste de carga — ajuste neutro",
          }),
        },
      ],
    });
  }

  console.log("\nConcluído. Para um teste mais realista, corre isto contra um ambiente com dados representativos");
  console.log("(não em produção) e repete com CONNECTIONS crescentes (ex.: 10, 50, 100, 200) para encontrar o ponto de saturação.");
}

main().catch((erro) => {
  console.error("Falha ao correr o teste de carga:", erro);
  process.exit(1);
});
