import * as ProcessEngineChat from "../../core/process-engine/process-engine.chat.js";
import type {
  EnviarMensagemProcessoInput,
  ListarMensagensProcessoQuery,
  ListarConversasQuery,
} from "./processos-genericos-chat.schema.js";

export async function enviarMensagemProcessoGenerico(params: {
  municipioId: string;
  processoId: string;
  autorId: string;
  input: EnviarMensagemProcessoInput;
}) {
  return ProcessEngineChat.enviarMensagemProcesso({
    municipioId: params.municipioId,
    processoId: params.processoId,
    autorId: params.autorId,
    mensagem: params.input.mensagem,
  });
}

export async function enviarAnexoMensagemProcessoGenerico(params: {
  municipioId: string;
  processoId: string;
  autorId: string;
  mensagem?: string;
  anexo: { storageKey: string; nomeFicheiro: string; mimeType: string; tamanhoBytes: number };
}) {
  return ProcessEngineChat.enviarMensagemProcesso(params);
}

export async function listarMensagensProcessoGenerico(params: {
  municipioId: string;
  processoId: string;
  viewerId: string;
  query: ListarMensagensProcessoQuery;
}) {
  return ProcessEngineChat.listarMensagensProcesso({
    municipioId: params.municipioId,
    processoId: params.processoId,
    viewerId: params.viewerId,
    page: params.query.page,
    pageSize: params.query.pageSize,
  });
}

export async function contarNaoLidasProcessoGenerico(params: {
  municipioId: string;
  processoId: string;
  viewerId: string;
}) {
  return ProcessEngineChat.contarNaoLidasProcesso(params);
}

export async function listarMinhasConversas(params: {
  municipioId: string;
  utilizadorId: string;
  query: ListarConversasQuery;
}) {
  return ProcessEngineChat.listarConversasDoUtilizador({
    municipioId: params.municipioId,
    utilizadorId: params.utilizadorId,
    page: params.query.page,
    pageSize: params.query.pageSize,
  });
}