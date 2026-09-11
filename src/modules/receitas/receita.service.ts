import { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { getPerfisDoUtilizador } from "../auth/rbac/rbac.service.js";
import { resolverPeriodo, formatarDataISO, type TipoPeriodo } from "./receita.periodos.js";
import type {
  CriarReceitaInput,
  ActualizarReceitaInput,
  ListarReceitasQuery,
} from "./receita.schema.js";

export class ReceitaNaoEncontradaError extends Error {}
export class DirecaoNaoAutorizadaError extends Error {}
export class DirecaoInvalidaError extends Error {}

const PERFIS_VISAO_GLOBAL = new Set([
  "SUPER_ADMIN",
  "ADMINISTRADOR_MUNICIPAL",
  "SECRETARIO_GERAL",
  "ADMINISTRADOR_ADJUNTO_ECONOMICA",
  "DIRECTOR_GEPE",
]);

interface AmbitoReceita {
  direcaoIds: string[] | null;
  direcaoPropriaId: string | null;
  podeVerTodas: boolean;
}

async function resolverAmbito(params: {
  municipioId: string;
  utilizadorId: string;
  direcaoIdQuery?: string | undefined;
}): Promise<AmbitoReceita> {
  const [perfis, utilizador] = await withTenantTransaction(params.municipioId, async (tx) => {
    return Promise.all([
      getPerfisDoUtilizador(params.utilizadorId, params.municipioId),
      tx.utilizador.findUnique({ where: { id: params.utilizadorId }, select: { direcaoId: true } }),
    ]);
  });

  const podeVerTodas = perfis.some((p: { nome: string }) => PERFIS_VISAO_GLOBAL.has(p.nome));
  const direcaoPropriaId = utilizador?.direcaoId ?? null;

  if (podeVerTodas) {
    return {
      direcaoIds: params.direcaoIdQuery ? [params.direcaoIdQuery] : null,
      direcaoPropriaId,
      podeVerTodas: true,
    };
  }

  if (!direcaoPropriaId) {
    throw new DirecaoNaoAutorizadaError(
      "O seu utilizador não está associado a nenhuma direcção. Contacte o administrador."
    );
  }

  if (params.direcaoIdQuery && params.direcaoIdQuery !== direcaoPropriaId) {
    throw new DirecaoNaoAutorizadaError("Só pode consultar/lançar receitas da sua própria direcção.");
  }

  return { direcaoIds: [direcaoPropriaId], direcaoPropriaId, podeVerTodas: false };
}

function paraNumero(valor: Prisma.Decimal | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  return typeof valor === "number" ? valor : Number(valor);
}

function dataDeISO(valor: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!match) {
    throw new DirecaoInvalidaError(`Data inválida: ${valor}. Utilize o formato AAAA-MM-DD.`);
  }
  const [, anoStr, mesStr, diaStr] = match;
  return new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr)));
}

export async function criarReceita(params: {
  municipioId: string;
  utilizadorId: string;
  input: CriarReceitaInput;
}) {
  const ambito = await resolverAmbito({
    municipioId: params.municipioId,
    utilizadorId: params.utilizadorId,
    direcaoIdQuery: params.input.direcaoId,
  });

  const direcaoId = params.input.direcaoId ?? ambito.direcaoPropriaId;
  if (!direcaoId) {
    throw new DirecaoInvalidaError("Indique a direcção (direcaoId) para este lançamento de receita.");
  }

  return withTenantTransaction(params.municipioId, async (tx) => {
    const direcao = await tx.direcao.findFirst({ where: { id: direcaoId, municipioId: params.municipioId } });
    if (!direcao) {
      throw new DirecaoInvalidaError("Direcção não encontrada neste município.");
    }

    return tx.receita.create({
      data: {
        municipioId: params.municipioId,
        direcaoId,
        data: dataDeISO(params.input.data),
        orgaoArrecadador: params.input.orgaoArrecadador,
        servicoNome: params.input.servicoNome,
        servicoCodigo: params.input.servicoCodigo ?? null,
        numeroDli: params.input.numeroDli ?? null,
        valorCobradoDli: params.input.valorCobradoDli,
        numeroDar: params.input.numeroDar ?? null,
        valorPagoDar: params.input.valorPagoDar,
        numeroRupe: params.input.numeroRupe ?? null,
        observacao: params.input.observacao ?? null,
        criadoPorId: params.utilizadorId,
      },
      include: { direcao: { select: { id: true, nome: true, sigla: true } } },
    });
  });
}

export async function actualizarReceita(params: {
  municipioId: string;
  utilizadorId: string;
  receitaId: string;
  input: ActualizarReceitaInput;
}) {
  await resolverAmbitoDaReceita(params.municipioId, params.utilizadorId, params.receitaId);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.receita.findFirst({ where: { id: params.receitaId, municipioId: params.municipioId } });
    if (!existente) {
      throw new ReceitaNaoEncontradaError("Registo de receita não encontrado.");
    }

    const {
      direcaoId,
      data,
      orgaoArrecadador,
      servicoNome,
      servicoCodigo,
      numeroDli,
      valorCobradoDli,
      numeroDar,
      valorPagoDar,
      numeroRupe,
      observacao,
    } = params.input;

    if (direcaoId !== undefined) {
      const direcao = await tx.direcao.findFirst({ where: { id: direcaoId, municipioId: params.municipioId } });
      if (!direcao) {
        throw new DirecaoInvalidaError("Direcção não encontrada neste município.");
      }
    }

    return tx.receita.update({
      where: { id: params.receitaId },
      data: {
        ...(direcaoId !== undefined && { direcaoId }),
        ...(data !== undefined && { data: dataDeISO(data) }),
        ...(orgaoArrecadador !== undefined && { orgaoArrecadador }),
        ...(servicoNome !== undefined && { servicoNome }),
        ...(servicoCodigo !== undefined && { servicoCodigo }),
        ...(numeroDli !== undefined && { numeroDli }),
        ...(valorCobradoDli !== undefined && { valorCobradoDli }),
        ...(numeroDar !== undefined && { numeroDar }),
        ...(valorPagoDar !== undefined && { valorPagoDar }),
        ...(numeroRupe !== undefined && { numeroRupe }),
        ...(observacao !== undefined && { observacao }),
        alteradoPorId: params.utilizadorId,
      },
      include: { direcao: { select: { id: true, nome: true, sigla: true } } },
    });
  });
}

export async function removerReceita(params: { municipioId: string; utilizadorId: string; receitaId: string }) {
  await resolverAmbitoDaReceita(params.municipioId, params.utilizadorId, params.receitaId);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.receita.findFirst({ where: { id: params.receitaId, municipioId: params.municipioId } });
    if (!existente) {
      throw new ReceitaNaoEncontradaError("Registo de receita não encontrado.");
    }
    await tx.receita.delete({ where: { id: params.receitaId } });
    return { id: params.receitaId };
  });
}

/** Verifica que o utilizador tem permissão sobre a direcção dona do registo antes de editar/remover. */
async function resolverAmbitoDaReceita(municipioId: string, utilizadorId: string, receitaId: string) {
  const direcaoDoRegisto = await withTenantTransaction(municipioId, async (tx) => {
    const receita = await tx.receita.findFirst({ where: { id: receitaId, municipioId }, select: { direcaoId: true } });
    return receita?.direcaoId ?? null;
  });

  if (!direcaoDoRegisto) {
    throw new ReceitaNaoEncontradaError("Registo de receita não encontrado.");
  }

  await resolverAmbito({ municipioId, utilizadorId, direcaoIdQuery: direcaoDoRegisto });
}

export async function listarReceitas(params: {
  municipioId: string;
  utilizadorId: string;
  query: ListarReceitasQuery;
}) {
  const ambito = await resolverAmbito({
    municipioId: params.municipioId,
    utilizadorId: params.utilizadorId,
    direcaoIdQuery: params.query.direcaoId,
  });

  const where: Prisma.ReceitaWhereInput = {
    municipioId: params.municipioId,
    ...(ambito.direcaoIds ? { direcaoId: { in: ambito.direcaoIds } } : {}),
    ...(params.query.dataInicio || params.query.dataFim
      ? {
          data: {
            ...(params.query.dataInicio ? { gte: dataDeISO(params.query.dataInicio) } : {}),
            ...(params.query.dataFim ? { lte: dataDeISO(params.query.dataFim) } : {}),
          },
        }
      : {}),
    ...(params.query.servicoNome ? { servicoNome: { contains: params.query.servicoNome, mode: "insensitive" } } : {}),
  };

  return withTenantTransaction(params.municipioId, async (tx) => {
    const [items, total] = await Promise.all([
      tx.receita.findMany({
        where,
        orderBy: { [params.query.ordenarPor]: params.query.ordem },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        include: { direcao: { select: { id: true, nome: true, sigla: true } } },
      }),
      tx.receita.count({ where }),
    ]);

    return {
      items: items.map(formatarReceita),
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

function formatarReceita(r: {
  id: string;
  direcaoId: string;
  data: Date;
  orgaoArrecadador: string;
  servicoNome: string;
  servicoCodigo: string | null;
  numeroDli: string | null;
  valorCobradoDli: Prisma.Decimal;
  numeroDar: string | null;
  valorPagoDar: Prisma.Decimal;
  numeroRupe: string | null;
  observacao: string | null;
  criadoEm: Date;
  alteradoEm: Date;
  direcao?: { id: string; nome: string; sigla: string };
}) {
  return {
    id: r.id,
    direcaoId: r.direcaoId,
    direcao: r.direcao,
    data: formatarDataISO(r.data),
    orgaoArrecadador: r.orgaoArrecadador,
    servicoNome: r.servicoNome,
    servicoCodigo: r.servicoCodigo,
    numeroDli: r.numeroDli,
    valorCobradoDli: paraNumero(r.valorCobradoDli),
    numeroDar: r.numeroDar,
    valorPagoDar: paraNumero(r.valorPagoDar),
    numeroRupe: r.numeroRupe,
    observacao: r.observacao,
    criadoEm: r.criadoEm,
    alteradoEm: r.alteradoEm,
  };
}

// ---------------------------------------------------------------------------
// Agregações do dashboard — sempre calculadas na base de dados (groupBy/aggregate),
// nunca a somar transacções em memória no backend nem no frontend.
// ---------------------------------------------------------------------------

interface FiltroPeriodo {
  municipioId: string;
  utilizadorId: string;
  tipo: TipoPeriodo;
  dataInicio?: string | undefined;
  dataFim?: string | undefined;
  direcaoId?: string | undefined;
}

async function whereDoPeriodo(params: FiltroPeriodo, intervalo: { inicio: Date; fim: Date }) {
  const ambito = await resolverAmbito({
    municipioId: params.municipioId,
    utilizadorId: params.utilizadorId,
    direcaoIdQuery: params.direcaoId,
  });

  const where: Prisma.ReceitaWhereInput = {
    municipioId: params.municipioId,
    data: { gte: intervalo.inicio, lte: intervalo.fim },
    ...(ambito.direcaoIds ? { direcaoId: { in: ambito.direcaoIds } } : {}),
  };
  return { where, ambito };
}

export async function obterResumoFinanceiro(params: FiltroPeriodo) {
  const periodo = resolverPeriodo(params);
  const { where } = await whereDoPeriodo(params, periodo.atual);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const [totalGeral, porServico, porOrgao, porDia] = await Promise.all([
      tx.receita.aggregate({ where, _sum: { valorPagoDar: true }, _count: { _all: true } }),
      tx.receita.groupBy({
        by: ["servicoNome"],
        where,
        _sum: { valorPagoDar: true },
        _count: { _all: true },
        orderBy: { _sum: { valorPagoDar: "desc" } },
      }),
      tx.receita.groupBy({
        by: ["orgaoArrecadador"],
        where,
        _sum: { valorPagoDar: true },
        _count: { _all: true },
        orderBy: { _sum: { valorPagoDar: "desc" } },
      }),
      tx.receita.groupBy({
        by: ["data"],
        where,
        _sum: { valorPagoDar: true },
        orderBy: { _sum: { valorPagoDar: "desc" } },
      }),
    ]);

    const totalArrecadado = paraNumero(totalGeral._sum.valorPagoDar);

    const servicos = porServico.map((s: (typeof porServico)[number]) => {
      const total = paraNumero(s._sum.valorPagoDar);
      const operacoes = s._count._all;
      return {
        servicoNome: s.servicoNome,
        totalArrecadado: total,
        numeroOperacoes: operacoes,
        valorMedioPorOperacao: operacoes > 0 ? total / operacoes : 0,
        percentualDoTotal: totalArrecadado > 0 ? (total / totalArrecadado) * 100 : 0,
      };
    });

    const orgaos = porOrgao.map((o: (typeof porOrgao)[number]) => {
      const total = paraNumero(o._sum.valorPagoDar);
      return {
        orgaoArrecadador: o.orgaoArrecadador,
        totalArrecadado: total,
        numeroOperacoes: o._count._all,
        percentualDoTotal: totalArrecadado > 0 ? (total / totalArrecadado) * 100 : 0,
      };
    });

    const diaComMais = porDia[0];
    const diaComMenos = porDia[porDia.length - 1];

    return {
      periodo: { tipo: periodo.tipo, inicio: formatarDataISO(periodo.atual.inicio), fim: formatarDataISO(periodo.atual.fim) },
      totalArrecadado,
      numeroOperacoes: totalGeral._count._all,
      servicoQueMaisArrecadou: servicos[0] ?? null,
      servicoQueMenosArrecadou: servicos[servicos.length - 1] ?? null,
      diaComMaisArrecadacao: diaComMais
        ? { data: formatarDataISO(diaComMais.data), totalArrecadado: paraNumero(diaComMais._sum.valorPagoDar) }
        : null,
      diaComMenosArrecadacao: diaComMenos
        ? { data: formatarDataISO(diaComMenos.data), totalArrecadado: paraNumero(diaComMenos._sum.valorPagoDar) }
        : null,
      maiorValorNumUnicoDia: diaComMais ? paraNumero(diaComMais._sum.valorPagoDar) : 0,
      porServico: servicos,
      porOrgaoArrecadador: orgaos,
    };
  });
}

export async function obterComparacaoPeriodos(params: FiltroPeriodo) {
  const periodo = resolverPeriodo(params);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const [{ where: whereAtual }, { where: whereAnterior }] = await Promise.all([
      whereDoPeriodo(params, periodo.atual),
      whereDoPeriodo(params, periodo.anterior),
    ]);

    const [atual, anterior] = await Promise.all([
      tx.receita.aggregate({ where: whereAtual, _sum: { valorPagoDar: true }, _count: { _all: true } }),
      tx.receita.aggregate({ where: whereAnterior, _sum: { valorPagoDar: true }, _count: { _all: true } }),
    ]);

    const valorAtual = paraNumero(atual._sum.valorPagoDar);
    const valorAnterior = paraNumero(anterior._sum.valorPagoDar);
    const diferencaAbsoluta = valorAtual - valorAnterior;
    const variacaoPercentual = valorAnterior > 0 ? (diferencaAbsoluta / valorAnterior) * 100 : valorAtual > 0 ? 100 : 0;

    return {
      tipo: periodo.tipo,
      periodoAtual: {
        inicio: formatarDataISO(periodo.atual.inicio),
        fim: formatarDataISO(periodo.atual.fim),
        totalArrecadado: valorAtual,
        numeroOperacoes: atual._count._all,
      },
      periodoAnterior: {
        inicio: formatarDataISO(periodo.anterior.inicio),
        fim: formatarDataISO(periodo.anterior.fim),
        totalArrecadado: valorAnterior,
        numeroOperacoes: anterior._count._all,
      },
      diferencaAbsoluta,
      variacaoPercentual,
      tendencia: diferencaAbsoluta > 0 ? "CRESCIMENTO" : diferencaAbsoluta < 0 ? "REDUCAO" : "ESTAVEL",
    };
  });
}

export async function obterEvolucaoTemporal(params: FiltroPeriodo & { granularidade: "dia" | "mes" }) {
  const periodo = resolverPeriodo(params);
  const { where } = await whereDoPeriodo(params, periodo.atual);

  return withTenantTransaction(params.municipioId, async (tx) => {
    if (params.granularidade === "dia") {
      const linhas = await tx.receita.groupBy({
        by: ["data"],
        where,
        _sum: { valorPagoDar: true },
        _count: { _all: true },
        orderBy: { data: "asc" },
      });
      return linhas.map((l: (typeof linhas)[number]) => ({
        data: formatarDataISO(l.data),
        totalArrecadado: paraNumero(l._sum.valorPagoDar),
        numeroOperacoes: l._count._all,
      }));
    }

    // Agregação mensal feita na base de dados (evita carregar transacções para o Node).
    const linhas = await tx.$queryRaw<{ mes: Date; total: Prisma.Decimal; operacoes: bigint }[]>(
      Prisma.sql`
        SELECT date_trunc('month', "data") AS mes, SUM("valorPagoDar") AS total, COUNT(*) AS operacoes
        FROM "receitas"
        WHERE "municipioId" = ${params.municipioId}
          AND "data" >= ${periodo.atual.inicio}
          AND "data" <= ${periodo.atual.fim}
          ${where.direcaoId && typeof where.direcaoId === "object" && "in" in where.direcaoId
            ? Prisma.sql`AND "direcaoId" IN (${Prisma.join(where.direcaoId.in as string[])})`
            : Prisma.empty}
        GROUP BY 1
        ORDER BY 1 ASC
      `
    );

    return linhas.map((l) => ({
      mes: formatarDataISO(l.mes).slice(0, 7),
      totalArrecadado: paraNumero(l.total),
      numeroOperacoes: Number(l.operacoes),
    }));
  });
}

export async function obterRankingDias(params: FiltroPeriodo & { ordem: "maior" | "menor"; limite: number }) {
  const periodo = resolverPeriodo(params);
  const { where } = await whereDoPeriodo(params, periodo.atual);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const linhas = await tx.receita.groupBy({
      by: ["data"],
      where,
      _sum: { valorPagoDar: true },
      _count: { _all: true },
      orderBy: { _sum: { valorPagoDar: params.ordem === "maior" ? "desc" : "asc" } },
      take: params.limite,
    });

    return linhas.map((l: (typeof linhas)[number], indice: number) => ({
      posicao: indice + 1,
      data: formatarDataISO(l.data),
      totalArrecadado: paraNumero(l._sum.valorPagoDar),
      numeroOperacoes: l._count._all,
    }));
  });
}

export async function obterVisaoDiaria(params: { municipioId: string; utilizadorId: string; direcaoId?: string | undefined }) {
  const [hoje, ontem, evolucaoMes] = await Promise.all([
    obterResumoFinanceiro({ ...params, tipo: "HOJE" }),
    obterResumoFinanceiro({ ...params, tipo: "ONTEM" }),
    obterEvolucaoTemporal({ ...params, tipo: "ESTE_MES", granularidade: "dia" }),
  ]);

  const diferenca = hoje.totalArrecadado - ontem.totalArrecadado;
  const variacaoPercentual = ontem.totalArrecadado > 0 ? (diferenca / ontem.totalArrecadado) * 100 : hoje.totalArrecadado > 0 ? 100 : 0;

  return {
    hoje: { totalArrecadado: hoje.totalArrecadado, numeroOperacoes: hoje.numeroOperacoes, servicoQueMaisArrecadou: hoje.servicoQueMaisArrecadou },
    ontem: { totalArrecadado: ontem.totalArrecadado, numeroOperacoes: ontem.numeroOperacoes },
    diferencaAbsoluta: diferenca,
    variacaoPercentual,
    evolucaoDoMes: evolucaoMes,
  };
}

export async function obterResumoPorDirecao(params: FiltroPeriodo) {
  const ambito = await resolverAmbito({
    municipioId: params.municipioId,
    utilizadorId: params.utilizadorId,
    direcaoIdQuery: params.direcaoId,
  });

  if (!ambito.podeVerTodas) {
    throw new DirecaoNaoAutorizadaError("Não tem permissão para consultar o resumo de todas as direcções.");
  }

  const periodo = resolverPeriodo(params);
  const { where } = await whereDoPeriodo(params, periodo.atual);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const [porDirecao, totalGeralAgg] = await Promise.all([
      tx.receita.groupBy({
        by: ["direcaoId"],
        where,
        _sum: { valorPagoDar: true },
        _count: { _all: true },
        orderBy: { _sum: { valorPagoDar: "desc" } },
      }),
      tx.receita.aggregate({ where, _sum: { valorPagoDar: true } }),
    ]);

    const totalGeral = paraNumero(totalGeralAgg._sum.valorPagoDar);
    const direcaoIds = porDirecao.map((d: (typeof porDirecao)[number]) => d.direcaoId);
    const direcoes = await tx.direcao.findMany({ where: { id: { in: direcaoIds } }, select: { id: true, nome: true, sigla: true } });
    const direcaoPorId = new Map(direcoes.map((d) => [d.id, d]));

    return {
      periodo: { tipo: periodo.tipo, inicio: formatarDataISO(periodo.atual.inicio), fim: formatarDataISO(periodo.atual.fim) },
      totalGeral,
      direcoes: porDirecao.map((d: (typeof porDirecao)[number]) => {
        const total = paraNumero(d._sum.valorPagoDar);
        return {
          direcaoId: d.direcaoId,
          direcao: direcaoPorId.get(d.direcaoId) ?? null,
          totalArrecadado: total,
          numeroOperacoes: d._count._all,
          percentualDoTotal: totalGeral > 0 ? (total / totalGeral) * 100 : 0,
        };
      }),
    };
  });
}

export { resolverAmbito };
