import { prisma, withTenantTransaction } from "../../config/prisma.js";

const ESTADOS_PROCESSO = [
  "RECEBIDO",
  "EM_ANALISE",
  "EM_PARECER",
  "AGUARDANDO_DESPACHO",
  "DEFERIDO",
  "INDEFERIDO",
  "CONCLUIDO",
  "DEVOLVIDO",
] as const;

const ESTADOS_PROCESSO_ABERTOS = ESTADOS_PROCESSO.filter((e) => e !== "CONCLUIDO");

export class DireccaoNaoEncontradaError extends Error {}

async function contarProcessosPorEstado(
  tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0],
  where: { direcaoAtualId?: string }
) {
  const contagens = await Promise.all(
    ESTADOS_PROCESSO.map((estado) => tx.processoGenerico.count({ where: { ...where, estado } }))
  );
  return Object.fromEntries(ESTADOS_PROCESSO.map((estado, i) => [estado, contagens[i]]));
}

export async function obterDashboardDireccao(municipioId: string, direcaoId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const direcao = await tx.direcao.findUnique({
      where: { id: direcaoId },
      select: { id: true, nome: true, sigla: true, tipo: true },
    });
    if (!direcao) throw new DireccaoNaoEncontradaError("Direcção não encontrada.");

    const agora = new Date();
    const daqui7Dias = new Date(agora);
    daqui7Dias.setDate(agora.getDate() + 7);

    const [
      processosPorEstado,
      processosPrazoProximo,
      processosEmAtraso,
      totalDocumentos,
      funcionariosAtivos,
    ] = await Promise.all([
      contarProcessosPorEstado(tx, { direcaoAtualId: direcaoId }),
      tx.processoGenerico.count({
        where: {
          direcaoAtualId: direcaoId,
          estado: { in: [...ESTADOS_PROCESSO_ABERTOS] },
          prazoLegalResposta: { gte: agora, lte: daqui7Dias },
        },
      }),
      tx.processoGenerico.count({
        where: {
          direcaoAtualId: direcaoId,
          estado: { in: [...ESTADOS_PROCESSO_ABERTOS] },
          prazoLegalResposta: { lt: agora },
        },
      }),
      tx.documento.count({ where: { pasta: { direcaoId } } }),
      tx.funcionario.count({ where: { estado: "ATIVO", direcaoId } }), // ← CORRIGIDO AQUI
    ]);

    return {
      direcao,
      processos: {
        porEstado: processosPorEstado,
        prazoProximo7Dias: processosPrazoProximo,
        emAtraso: processosEmAtraso,
      },
      documentos: { total: totalDocumentos },
      pessoal: { activos: funcionariosAtivos },
    };
  });
}

export async function obterDashboardAdministrador(municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const agora = new Date();
    const daqui7Dias = new Date(agora);
    daqui7Dias.setDate(agora.getDate() + 7);

    const [
      processosPorEstado,
      processosEmAtraso,
      totalDireccoes,
      totalFuncionariosAtivos,
      totalOcorrenciasAbertas,
      totalComissoesAtivas,
      totalFiscalizacoesPorTipo,
    ] = await Promise.all([
      contarProcessosPorEstado(tx, {}),
      tx.processoGenerico.count({
        where: { estado: { in: [...ESTADOS_PROCESSO_ABERTOS] }, prazoLegalResposta: { lt: agora } },
      }),
      tx.direcao.count(),
      tx.funcionario.count({ where: { estado: "ATIVO" } }),
      tx.ocorrencia.count({ where: { estado: { notIn: ["RESOLVIDA", "ARQUIVADA"] } } }),
      tx.comissaoModeradores.count({ where: { estado: "ACTIVA" } }),
      Promise.all(
        (["AUTO_NOTICIA", "CONTRA_ORDENACAO", "VISTORIA"] as const).map(async (tipoAccao) => [
          tipoAccao,
          await tx.fiscalizacaoDetalhe.count({ where: { tipoAccao } }),
        ])
      ),
    ]);

    return {
      processos: {
        porEstado: processosPorEstado,
        emAtraso: processosEmAtraso,
      },
      organizacao: { totalDireccoes, totalFuncionariosAtivos },
      ocorrenciasComunitarias: { abertas: totalOcorrenciasAbertas },
      comissoesModeradores: { activas: totalComissoesAtivas },
      fiscalizacao: Object.fromEntries(totalFiscalizacoesPorTipo),
    };
  });
}

// ─── Painel de Transparência (público, secção 19.4) ───

export async function obterPainelTransparencia(municipioId: string) {
  const municipio = await prisma.municipio.findUnique({
    where: { id: municipioId },
    select: { id: true, nome: true, activo: true },
  });
  if (!municipio || !municipio.activo) {
    throw new DireccaoNaoEncontradaError("Município não encontrado ou inactivo.");
  }

  return withTenantTransaction(municipioId, async (tx) => {
    const [processosConcluidos, processosPendentes, totalDireccoes, totalObrasEmCurso] = await Promise.all([
      tx.processoGenerico.count({ where: { estado: "CONCLUIDO" } }),
      tx.processoGenerico.count({ where: { estado: { in: [...ESTADOS_PROCESSO_ABERTOS] } } }),
      tx.direcao.count(),
      tx.processoGenerico.count({
        where: { tipo: "REQUISICAO_EMPREITADA", estado: { in: [...ESTADOS_PROCESSO_ABERTOS] } },
      }),
    ]);

    return {
      municipio: { id: municipio.id, nome: municipio.nome },
      processos: { concluidos: processosConcluidos, pendentes: processosPendentes },
      organizacao: { totalDireccoes },
      obrasPublicasEmCurso: totalObrasEmCurso,
    };
  });
}