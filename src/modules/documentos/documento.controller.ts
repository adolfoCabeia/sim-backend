import type { FastifyRequest, FastifyReply } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import * as service from "./documento.service.js";
import { TipoFicheiroInvalidoError } from "../storage/storage.service.js";
import {
  listarPastasQuerySchema,
  listarDocumentosQuerySchema,
} from "./documento.schema.js";
import type {
  CriarPastaInput,
  AtualizarPastaInput,
  ListarPastasQuery,
  ListarDocumentosQuery,
  AtualizarDocumentoInput,
} from "./documento.schema.js";

function tratarErroUpload(reply: FastifyReply, error: unknown) {
  if (error instanceof TipoFicheiroInvalidoError) {
    return reply.status(400).send({ error: error.message });
  }
  throw error;
}

export async function criarPastaController(req: FastifyRequest<{ Body: CriarPastaInput }>, reply: FastifyReply) {
  const pasta = await service.criarPasta(req.user.municipioId, req.user.sub, req.body);
  return reply.status(201).send(pasta);
}

export async function listarPastasController(
  req: FastifyRequest<{ Querystring: ListarPastasQuery }>,
  reply: FastifyReply
) {
  const query = listarPastasQuerySchema.parse(req.query);
  const pastas = await service.listarPastas({
    municipioId: req.user.municipioId,
    pastaPaiId: query.pastaPaiId,
    direcaoId: query.direcaoId,
  });
  return reply.send(pastas);
}

export async function obterPastaController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const pasta = await service.obterPasta(req.params.id, req.user.municipioId);
  if (!pasta) return reply.status(404).send({ error: "Pasta não encontrada" });
  return reply.send(pasta);
}

export async function atualizarPastaController(
  req: FastifyRequest<{ Params: { id: string }; Body: AtualizarPastaInput }>,
  reply: FastifyReply
) {
  const pasta = await service.atualizarPasta(req.params.id, req.user.municipioId, req.body);
  return reply.send(pasta);
}

export async function removerPastaController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  await service.removerPasta(req.params.id, req.user.municipioId);
  return reply.status(204).send();
}

// ─── Documentos ───

interface UploadDocumentoMultipartBody {
  pastaId?: { value: string };
  direcaoId?: { value: string };
  descricao?: { value: string };
  documento: MultipartFile;
}
export async function uploadDocumentoController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const documentos: { buffer: Buffer; filename: string }[] = [];
    let pastaId: string | undefined;
    let direcaoId: string | undefined;
    let descricao: string | undefined;

    for await (const part of req.parts()) {
      if (part.type === "file") {
        if (part.fieldname === "documento" && documentos.length < 4) {
          // consumir já, dentro do loop — senão o parser fica bloqueado
          const buffer = await part.toBuffer();
          documentos.push({ buffer, filename: part.filename });
        } else {
          // drenar qualquer outro ficheiro (incl. o 5º em diante) para não travar o parser
          await part.toBuffer();
        }
      } else {
        if (part.fieldname === "pastaId") pastaId = part.value as string;
        if (part.fieldname === "direcaoId") direcaoId = part.value as string;
        if (part.fieldname === "descricao") descricao = part.value as string;
      }
    }

    if (documentos.length === 0) {
      return reply.status(400).send({ error: "É obrigatório anexar pelo menos um ficheiro no campo 'documento' (multipart/form-data)." });
    }

    const resultados = [];
    for (const documento of documentos) {
      const doc = await service.uploadDocumentoParaPasta({
        municipioId: req.user.municipioId,
        utilizadorId: req.user.sub,
        buffer: documento.buffer,
        nomeOriginal: documento.filename,
        ...(pastaId !== undefined && { pastaId }),
        ...(direcaoId !== undefined && { direcaoId }),
        ...(descricao !== undefined && { descricao }),
      });
      resultados.push(doc);
    }

    return reply.status(201).send(resultados);
  } catch (error) {
    return tratarErroUpload(reply, error);
  }
}

export async function listarDocumentosController(
  req: FastifyRequest<{ Querystring: ListarDocumentosQuery }>,
  reply: FastifyReply
) {
  const query = listarDocumentosQuerySchema.parse(req.query);
  const resultado = await service.listarDocumentos(
    { municipioId: req.user.municipioId, pastaId: query.pastaId },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(resultado);
}

export async function obterDocumentoController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const documento = await service.obterDocumento(req.params.id, req.user.municipioId);
  if (!documento) return reply.status(404).send({ error: "Documento não encontrado" });
  return reply.send(documento);
}

export async function visualizarDocumentoController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const url = await service.obterUrlVisualizacao(req.params.id, req.user.municipioId);
  return reply.send({ url });
}

export async function atualizarDocumentoController(
  req: FastifyRequest<{ Params: { id: string }; Body: AtualizarDocumentoInput }>,
  reply: FastifyReply
) {
  const documento = await service.atualizarDocumento(req.params.id, req.user.municipioId, req.body);
  return reply.send(documento);
}

export async function removerDocumentoController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await service.removerDocumento(req.params.id, req.user.municipioId);
  return reply.status(204).send();
}