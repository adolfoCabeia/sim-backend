import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";

const LIMITE_MAXIMO_EXPORTACAO = 10_000;

export interface FiltrosLogsAuditoria {
  municipioId: string;
  utilizadorId?: string | undefined;
  entidade?: string | undefined;
  entidadeId?: string | undefined;
  accao?: string | undefined;
  desde?: Date | undefined;
  ate?: Date | undefined;
}

function buildWhere(filtros: Omit<FiltrosLogsAuditoria, "municipioId">): Prisma.LogAuditoriaWhereInput {
  const where: Prisma.LogAuditoriaWhereInput = {
    ...(filtros.utilizadorId && { utilizadorId: filtros.utilizadorId }),
    ...(filtros.entidade && { entidade: filtros.entidade }),
    ...(filtros.entidadeId && { entidadeId: filtros.entidadeId }),
    ...(filtros.accao && { accao: filtros.accao }),
  };

  if (filtros.desde || filtros.ate) {
    where.criadoEm = {
      ...(filtros.desde && { gte: filtros.desde }),
      ...(filtros.ate && { lte: filtros.ate }),
    };
  }

  return where;
}

export async function listarLogsAuditoria(
  filtros: FiltrosLogsAuditoria,
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where = buildWhere(filtros);

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.logAuditoria.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { criadoEm: "desc" },
        include: {
          utilizador: { select: { id: true, nomeCompleto: true, email: true } },
        },
      }),
      tx.logAuditoria.count({ where }),
    ]);

    return { data, total };
  });
}

export async function obterLogAuditoria(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.logAuditoria.findUnique({
      where: { id },
      include: { utilizador: { select: { id: true, nomeCompleto: true, email: true } } },
    });
  });
}

export async function listarLogsParaExportacao(filtros: FiltrosLogsAuditoria) {
  const where = buildWhere(filtros);

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const logs = await tx.logAuditoria.findMany({
      where,
      orderBy: { criadoEm: "asc" },
      take: LIMITE_MAXIMO_EXPORTACAO,
      include: { utilizador: { select: { nomeCompleto: true, email: true } } },
    });

    return logs.map((log) => ({
      criadoEm: log.criadoEm.toISOString(),
      utilizador: log.utilizador?.nomeCompleto ?? "(sistema / utilizador removido)",
      email: log.utilizador?.email ?? "",
      accao: log.accao,
      entidade: log.entidade,
      entidadeId: log.entidadeId ?? "",
      ipOrigem: log.ipOrigem ?? "",
      detalhes: log.detalhes ? JSON.stringify(log.detalhes) : "",
    }));
  });
}

export function gerarCsv(linhas: Array<Record<string, string>>): string {
  if (linhas.length === 0) return "";

  const cabecalhos = Object.keys(linhas[0] as Record<string, string>);
  const escapar = (valor: string) => `"${valor.replace(/"/g, '""')}"`;

  const cabecalhoCsv = cabecalhos.map(escapar).join(",");
  const linhasCsv = linhas.map((linha) => cabecalhos.map((campo) => escapar(linha[campo] ?? "")).join(","));

  return [cabecalhoCsv, ...linhasCsv].join("\n");
}