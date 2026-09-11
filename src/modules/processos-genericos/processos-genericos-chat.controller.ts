import type { FastifyReply, FastifyRequest } from "fastify";
import {
  enviarMensagemProcessoGenerico,
  listarMensagensProcessoGenerico,
  contarNaoLidasProcessoGenerico,
  listarMinhasConversas,
  enviarAnexoMensagemProcessoGenerico,
} from "./processos-genericos-chat.service.js";
import {
  ChatProcessoNaoAutorizadoError,
  ChatProcessoSemResponsavelError,
  ChatProcessoSemRequerenteError,
  ChatProcessoArquivadoError,
  ProcessoGenericoNaoEncontradoError,
  MensagemVaziaError,
} from "./processos-genericos-chat.errors.js";
import {
  enviarMensagemProcessoSchema,
  enviarAnexoMensagemSchema,
  type EnviarMensagemProcessoInput,
  type ListarMensagensProcessoQuery,
  type ListarConversasQuery,
} from "./processos-genericos-chat.schema.js";
import {
  uploadDocumento,
  TipoFicheiroInvalidoError,
  MIME_TIPOS_ENTRADA_SAIDA,
} from "../storage/storage.service.js";

function tratarErro(error: unknown, reply: FastifyReply) {
  if (error instanceof ProcessoGenericoNaoEncontradoError)
    return reply.status(404).send({ success: false, message: error.message });

  if (error instanceof ChatProcessoNaoAutorizadoError)
    return reply.status(403).send({ success: false, message: error.message });

  if (
    error instanceof ChatProcessoSemResponsavelError ||
    error instanceof ChatProcessoSemRequerenteError ||
    error instanceof ChatProcessoArquivadoError
  ) {
    return reply.status(409).send({ success: false, message: error.message });
  }

  if (error instanceof TipoFicheiroInvalidoError || error instanceof MensagemVaziaError)
    return reply.status(400).send({ success: false, message: error.message });

  throw error;
}

async function parseMultipart(request: FastifyRequest) {
  const fields: Record<string, string> = {};
  const files: Record<string, {
    buffer: Buffer;
    filename: string;
    mimetype: string;
    encoding: string;
  }[]> = {};

  for await (const part of request.parts()) {
    if (part.type === "file") {
      const file = {
        buffer: await part.toBuffer(),
        filename: part.filename,
        mimetype: part.mimetype,
        encoding: part.encoding,
      };

      (files[part.fieldname] ??= []).push(file);
    } else {
      fields[part.fieldname] = String(part.value);
    }
  }

  return { fields, files };
}

export async function enviarAnexoMensagemProcessoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { fields, files } = await parseMultipart(request);

    const parsed = enviarAnexoMensagemSchema.safeParse(fields);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados inválidos.",
        errors: parsed.error.issues,
      });
    }

    const documento = files.documento?.[0];

    if (!documento) {
      return reply.status(400).send({
        success: false,
        message: "É obrigatório anexar um documento.",
      });
    }

    const upload = await uploadDocumento({
      buffer: documento.buffer,
      prefixo: `processos-genericos/${request.params.id}/mensagens`,
      nomeOriginal: documento.filename,
      mimeTiposAceites: MIME_TIPOS_ENTRADA_SAIDA,
    });

    const mensagem = await enviarAnexoMensagemProcessoGenerico({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      autorId: request.user.sub,
      ...(parsed.data.mensagem !== undefined && {
        mensagem: parsed.data.mensagem,
      }),
      anexo: {
        storageKey: upload.storageKey,
        nomeFicheiro: upload.nomeOriginal,
        mimeType: upload.mimeType,
        tamanhoBytes: upload.tamanhoBytes,
      },
    });

    return reply.status(201).send({
      success: true,
      data: mensagem,
    });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function enviarMensagemProcessoController(
  request: FastifyRequest<{
    Params: { id: string };
    Body: EnviarMensagemProcessoInput;
  }>,
  reply: FastifyReply
) {
  try {
    const parsed = enviarMensagemProcessoSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados inválidos.",
        errors: parsed.error.issues,
      });
    }

    const mensagem = await enviarMensagemProcessoGenerico({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      autorId: request.user.sub,
      input: parsed.data,
    });

    return reply.status(201).send({
      success: true,
      data: mensagem,
    });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function listarMensagensProcessoController(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: ListarMensagensProcessoQuery;
  }>,
  reply: FastifyReply
) {
  try {
    const resultado = await listarMensagensProcessoGenerico({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      viewerId: request.user.sub,
      query: request.query,
    });

    return reply.status(200).send({
      success: true,
      data: resultado,
    });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function contarNaoLidasProcessoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const resultado = await contarNaoLidasProcessoGenerico({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      viewerId: request.user.sub,
    });

    return reply.status(200).send({
      success: true,
      data: resultado,
    });
  } catch (error) {
    return tratarErro(error, reply);
  }
}

export async function listarConversasController(
  request: FastifyRequest<{ Querystring: ListarConversasQuery }>,
  reply: FastifyReply
) {
  try {
    const resultado = await listarMinhasConversas({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      query: request.query,
    });

    return reply.status(200).send({
      success: true,
      data: resultado,
    });
  } catch (error) {
    return tratarErro(error, reply);
  }
}
