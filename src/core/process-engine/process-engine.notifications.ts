import type { Prisma } from "../../generated/prisma/client.js";
import { notificarUtilizador, notificarMultiplos } from "../notifications/notification.service.js";
import { notificarGam } from "../notifications/gam-notifications.js";

export async function notificarCidadaoSubmissao(
  tx: Prisma.TransactionClient,
  params: {
    requerenteId: string;
    email: string;
    nomeCompleto: string;
    telefone?: string | null | undefined;
    numeroProcesso: string;
    processoId: string;
    servicoNome?: string | undefined;
  }
): Promise<void> {
  const mensagem = params.servicoNome
    ? `O seu pedido do serviço "${params.servicoNome}" foi submetido com sucesso. O número do processo é ${params.numeroProcesso}.`
    : `O seu pedido foi submetido com sucesso. O número do processo é ${params.numeroProcesso}.`;

  await notificarUtilizador(tx, {
    utilizadorDestinoId: params.requerenteId,
    titulo: `Processo ${params.numeroProcesso} submetido`,
    mensagem,
    tipo: "PROCESSO_SUBMETIDO",
    metadata: { processoId: params.processoId, numeroProcesso: params.numeroProcesso },
    emailDestino: params.email,
    nomeDestino: params.nomeCompleto,
    telefoneDestino: params.telefone,
    canais: ["APP", "EMAIL", "SMS"],
  });
}

export async function notificarCidadaoTransicao(
  tx: Prisma.TransactionClient,
  params: {
    requerenteId: string;
    email?: string | null | undefined;
    nomeCompleto?: string | null | undefined;
    telefone?: string | null | undefined;
    numeroProcesso: string;
    processoId: string;
    estadoNovo: string;
    observacao?: string | null | undefined;
  }
): Promise<void> {
  await notificarUtilizador(tx, {
    utilizadorDestinoId: params.requerenteId,
    titulo: `Processo ${params.numeroProcesso} — ${params.estadoNovo}`,
    mensagem: params.observacao ?? `O seu processo mudou de estado para "${params.estadoNovo}".`,
    tipo: "PROCESSO_ATUALIZADO",
    metadata: { processoId: params.processoId, numeroProcesso: params.numeroProcesso },
    emailDestino: params.email,
    nomeDestino: params.nomeCompleto,
    telefoneDestino: params.telefone,
    canais: ["APP", "EMAIL"],
  });
}

export async function notificarAtribuicao(
  tx: Prisma.TransactionClient,
  params: {
    funcionarioId: string;
    email?: string | null | undefined;
    nomeCompleto?: string | null | undefined;
    numeroProcesso: string;
    processoId: string;
    atribuidoPorNome: string;
  }
): Promise<void> {
  await notificarUtilizador(tx, {
    utilizadorDestinoId: params.funcionarioId,
    titulo: `Processo ${params.numeroProcesso} atribuído a si`,
    mensagem: `${params.atribuidoPorNome} atribuiu-lhe o processo ${params.numeroProcesso} para tratamento.`,
    tipo: "PROCESSO_ATRIBUIDO",
    metadata: { processoId: params.processoId, numeroProcesso: params.numeroProcesso },
    emailDestino: params.email,
    nomeDestino: params.nomeCompleto,
    canais: ["APP", "EMAIL"],
  });
}
export async function notificarAcaoProcesso(
  tx: Prisma.TransactionClient,
  params: {
    titulo: string;
    mensagem: string;
    tipo: "PROCESSO_ATUALIZADO" | "ACAO_REQUERIDA";
    processoId: string;
    numeroProcesso: string;
    destinatarios: Array<{
      utilizadorId: string;
      email?: string | null;
      nomeCompleto?: string | null;
    }>;
  }
): Promise<void> {
  for (const dest of params.destinatarios) {
    await notificarUtilizador(tx, {
      utilizadorDestinoId: dest.utilizadorId,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: params.tipo,
      metadata: { processoId: params.processoId, numeroProcesso: params.numeroProcesso },
      emailDestino: dest.email,
      nomeDestino: dest.nomeCompleto,
      canais: ["APP", "EMAIL"],
    });
  }
}

export { notificarUtilizador, notificarGam };