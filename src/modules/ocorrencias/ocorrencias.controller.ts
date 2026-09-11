import type { FastifyReply, FastifyRequest } from "fastify";
import {
  criarOcorrencia,
  listarOcorrencias,
  obterOcorrencia,
  responderOcorrencia,
  mudarEstadoOcorrencia,
  listarOcorrenciasPublicas
} from "./ocorrencias.service.js";
import { OcorrenciaNaoEncontradaError } from "./ocorrencias.errors.js";
import type {
  CriarOcorrenciaInput,
  ResponderOcorrenciaInput,
  MudarEstadoOcorrenciaInput,
} from "./ocorrencias.schema.js";
import { criarOcorrenciaSchema } from "./ocorrencias.schema.js";
import { MAX_IMAGENS_OCORRENCIA, MIN_IMAGENS_OCORRENCIA } from "./ocorrencias.schema.js";
import { ImagensLimiteExcedidoError } from "./ocorrencias.errors.js";
import { TipoFicheiroInvalidoError } from "../storage/storage.service.js";


export async function listarOcorrenciasPublicasController(
  request: FastifyRequest<{
    Querystring: {
      municipioId: string;
      page?: string;
      pageSize?: string;
      categoria?: string;
      bairroZona?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { municipioId } = request.query;
  if (!municipioId) {
    return reply.status(400).send({ success: false, message: "municipioId é obrigatório." });
  }

  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  const resultado = await listarOcorrenciasPublicas({
    municipioId,
    page,
    pageSize,
    categoria: request.query.categoria,
    bairroZona: request.query.bairroZona,
  });

  return reply.status(200).send({ success: true, data: resultado });
}

export async function criarOcorrenciaController(request: FastifyRequest, reply: FastifyReply) {
  const campos: Record<string, string> = {};
  const imagens: Array<{ buffer: Buffer; nomeOriginal: string }> = [];

  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (imagens.length >= MAX_IMAGENS_OCORRENCIA) {
        return reply.status(400).send({
          success: false,
          message: `Só podes anexar até ${MAX_IMAGENS_OCORRENCIA} imagens.`,
        });
      }
      imagens.push({ buffer: await part.toBuffer(), nomeOriginal: part.filename });
    } else {
      campos[part.fieldname] = part.value as string;
    }
  }

  if (imagens.length < MIN_IMAGENS_OCORRENCIA) {
    return reply.status(400).send({
      success: false,
      message: `Anexa pelo menos ${MIN_IMAGENS_OCORRENCIA} imagem(ns) como comprovativo.`,
    });
  }

  const resultado = criarOcorrenciaSchema.safeParse(campos);
  if (!resultado.success) {
    return reply.status(400).send({ success: false, errors: resultado.error.flatten() });
  }

  try {
    const ocorrencia = await criarOcorrencia({
      input: resultado.data,
      municipioId: request.user.municipioId,
      criadoPorId: request.user.sub,
      imagens,
    });
    return reply.status(201).send({ success: true, data: ocorrencia });
  } catch (error) {
    if (error instanceof TipoFicheiroInvalidoError || error instanceof ImagensLimiteExcedidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    throw error;
  }
}
export async function listarMinhasOcorrenciasController(
  request: FastifyRequest<{ Querystring: { page?: string; pageSize?: string; estado?: string } }>,
  reply: FastifyReply,
) {
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  const resultado = await listarOcorrencias({
    municipioId: request.user.municipioId,
    viewerId: request.user.sub,
    page,
    pageSize,
    apenasMinhas: request.user.sub,
    ...(request.query.estado ? { estado: request.query.estado } : {}),
  });
  return reply.status(200).send({ success: true, data: resultado });
}

export async function listarOcorrenciasController(
  request: FastifyRequest<{ Querystring: { page?: string; pageSize?: string; estado?: string } }>,
  reply: FastifyReply,
) {
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 100);

  const resultado = await listarOcorrencias({
    municipioId: request.user.municipioId,
    viewerId: request.user.sub,
    page,
    pageSize,
    ...(request.query.estado ? { estado: request.query.estado } : {}),
  });
  return reply.status(200).send({ success: true, data: resultado });
}

export async function obterOcorrenciaController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const ocorrencia = await obterOcorrencia(request.params.id, request.user.municipioId, request.user.sub);
    return reply.status(200).send({ success: true, data: ocorrencia });
  } catch (error) {
    if (error instanceof OcorrenciaNaoEncontradaError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    throw error;
  }
}

export async function responderOcorrenciaController(
  request: FastifyRequest<{ Params: { id: string }; Body: ResponderOcorrenciaInput }>,
  reply: FastifyReply,
) {
  try {
    const mensagem = await responderOcorrencia({
      ocorrenciaId: request.params.id,
      municipioId: request.user.municipioId,
      autorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: mensagem });
  } catch (error) {
    if (error instanceof OcorrenciaNaoEncontradaError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    throw error;
  }
}

export async function mudarEstadoOcorrenciaController(
  request: FastifyRequest<{ Params: { id: string }; Body: MudarEstadoOcorrenciaInput }>,
  reply: FastifyReply,
) {
  try {
    const ocorrencia = await mudarEstadoOcorrencia({
      ocorrenciaId: request.params.id,
      municipioId: request.user.municipioId,
      input: request.body,
    });
    return reply.status(200).send({ success: true, data: ocorrencia });
  } catch (error) {
    if (error instanceof OcorrenciaNaoEncontradaError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    throw error;
  }
}