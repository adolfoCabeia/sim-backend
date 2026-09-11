import type { FastifyRequest, FastifyReply } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import {
  enviarIntercambio,
  listarIntercambios,
  confirmarRecepcaoIntercambio,
  uploadDocumentoIntercambio,
  obterUrlDocumentoIntercambio,
  DirecaoSemPermissaoIntercambioError,
  MunicipioDestinoInvalidoError,
  IntercambioNaoEncontradoError,
  IntercambioNaoPertenceAoMunicipioError,
  IntercambioSemDocumentoError,
} from "./intercambio.service.js";
import { TipoFicheiroInvalidoError } from "../storage/storage.service.js";
import type { EnviarIntercambioInput, ListarIntercambiosQuery } from "./intercambio.schema.js";

export async function enviarIntercambioController(
  request: FastifyRequest<{ Body: EnviarIntercambioInput }>,
  reply: FastifyReply
) {
  try {
    const intercambio = await enviarIntercambio({
      municipioOrigemId: request.user.municipioId,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: intercambio });
  } catch (error) {
    if (error instanceof DirecaoSemPermissaoIntercambioError || error instanceof MunicipioDestinoInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao enviar intercâmbio");
    return reply.status(500).send({ success: false, message: "Erro interno ao enviar intercâmbio." });
  }
}

export async function listarIntercambiosController(
  request: FastifyRequest<{ Querystring: ListarIntercambiosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarIntercambios({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}

export async function confirmarRecepcaoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const intercambio = await confirmarRecepcaoIntercambio({
      intercambioId: request.params.id,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: intercambio });
  } catch (error) {
    if (error instanceof IntercambioNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof IntercambioNaoPertenceAoMunicipioError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao confirmar recepção de intercâmbio");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

interface UploadDocumentoIntercambioBody {
  documento: MultipartFile;
}

export async function uploadDocumentoController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const documento = await request.file();

    if (!documento) {
      return reply.status(400).send({
        success: false,
        message: "É obrigatório anexar um ficheiro no campo 'documento' (multipart/form-data).",
      });
    }

    const buffer = await documento.toBuffer();
    const upload = await uploadDocumentoIntercambio({ buffer, nomeOriginal: documento.filename });
    return reply.status(201).send({ success: true, data: upload });
  } catch (error) {
    if (error instanceof TipoFicheiroInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao enviar documento de intercâmbio");
    return reply.status(500).send({ success: false, message: "Erro interno ao enviar documento." });
  }
}

export async function obterDocumentoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const url = await obterUrlDocumentoIntercambio({
      intercambioId: request.params.id,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: { url } });
  } catch (error) {
    if (error instanceof IntercambioNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof IntercambioNaoPertenceAoMunicipioError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof IntercambioSemDocumentoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao obter documento de intercâmbio");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}