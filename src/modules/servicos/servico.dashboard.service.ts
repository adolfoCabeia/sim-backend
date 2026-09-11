import { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { resolverAmbito, DirecaoNaoAutorizadaError } from "../receitas/receita.service.js";
import { resolverPeriodo, formatarDataISO, type TipoPeriodo } from "../receitas/receita.periodos.js";

interface FiltroPeriodo {
  municipioId: string;
  utilizadorId: string;
  tipo: TipoPeriodo;
  dataInicio?: string | undefined;
  dataFim?: string | undefined;
  direcaoId?: string | undefined;
}

function paraNumero(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === "number") return valor;
  if (typeof valor === "bigint") return Number(valor);
  return Number(valor);
}

function adicionarDias(data: Date, dias: number): Date {
  const copia = new Date(data.getTime());
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

/** Fragmento SQL comum: junta pagamentos -> processos_genericos -> servicos, filtrado
 * por município, estado PAGO, o intervalo de datas e (quando aplicável) o âmbito de
 * direcções que o utilizador pode ver. A RLS de cada tabela já impõe o isolamento por
 * município de forma independente; o filtro explícito aqui é apenas defesa em
 * profundidade. */
async function construirFiltro(params: FiltroPeriodo, intervalo: { inicio: Date; fim: Date }) {
  const ambito = await resolverAmbito({
    municipioId: params.municipioId,
    utilizadorId: params.utilizadorId,
    direcaoIdQuery: params.direcaoId,
  });

  const fimExclusivo = adicionarDias(intervalo.fim, 1);

  const condicaoDirecao = ambito.direcaoIds
    ? Prisma.sql`AND s."direcaoResponsavelId" IN (${Prisma.join(ambito.direcaoIds)})`
    : Prisma.empty;

  const baseWhere = Prisma.sql`
    p."municipioId" = ${params.municipioId}
    AND p.estado = 'PAGO'
    AND p."pagoEm" >= ${intervalo.inicio}
    AND p."pagoEm" < ${fimExclusivo}
    ${condicaoDirecao}
  `;

  const baseFrom = Prisma.sql`
    FROM pagamentos p
    JOIN processos_genericos pg ON pg.id = p."processoId"
    LEFT JOIN servicos s ON s."municipioId" = p."municipioId" AND s.codigo = pg."servicoCodigo"
  `;

  return { baseFrom, baseWhere, ambito };
}

export async function obterResumoPagamentos(params: FiltroPeriodo) {
  const periodo = resolverPeriodo(params);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const { baseFrom, baseWhere } = await construirFiltro(params, periodo.atual);

    const totalGeralLinhas = await tx.$queryRaw<{ total: Prisma.Decimal | null; operacoes: bigint }[]>(
      Prisma.sql`SELECT SUM(p.valor) AS total, COUNT(*) AS operacoes ${baseFrom} WHERE ${baseWhere}`
    );
    const totalArrecadado = paraNumero(totalGeralLinhas[0]?.total);
    const numeroOperacoes = paraNumero(totalGeralLinhas[0]?.operacoes);

    const porServico = await tx.$queryRaw<
      { servico_codigo: string | null; servico_nome: string; total: Prisma.Decimal; operacoes: bigint }[]
    >(
      Prisma.sql`
        SELECT pg."servicoCodigo" AS servico_codigo,
               COALESCE(s.nome, pg."servicoCodigo", 'Sem serviço associado') AS servico_nome,
               SUM(p.valor) AS total,
               COUNT(*) AS operacoes
        ${baseFrom}
        WHERE ${baseWhere}
        GROUP BY pg."servicoCodigo", COALESCE(s.nome, pg."servicoCodigo", 'Sem serviço associado')
        ORDER BY total DESC
      `
    );

    const porDia = await tx.$queryRaw<{ dia: Date; total: Prisma.Decimal; operacoes: bigint }[]>(
      Prisma.sql`
        SELECT p."pagoEm"::date AS dia, SUM(p.valor) AS total, COUNT(*) AS operacoes
        ${baseFrom}
        WHERE ${baseWhere}
        GROUP BY 1
        ORDER BY total DESC
      `
    );

    const servicos = porServico.map((s) => {
      const total = paraNumero(s.total);
      const operacoes = paraNumero(s.operacoes);
      return {
        servicoCodigo: s.servico_codigo,
        servicoNome: s.servico_nome,
        totalArrecadado: total,
        numeroOperacoes: operacoes,
        valorMedioPorOperacao: operacoes > 0 ? total / operacoes : 0,
        percentualDoTotal: totalArrecadado > 0 ? (total / totalArrecadado) * 100 : 0,
      };
    });

    const diaComMais = porDia[0];
    const diaComMenos = porDia[porDia.length - 1];

    return {
      periodo: { tipo: periodo.tipo, inicio: formatarDataISO(periodo.atual.inicio), fim: formatarDataISO(periodo.atual.fim) },
      totalArrecadado,
      numeroOperacoes,
      servicoQueMaisArrecadou: servicos[0] ?? null,
      servicoQueMenosArrecadou: servicos[servicos.length - 1] ?? null,
      diaComMaisArrecadacao: diaComMais ? { data: formatarDataISO(diaComMais.dia), totalArrecadado: paraNumero(diaComMais.total) } : null,
      diaComMenosArrecadacao: diaComMenos ? { data: formatarDataISO(diaComMenos.dia), totalArrecadado: paraNumero(diaComMenos.total) } : null,
      maiorValorNumUnicoDia: diaComMais ? paraNumero(diaComMais.total) : 0,
      porServico: servicos,
    };
  });
}

export async function obterComparacaoPagamentos(params: FiltroPeriodo) {
  const periodo = resolverPeriodo(params);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const [{ baseFrom: fromAtual, baseWhere: whereAtual }, { baseFrom: fromAnterior, baseWhere: whereAnterior }] = await Promise.all([
      construirFiltro(params, periodo.atual),
      construirFiltro(params, periodo.anterior),
    ]);

    const [atualLinhas, anteriorLinhas] = await Promise.all([
      tx.$queryRaw<{ total: Prisma.Decimal | null; operacoes: bigint }[]>(
        Prisma.sql`SELECT SUM(p.valor) AS total, COUNT(*) AS operacoes ${fromAtual} WHERE ${whereAtual}`
      ),
      tx.$queryRaw<{ total: Prisma.Decimal | null; operacoes: bigint }[]>(
        Prisma.sql`SELECT SUM(p.valor) AS total, COUNT(*) AS operacoes ${fromAnterior} WHERE ${whereAnterior}`
      ),
    ]);

    const valorAtual = paraNumero(atualLinhas[0]?.total);
    const valorAnterior = paraNumero(anteriorLinhas[0]?.total);
    const diferencaAbsoluta = valorAtual - valorAnterior;
    const variacaoPercentual = valorAnterior > 0 ? (diferencaAbsoluta / valorAnterior) * 100 : valorAtual > 0 ? 100 : 0;

    return {
      tipo: periodo.tipo,
      periodoAtual: {
        inicio: formatarDataISO(periodo.atual.inicio),
        fim: formatarDataISO(periodo.atual.fim),
        totalArrecadado: valorAtual,
        numeroOperacoes: paraNumero(atualLinhas[0]?.operacoes),
      },
      periodoAnterior: {
        inicio: formatarDataISO(periodo.anterior.inicio),
        fim: formatarDataISO(periodo.anterior.fim),
        totalArrecadado: valorAnterior,
        numeroOperacoes: paraNumero(anteriorLinhas[0]?.operacoes),
      },
      diferencaAbsoluta,
      variacaoPercentual,
      tendencia: diferencaAbsoluta > 0 ? "CRESCIMENTO" : diferencaAbsoluta < 0 ? "REDUCAO" : "ESTAVEL",
    };
  });
}

export async function obterEvolucaoPagamentos(params: FiltroPeriodo & { granularidade: "dia" | "mes" }) {
  const periodo = resolverPeriodo(params);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const { baseFrom, baseWhere } = await construirFiltro(params, periodo.atual);

    if (params.granularidade === "dia") {
      const linhas = await tx.$queryRaw<{ dia: Date; total: Prisma.Decimal; operacoes: bigint }[]>(
        Prisma.sql`
          SELECT p."pagoEm"::date AS dia, SUM(p.valor) AS total, COUNT(*) AS operacoes
          ${baseFrom}
          WHERE ${baseWhere}
          GROUP BY 1
          ORDER BY 1 ASC
        `
      );
      return linhas.map((l) => ({ data: formatarDataISO(l.dia), totalArrecadado: paraNumero(l.total), numeroOperacoes: paraNumero(l.operacoes) }));
    }

    const linhas = await tx.$queryRaw<{ mes: Date; total: Prisma.Decimal; operacoes: bigint }[]>(
      Prisma.sql`
        SELECT date_trunc('month', p."pagoEm") AS mes, SUM(p.valor) AS total, COUNT(*) AS operacoes
        ${baseFrom}
        WHERE ${baseWhere}
        GROUP BY 1
        ORDER BY 1 ASC
      `
    );
    return linhas.map((l) => ({ mes: formatarDataISO(l.mes).slice(0, 7), totalArrecadado: paraNumero(l.total), numeroOperacoes: paraNumero(l.operacoes) }));
  });
}

export async function obterRankingDiasPagamentos(params: FiltroPeriodo & { ordem: "maior" | "menor"; limite: number }) {
  const periodo = resolverPeriodo(params);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const { baseFrom, baseWhere } = await construirFiltro(params, periodo.atual);
    const direcaoOrdem = params.ordem === "maior" ? Prisma.sql`DESC` : Prisma.sql`ASC`;

    const linhas = await tx.$queryRaw<{ dia: Date; total: Prisma.Decimal; operacoes: bigint }[]>(
      Prisma.sql`
        SELECT p."pagoEm"::date AS dia, SUM(p.valor) AS total, COUNT(*) AS operacoes
        ${baseFrom}
        WHERE ${baseWhere}
        GROUP BY 1
        ORDER BY total ${direcaoOrdem}
        LIMIT ${params.limite}
      `
    );

    return linhas.map((l, indice) => ({
      posicao: indice + 1,
      data: formatarDataISO(l.dia),
      totalArrecadado: paraNumero(l.total),
      numeroOperacoes: paraNumero(l.operacoes),
    }));
  });
}

export async function obterResumoPorDirecaoPagamentos(params: FiltroPeriodo) {
  const ambito = await resolverAmbito({
    municipioId: params.municipioId,
    utilizadorId: params.utilizadorId,
    direcaoIdQuery: params.direcaoId,
  });

  if (!ambito.podeVerTodas) {
    throw new DirecaoNaoAutorizadaError("Não tem permissão para consultar o resumo de todas as direcções.");
  }

  const periodo = resolverPeriodo(params);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const { baseFrom, baseWhere } = await construirFiltro(params, periodo.atual);

    const linhas = await tx.$queryRaw<
      { direcao_id: string | null; direcao_nome: string; direcao_sigla: string | null; total: Prisma.Decimal; operacoes: bigint }[]
    >(
      Prisma.sql`
        SELECT d.id AS direcao_id,
               COALESCE(d.nome, 'Sem direcção associada') AS direcao_nome,
               d.sigla AS direcao_sigla,
               SUM(p.valor) AS total,
               COUNT(*) AS operacoes
        ${baseFrom}
        LEFT JOIN direcoes d ON d.id = s."direcaoResponsavelId"
        WHERE ${baseWhere}
        GROUP BY d.id, d.nome, d.sigla
        ORDER BY total DESC
      `
    );

    const totalGeral = linhas.reduce((soma, l) => soma + paraNumero(l.total), 0);

    return {
      periodo: { tipo: periodo.tipo, inicio: formatarDataISO(periodo.atual.inicio), fim: formatarDataISO(periodo.atual.fim) },
      totalGeral,
      direcoes: linhas.map((l) => {
        const total = paraNumero(l.total);
        return {
          direcaoId: l.direcao_id,
          direcao: l.direcao_id ? { id: l.direcao_id, nome: l.direcao_nome, sigla: l.direcao_sigla } : null,
          totalArrecadado: total,
          numeroOperacoes: paraNumero(l.operacoes),
          percentualDoTotal: totalGeral > 0 ? (total / totalGeral) * 100 : 0,
        };
      }),
    };
  });
}
