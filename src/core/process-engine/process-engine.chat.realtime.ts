import { getIO } from "../../plugins/realtime/sockets.js";

export function salaProcesso(processoId: string): string {
  return `processo:${processoId}`;
}

export interface MensagemProcesso {
  id: string;
  mensagem: string | null;
  autorId: string;
  autorNome: string;
  criadoEm: Date;
  /** Optional URL for an attached file */
  anexoUrl?: string | null;
  /** Optional file name of the attachment */
  anexoNomeFicheiro?: string | null;
  /** Optional MIME type of the attachment */
  anexoMimeType?: string | null;
  /** Optional size (bytes) of the attachment */
  anexoTamanhoBytes?: number | null;
}

/**
 * Emite `processo:mensagem` para a sala do processo.
 *
 * O payload TEM de ter o mesmo formato que o REST devolve
 * (`ProcessoMensagem` em features/processos-genericos/types/processo-generico.types.ts
 * no frontend), porque o frontend junta as mensagens recebidas por socket
 * à mesma lista das carregadas por `GET /processos-genericos/:id/mensagens`.
 * Qualquer campo novo na mensagem REST tem de ser replicado aqui.
 */
export function emitirMensagemProcesso(
  processoId: string,
  mensagem: MensagemProcesso
): void {
  getIO()?.to(salaProcesso(processoId)).emit("processo:mensagem", {
    id: mensagem.id,
    processoId,
    mensagem: mensagem.mensagem,
    criadoEm: mensagem.criadoEm.toISOString(),
    autorId: mensagem.autorId,
    // Uma mensagem acabada de criar ainda não foi lida por ninguém.
    lida: false,
    lidaEm: null,
    autor: { nomeCompleto: mensagem.autorNome },
    anexoNomeFicheiro: mensagem.anexoNomeFicheiro ?? null,
    anexoMimeType: mensagem.anexoMimeType ?? null,
    anexoTamanhoBytes: mensagem.anexoTamanhoBytes ?? null,
    anexoUrl: mensagem.anexoUrl ?? null,
  });
}

export function emitirLeituraProcesso(processoId: string, lidoPorId: string): void {
  getIO()?.to(salaProcesso(processoId)).emit("processo:mensagens-lidas", {
    lidoPorId,
    timestamp: new Date().toISOString(),
  });
}

export function revogarSalaProcesso(processoId: string, utilizadorId: string): void {
  const io = getIO();
  if (!io) return;
  io.in(`utilizador:${utilizadorId}`).socketsLeave(salaProcesso(processoId));
  io.in(`utilizador:${utilizadorId}`).emit("processo:erro", {
    processoId,
    message: "Perdeste acesso a esta conversa — o processo foi reatribuído.",
  });
}