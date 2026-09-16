import { getIO } from "../../plugins/realtime/sockets.js";

export function salaProcesso(processoId: string): string {
  return `processo:${processoId}`;
}

export interface MensagemProcesso {
  id: string;
  mensagem: string;
  autorId: string;
  autorNome: string;
  criadoEm: Date;
  /** Optional URL for an attached file */
  anexoUrl?: string | null;
  /** Optional file name of the attachment */
  anexoNomeFicheiro?: string | null;
  /** Optional MIME type of the attachment */
  anexoMimeType?: string | null;
}

export function emitirMensagemProcesso(
  processoId: string,
  mensagem: MensagemProcesso
): void {
  getIO()?.to(salaProcesso(processoId)).emit("processo:mensagem", {
    ...mensagem,
    criadoEm: mensagem.criadoEm.toISOString(),
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