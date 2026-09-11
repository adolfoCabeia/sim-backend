import { getIO } from "../../plugins/realtime/sockets.js";

export function salaOcorrencia(ocorrenciaId: string): string {
  return `ocorrencia:${ocorrenciaId}`;
}

export function emitirNovaMensagem(
  ocorrenciaId: string,
  mensagem: { id: string; mensagem: string; autorId: string; autorNome: string; criadoEm: Date }
): void {
  getIO()?.to(salaOcorrencia(ocorrenciaId)).emit("ocorrencia:mensagem", {
    ...mensagem,
    criadoEm: mensagem.criadoEm.toISOString(),
  });
}

export function emitirMudancaEstado(ocorrenciaId: string, estado: string): void {
  getIO()?.to(salaOcorrencia(ocorrenciaId)).emit("ocorrencia:estado", {
    estado,
    timestamp: new Date().toISOString(),
  });
}

export function emitirMensagensLidas(ocorrenciaId: string, lidoPorId: string): void {
  getIO()?.to(salaOcorrencia(ocorrenciaId)).emit("ocorrencia:mensagens-lidas", {
    lidoPorId,
    timestamp: new Date().toISOString(),
  });
}

export function emitirAtribuicao(ocorrenciaId: string, responsavelNome: string): void {
  getIO()?.to(salaOcorrencia(ocorrenciaId)).emit("ocorrencia:atribuida", {
    responsavelNome,
    timestamp: new Date().toISOString(),
  });
}