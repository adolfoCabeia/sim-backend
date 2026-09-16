import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../notifications/notification.service.js";
import { ProcessoGenericoNaoEncontradoError } from "./process-engine.service.js";
import { emitirMensagemProcesso, emitirLeituraProcesso } from "./process-engine.chat.realtime.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { gerarUrlVisualizacao } from "../../modules/storage/storage.service.js"

export class ChatProcessoNaoAutorizadoError extends Error {}
export class ChatProcessoSemResponsavelError extends Error {}
export class ChatProcessoSemRequerenteError extends Error {}
export class ChatProcessoArquivadoError extends Error {}
export class MensagemVaziaError extends Error {}

async function dispararNotificacao(
  municipioId: string,
  contexto: string,
  fn: (tx: Prisma.TransactionClient) => Promise<void>
): Promise<void> {
  try {
    await withTenantTransaction(municipioId, fn);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[notificacao] Falha ao notificar (${contexto}):`, err);
  }
}

async function garantirParticipante(tx: Prisma.TransactionClient, processoId: string, utilizadorId: string) {
  const processo = await tx.processoGenerico.findUnique({
    where: { id: processoId },
    select: {
      id: true,
      numero: true,
      requerenteUtilizadorId: true,
      responsavelActualId: true,
      arquivoMortoEm: true,
    },
  });
  if (!processo) throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado.");

  if (!processo.responsavelActualId) {
    throw new ChatProcessoSemResponsavelError(
      "Este processo ainda não tem um responsável atribuído, a conversa só fica disponível depois de alguém ser designado para o tratar."
    );
  }

  if (!processo.requerenteUtilizadorId) {
    throw new ChatProcessoSemRequerenteError(
      "Este processo não tem um requerente associado, não há com quem conversar nesta sala."
    );
  }

  const ehRequerente = processo.requerenteUtilizadorId === utilizadorId;
  const ehResponsavelAtual = processo.responsavelActualId === utilizadorId;

  if (!ehRequerente && !ehResponsavelAtual) {
    throw new ChatProcessoNaoAutorizadoError(
      "Só o requerente deste processo e o funcionário actualmente responsável por ele podem participar nesta conversa."
    );
  }

  return { processo, ehRequerente, ehResponsavelAtual };
}

export async function enviarMensagemProcesso(params: {
  municipioId: string;
  processoId: string;
  autorId: string;
  mensagem?: string;
  anexo?: { storageKey: string; nomeFicheiro: string; mimeType: string; tamanhoBytes: number };
}) {
  // 1) Transação: só leituras/escritas de negócio. Nada de rede aqui.
  const { mensagem, numeroProcesso, destinatarioParaNotificar } = await withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const { processo, ehRequerente } = await garantirParticipante(tx, params.processoId, params.autorId);

      if (processo.arquivoMortoEm) {
        throw new ChatProcessoArquivadoError("Este processo está em Arquivo Morto, não é possível enviar novas mensagens.");
      }

      const textoLimpo = params.mensagem?.trim();
      if (!textoLimpo && !params.anexo) {
        throw new MensagemVaziaError("A mensagem tem de conter texto ou um documento anexado.");
      }

      const mensagem = await tx.processoGenericoMensagem.create({
        data: {
          processoId: params.processoId,
          autorId: params.autorId,
          mensagem: textoLimpo || null,
          ...(params.anexo && {
            anexoStorageKey: params.anexo.storageKey,
            anexoNomeFicheiro: params.anexo.nomeFicheiro,
            anexoMimeType: params.anexo.mimeType,
            anexoTamanhoBytes: params.anexo.tamanhoBytes,
          }),
        },
        include: { autor: { select: { nomeCompleto: true } } },
      });

      const destinatarioId = ehRequerente ? processo.responsavelActualId! : processo.requerenteUtilizadorId!;
      const destinatario = await tx.utilizador.findUnique({
        where: { id: destinatarioId },
        select: { email: true, nomeCompleto: true },
      });

      const destinatarioParaNotificar = destinatario
        ? {
            utilizadorDestinoId: destinatarioId,
            email: destinatario.email,
            nomeCompleto: destinatario.nomeCompleto,
          }
        : null;

      return { mensagem, numeroProcesso: processo.numero, destinatarioParaNotificar };
    }
  );

  // 2) Efeitos fora da transação, só depois da escrita confirmada na BD.
  if (destinatarioParaNotificar) {
    const textoLimpo = params.mensagem?.trim();
    await dispararNotificacao(params.municipioId, `enviarMensagemProcesso:${params.processoId}`, async (tx) => {
      await notificarUtilizador(tx, {
        utilizadorDestinoId: destinatarioParaNotificar.utilizadorDestinoId,
        titulo: `Nova mensagem em ${numeroProcesso}`,
        mensagem: textoLimpo
          ? (textoLimpo.length > 140 ? `${textoLimpo.slice(0, 140)}…` : textoLimpo)
          : `Enviou um documento: ${params.anexo!.nomeFicheiro}`,
        tipo: "PROCESSO_ATUALIZADO",
        metadata: { processoId: params.processoId },
        emailDestino: destinatarioParaNotificar.email,
        nomeDestino: destinatarioParaNotificar.nomeCompleto,
      });
    });
  }

  const anexoUrl = mensagem.anexoStorageKey
  ? await gerarUrlVisualizacao(mensagem.anexoStorageKey, 3600)
  : null;

emitirMensagemProcesso(params.processoId, {
  id: mensagem.id,
  mensagem: mensagem.mensagem ?? '',
  autorId: mensagem.autorId,
  autorNome: mensagem.autor.nomeCompleto,
  criadoEm: mensagem.criadoEm,
  anexoUrl,
  anexoNomeFicheiro: mensagem.anexoNomeFicheiro ?? null,
  anexoMimeType: mensagem.anexoMimeType ?? null,
});

return { ...mensagem, anexoUrl };
}

export async function contarNaoLidasProcesso(params: { municipioId: string; processoId: string; viewerId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await garantirParticipante(tx, params.processoId, params.viewerId);
    const total = await tx.processoGenericoMensagem.count({
      where: { processoId: params.processoId, autorId: { not: params.viewerId }, lida: false },
    });
    return { processoId: params.processoId, total };
  });
}

export async function listarMensagensProcesso(params: {
  municipioId: string;
  processoId: string;
  viewerId: string;
  page: number;
  pageSize: number;
}) {
  // 1) Transação: só leituras/escritas de negócio.
  const { items, total, marcadas } = await withTenantTransaction(params.municipioId, async (tx) => {
    await garantirParticipante(tx, params.processoId, params.viewerId);

    const where = { processoId: params.processoId };

    const [items, total] = await Promise.all([
      tx.processoGenericoMensagem.findMany({
        where,
        orderBy: { criadoEm: "asc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { autor: { select: { nomeCompleto: true } } },
      }),
      tx.processoGenericoMensagem.count({ where }),
    ]);

    const { count: marcadas } = await tx.processoGenericoMensagem.updateMany({
      where: { processoId: params.processoId, autorId: { not: params.viewerId }, lida: false },
      data: { lida: true, lidaEm: new Date() },
    });

    return { items, total, marcadas };
  });

  // 2) Efeitos fora da transação, só depois da escrita confirmada na BD.
  if (marcadas > 0) emitirLeituraProcesso(params.processoId, params.viewerId);

  const itemsComUrl = await Promise.all(
    items.map(async (m) => ({
      ...m,
      lida: m.autorId !== params.viewerId && !m.lida ? true : m.lida,
      lidaEm: m.autorId !== params.viewerId && !m.lida ? new Date() : m.lidaEm,
      anexoUrl: m.anexoStorageKey ? await gerarUrlVisualizacao(m.anexoStorageKey, 3600) : null,
    }))
  );

  return {
    items: itemsComUrl,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize) || 1,
  };
}

export async function listarConversasDoUtilizador(params: {
  municipioId: string;
  utilizadorId: string;
  page: number;
  pageSize: number;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where = {
      municipioId: params.municipioId,
      OR: [{ requerenteUtilizadorId: params.utilizadorId }, { responsavelActualId: params.utilizadorId }],
    };

    const [items, total] = await Promise.all([
      tx.processoGenerico.findMany({
        where,
        orderBy: { alteradoEm: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: {
          id: true,
          numero: true,
          assunto: true,
          estado: true,
          requerenteUtilizadorId: true,
          responsavelActualId: true,
          requerente: { select: { nomeCompleto: true } },
          responsavelActual: { select: { nomeCompleto: true } },
        },
      }),
      tx.processoGenerico.count({ where }),
    ]);

    const naoLidasPorProcesso = await tx.processoGenericoMensagem.groupBy({
      by: ["processoId"],
      where: { processoId: { in: items.map((p) => p.id) }, autorId: { not: params.utilizadorId }, lida: false },
      _count: { _all: true },
    });
    const mapaNaoLidas = new Map(naoLidasPorProcesso.map((n) => [n.processoId, n._count._all]));

    return {
      items: items.map((p) => ({ ...p, naoLidas: mapaNaoLidas.get(p.id) ?? 0 })),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    };
  });
}