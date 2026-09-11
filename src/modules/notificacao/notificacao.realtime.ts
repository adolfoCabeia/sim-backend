import { getIO } from "../../plugins/realtime/sockets.js";
import type { Notificacao } from "../../generated/prisma/client.js";

export function emitirNotificacaoParaUtilizador(utilizadorId: string, notificacao: Notificacao) {
  const io = getIO();
  if (!io) return;
  io.to(`utilizador:${utilizadorId}`).emit("notificacao:nova", notificacao);
}