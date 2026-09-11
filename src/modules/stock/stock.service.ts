import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { listarUtilizadoresComPermissao } from "../auth/rbac/rbac.service.js";
import type {
  ItemStockCreateInput,
  ItemStockUpdateInput,
  MovimentoStockCreateInput,
} from "./stock.schema.js";

/** Nível mínimo de gravidade a partir do qual se justifica notificar. */
const NIVEIS_NOTIFICAVEIS = new Set(["CRITICO", "MEDIO"]);
/** Ordem de gravidade — usada para saber se o nível SUBIU desde o último alerta enviado. */
const ORDEM_GRAVIDADE: Record<string, number> = { NORMAL: 0, BAIXO: 1, MEDIO: 2, CRITICO: 3 };
/** Não repetir a mesma notificação (mesmo nível) antes disto passar. */
const INTERVALO_MINIMO_REENVIO_HORAS = 24;

// ─── ItemStock ───

export async function listarItensStock(
  filtros: { municipioId: string; categoria?: string | undefined; abaixoMinimo?: boolean | undefined },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const where: Prisma.ItemStockWhereInput = {
      ...(filtros.categoria && { categoria: filtros.categoria }),
    };

    if (filtros.abaixoMinimo) {
      // PRINCÍPIO: Antecipar — mostra itens que ATINGIRAM ou VÃO ATINGIR o ponto crítico
      const todos = await tx.itemStock.findMany({
        where,
        orderBy: { designacao: "asc" },
        include: { movimentos: { take: 1, orderBy: { criadoEm: "desc" } } },
      });
      const filtrados = todos.filter((i) => i.quantidadeActual <= i.pontoReposicao);
      const total = filtrados.length;
      const data = filtrados.slice(skip, skip + paginacao.limit);
      return { data, total };
    }

    const [data, total] = await Promise.all([
      tx.itemStock.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { designacao: "asc" },
        include: { movimentos: { take: 5, orderBy: { criadoEm: "desc" } } },
      }),
      tx.itemStock.count({ where }),
    ]);

    return { data, total };
  });
}

export async function obterItemStock(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.itemStock.findUnique({
      where: { id },
      include: { movimentos: { orderBy: { criadoEm: "desc" } } },
    });
  });
}

export async function criarItemStock(municipioId: string, dados: ItemStockCreateInput) {
  // PRINCÍPIO: Ao criar, se não definir pontoReposicao, assume 20% acima do mínimo
  // para garantir alerta ANTES de atingir o mínimo absoluto
  const pontoReposicao = dados.pontoReposicao > 0
    ? dados.pontoReposicao
    : Math.max(1, Math.ceil(dados.quantidadeMinima * 1.2));

  return withTenantTransaction(municipioId, async (tx) => {
    return tx.itemStock.create({
      data: { ...dados, municipioId, pontoReposicao } as Prisma.ItemStockUncheckedCreateInput,
    });
  });
}

export async function atualizarItemStock(id: string, municipioId: string, dados: ItemStockUpdateInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.itemStock.findUniqueOrThrow({ where: { id } });
    return tx.itemStock.update({ where: { id }, data: dados as Prisma.ItemStockUncheckedUpdateInput });
  });
}

export async function removerItemStock(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.itemStock.findUniqueOrThrow({ where: { id } });
    return tx.itemStock.delete({ where: { id } });
  });
}

// ─── ALERTAS DE REPOSIÇÃO ───
// PRINCÍPIO: Antecipar ruptura — alerta dispara no pontoReposicao, NUNCA depois de zero

export async function listarAlertasReposicao(municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const itens = await tx.itemStock.findMany({
      include: { movimentos: { orderBy: { criadoEm: "desc" }, take: 1 } },
      orderBy: { designacao: "asc" },
    });

    const alertas = itens
      .map((item) => {
        const diasAteRuptura = calcularDiasAteRuptura(item);
        const nivel = determinarNivelAlerta(diasAteRuptura, item);

        // PRINCÍPIO: Alerta ativa quando:
        // 1. Quantidade já atingiu ou está abaixo do ponto de reposição, OU
        // 2. Estima-se ruptura em ≤ 7 dias (tempo mínimo de reação)
        const atingiuPontoReposicao = item.quantidadeActual <= item.pontoReposicao;
        const rupturaIminente = diasAteRuptura !== null && diasAteRuptura <= 7;
        const necessitaReposicao = atingiuPontoReposicao || rupturaIminente;

        return {
          item,
          diasAteRuptura,
          nivel,
          atingiuPontoReposicao,
          rupturaIminente,
          necessitaReposicao,
          mensagem: gerarMensagemAlerta(item, diasAteRuptura, nivel, atingiuPontoReposicao),
        };
      })
      .filter((a) => a.necessitaReposicao)
      .sort((a, b) => {
        const ordem: Record<string, number> = { CRITICO: 0, MEDIO: 1, BAIXO: 2, NORMAL: 3 };
        return (ordem[a.nivel] ?? 3) - (ordem[b.nivel] ?? 3);
      });

    return alertas;
  });
}

function calcularDiasAteRuptura(item: {
  cicloReposicaoMeses: number | null;
  quantidadeActual: number;
  movimentos: Array<{ criadoEm: Date }>;
}): number | null {
  if (!item.cicloReposicaoMeses || item.quantidadeActual <= 0) return null;
  const ultimoMovimento = item.movimentos[0];
  if (!ultimoMovimento) return null;

  // PRINCÍPIO: Calcula com base no ciclo de reposição configurado
  const diasCiclo = item.cicloReposicaoMeses * 30;
  const diasDecorridos = Math.floor(
    (new Date().getTime() - ultimoMovimento.criadoEm.getTime()) / (1000 * 60 * 60 * 24)
  );
  const diasRestantes = diasCiclo - diasDecorridos;
  return Math.max(0, diasRestantes);
}

function determinarNivelAlerta(
  dias: number | null,
  item: { quantidadeActual: number; quantidadeMinima: number; pontoReposicao: number }
): "CRITICO" | "MEDIO" | "BAIXO" | "NORMAL" {
  // PRINCÍPIO: Três níveis com antecedência mínima de 7 dias
  if (item.quantidadeActual <= 0) return "CRITICO";
  if (dias === null) {
    if (item.quantidadeActual <= item.quantidadeMinima) return "CRITICO";
    if (item.quantidadeActual <= item.pontoReposicao) return "MEDIO";
    return "NORMAL";
  }
  if (dias <= 3) return "CRITICO";
  if (dias <= 7) return "MEDIO";
  if (dias <= 15) return "BAIXO";
  return "NORMAL";
}

function gerarMensagemAlerta(
  item: { designacao: string; quantidadeActual: number; unidadeMedida: string },
  dias: number | null,
  nivel: string,
  atingiuPonto: boolean
): string {
  if (item.quantidadeActual <= 0) {
    return `RUTURA CONSUMADA: ${item.designacao} está com stock ZERO. Reposição imediata obrigatória.`;
  }
  if (atingiuPonto) {
    return `PONTO DE REPOSIÇÃO ATINGIDO: ${item.designacao} (${item.quantidadeActual} ${item.unidadeMedida}). ${dias !== null ? `Ruptura estimada em ${dias} dias.` : ""}`;
  }
  if (dias !== null && dias <= 7) {
    return `RUTURA IMINENTE: ${item.designacao} esgota-se em ${dias} dias. Tempo mínimo de reação (7 dias) comprometido.`;
  }
  return `Alerta ${nivel}: ${item.designacao}`;
}

// ─── MOVIMENTO DE STOCK ───
// PRINCÍPIO: Nunca permitir saída que cause ruptura abaixo do mínimo

export async function criarMovimentoStock(
  municipioId: string,
  dados: MovimentoStockCreateInput & { utilizadorId: string }
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const item = await tx.itemStock.findUniqueOrThrow({ where: { id: dados.itemStockId } });

    let quantidadePosterior = item.quantidadeActual;

    if (dados.tipo === "ENTRADA" || dados.tipo === "AJUSTE") {
      quantidadePosterior += dados.quantidade;
    } else if (dados.tipo === "SAIDA") {
      // PRINCÍPIO: BLOQUEIA saída que levaria stock abaixo do mínimo
      if (item.quantidadeActual < dados.quantidade) {
        throw new Error(
          `SAÍDA BLOQUEADA: Quantidade solicitada (${dados.quantidade}) excede stock actual (${item.quantidadeActual}). ` +
          `Não é permitido criar ruptura de stock.`
        );
      }

      const saldoAposSaida = item.quantidadeActual - dados.quantidade;
      if (saldoAposSaida < item.quantidadeMinima) {
        throw new Error(
          `SAÍDA BLOQUEADA: Saldo após saída (${saldoAposSaida}) ficaria abaixo do mínimo operacional (${item.quantidadeMinima}). ` +
          `Reposição obrigatória antes de nova saída. PRINCÍPIO: Não esperar que o serviço termine para reagir.`
        );
      }

      quantidadePosterior -= dados.quantidade;
    }

    const movimento = await tx.movimentoStock.create({
      data: {
        itemStockId: dados.itemStockId,
        tipo: dados.tipo,
        quantidade: dados.quantidade,
        quantidadeAnterior: item.quantidadeActual,
        quantidadePosterior,
        motivo: dados.motivo,
        documentoRef: dados.documentoRef ?? null,
        utilizadorId: dados.utilizadorId,
      },
    });

    await tx.itemStock.update({
      where: { id: dados.itemStockId },
      data: { quantidadeActual: quantidadePosterior },
    });

    // PRINCÍPIO: Se após movimento atingiu ponto de reposição, loga aviso implícito
    if (quantidadePosterior <= item.pontoReposicao && dados.tipo === "SAIDA") {
      console.warn(`[ALERTA PREVENTIVO] Item ${item.designacao} atingiu ponto de reposição após saída. Stock: ${quantidadePosterior}`);
    }

    return movimento;
  });
}

export async function listarMovimentosStock(
  filtros: {
    municipioId: string;
    itemStockId?: string | undefined;
    tipo?: Prisma.EnumTipoMovimentoStockFilter<"MovimentoStock"> | "ENTRADA" | "SAIDA" | "AJUSTE" | undefined;
    desde?: Date | undefined;
    ate?: Date | undefined;
  },
  paginacao: { page: number; limit: number }
) {
  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const where: Prisma.MovimentoStockWhereInput = {
      ...(filtros.itemStockId && { itemStockId: filtros.itemStockId }),
      ...(filtros.tipo && { tipo: filtros.tipo as "ENTRADA" | "SAIDA" | "AJUSTE" }),
    };
    if (filtros.desde || filtros.ate) {
      where.criadoEm = {
        ...(filtros.desde && { gte: filtros.desde }),
        ...(filtros.ate && { lte: filtros.ate }),
      };
    }

    const skip = (paginacao.page - 1) * paginacao.limit;

    const [data, total] = await Promise.all([
      tx.movimentoStock.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { criadoEm: "desc" },
        include: { itemStock: true },
      }),
      tx.movimentoStock.count({ where }),
    ]);

    return { data, total };
  });
}

// ─── NOTIFICAÇÃO PROACTIVA DE ALERTAS ───
// PRINCÍPIO: "Não esperar que o serviço termine para reagir" (secção 8.3.3) —
// isto é o que faltava: `listarAlertasReposicao` já calculava tudo correctamente,
// mas nada a chamava proactivamente. Pensado para correr 1x/dia via worker
// (ver src/plugins/infra/alertas-operacionais-worker.ts).
//
// Como o ItemStock não tem um "responsável" próprio (ao contrário de
// ManutencaoProgramada), notifica-se quem tiver a permissão "stock:gerir"
// no município (tipicamente Secretaria Geral / Logística).

export async function notificarAlertasReposicaoPendentes(params: {
  municipioId: string;
}): Promise<{ notificados: number }> {
  const alertas = await listarAlertasReposicao(params.municipioId);
  const relevantes = alertas.filter((a) => NIVEIS_NOTIFICAVEIS.has(a.nivel));
  if (relevantes.length === 0) return { notificados: 0 };

  return withTenantTransaction(params.municipioId, async (tx) => {
    const destinatarios = await listarUtilizadoresComPermissao(tx, "stock:gerir");
    if (destinatarios.length === 0) return { notificados: 0 };

    let notificados = 0;
    const agora = new Date();

    for (const alerta of relevantes) {
      const item = alerta.item;
      const jaNotificadoRecentemente =
        item.ultimoAlertaEnviadoEm &&
        agora.getTime() - new Date(item.ultimoAlertaEnviadoEm).getTime() <
          INTERVALO_MINIMO_REENVIO_HORAS * 60 * 60_000;
      const gravidadeSubiu =
        (ORDEM_GRAVIDADE[alerta.nivel] ?? 0) > (ORDEM_GRAVIDADE[item.ultimoNivelAlertaEnviado ?? "NORMAL"] ?? 0);

      if (jaNotificadoRecentemente && !gravidadeSubiu) continue;

      for (const destinatario of destinatarios) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: destinatario.id,
          titulo: `Alerta de stock [${alerta.nivel}]: ${item.designacao}`,
          mensagem: alerta.mensagem,
          tipo: "ACAO_REQUERIDA",
          metadata: { itemStockId: item.id, nivel: alerta.nivel },
          emailDestino: destinatario.emailConfirmado ? destinatario.email : null,
          nomeDestino: destinatario.nomeCompleto,
          telefoneDestino: destinatario.telefone,
        });
      }

      await tx.itemStock.update({
        where: { id: item.id },
        data: { ultimoAlertaEnviadoEm: agora, ultimoNivelAlertaEnviado: alerta.nivel },
      });
      notificados += 1;
    }

    return { notificados };
  });
}