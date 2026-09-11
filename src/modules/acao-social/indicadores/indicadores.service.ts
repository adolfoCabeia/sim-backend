import { withTenantTransaction } from "../../../config/prisma.js";

/**
 * Só números agregados. Nunca devolve descrição, beneficiarioId, ou
 * qualquer campo identificável de um CasoSensivel — para isso, é preciso
 * passar pelo módulo de casos sensíveis (com a auditoria a acontecer).
 * Isto é o que fecha a promessa de "relatórios de impacto social sem
 * levantamento manual".
 */
export async function obterIndicadoresGerais(params: { municipioId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const [
      totalCentros,
      centrosPorTipo,
      totalBeneficiarios,
      familiasEmZonasSensiveis,
      criancasSemRegistoCivilAgg,
      casosSensiveisPorEstado,
      pedidosPorTipoEstado,
      kitsAgg,
      programasAtivos,
      participantesGenero,
    ] = await Promise.all([
      tx.centroAcolhimento.count({ where: { estado: "ATIVO" } }),
      tx.centroAcolhimento.groupBy({ by: ["tipo"], where: { estado: "ATIVO" }, _count: { _all: true } }),
      tx.beneficiario.count({ where: { ativo: true } }),
      tx.beneficiario.count({ where: { ativo: true, zonaSensivelId: { not: null } } }),
      tx.beneficiario.aggregate({ where: { ativo: true }, _sum: { criancasSemRegistoCivil: true } }),
      tx.casoSensivel.groupBy({ by: ["estado"], _count: { _all: true } }),
      tx.pedidoApoio.groupBy({ by: ["tipo", "estado"], _count: { _all: true } }),
      tx.distribuicaoKit.aggregate({ _sum: { quantidadeKits: true }, _count: { _all: true } }),
      tx.programaSocial.count({ where: { estado: "ATIVO" } }),
      tx.participanteProgramas.count({ where: { programa: { tipo: "EMPODERAMENTO_GENERO" } } }),
    ]);

    return {
      centros: {
        total: totalCentros,
        porTipo: Object.fromEntries(centrosPorTipo.map((c) => [c.tipo, c._count._all])),
      },
      beneficiarios: {
        total: totalBeneficiarios,
        familiasEmZonasSensiveis,
        criancasSemRegistoCivil: criancasSemRegistoCivilAgg._sum.criancasSemRegistoCivil ?? 0,
      },
      // Só contagens por estado — nunca descrições nem identidades.
      casosSensiveis: {
        porEstado: Object.fromEntries(casosSensiveisPorEstado.map((c) => [c.estado, c._count._all])),
      },
      pedidosApoio: pedidosPorTipoEstado.map((p) => ({ tipo: p.tipo, estado: p.estado, total: p._count._all })),
      distribuicaoKits: {
        totalDistribuicoes: kitsAgg._count._all,
        totalKits: kitsAgg._sum.quantidadeKits ?? 0,
      },
      programasSociais: {
        ativos: programasAtivos,
        participantesEmpoderamentoGenero: participantesGenero,
      },
      geradoEm: new Date(),
    };
  });
}
