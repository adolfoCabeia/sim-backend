import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./assinatura.service.js";
import { listarAssinaturasQuerySchema } from "./assinatura.schema.js";
import type { AssinarDocumentoInput, ListarAssinaturasQuery } from "./assinatura.schema.js";

export async function assinarController(
  req: FastifyRequest<{ Body: AssinarDocumentoInput }>,
  reply: FastifyReply
) {
  const assinatura = await service.assinarDocumento({
    municipioId: req.user.municipioId,
    signatarioId: req.user.sub,
    ipOrigem: req.ip,
    dados: req.body,
  });
  return reply.status(201).send(assinatura);
}

export async function listarController(
  req: FastifyRequest<{ Querystring: ListarAssinaturasQuery }>,
  reply: FastifyReply
) {
  const query = listarAssinaturasQuerySchema.parse(req.query);
  const assinaturas = await service.listarAssinaturas({
    municipioId: req.user.municipioId,
    referenciaTipo: query.referenciaTipo,
    referenciaId: query.referenciaId,
  });
  return reply.send(assinaturas);
}

export async function verificarController(
  req: FastifyRequest<{ Params: { id: string }; Body: { conteudo: string } }>,
  reply: FastifyReply
) {
  const resultado = await service.verificarAssinatura({
    assinaturaId: req.params.id,
    municipioId: req.user.municipioId,
    conteudo: req.body.conteudo,
  });
  return reply.send(resultado);
}