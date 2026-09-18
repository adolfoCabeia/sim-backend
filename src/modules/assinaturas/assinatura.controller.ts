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
  const emissoes = await service.listarAssinaturas({
    municipioId: req.user.municipioId,
    referenciaTipo: query.referenciaTipo,
    referenciaId: query.referenciaId,
  });
  return reply.send(emissoes);
}

export async function verificarPublicoController(
  req: FastifyRequest<{ Params: { codigo: string } }>,
  reply: FastifyReply
) {
  const resultado = await service.verificarDocumentoPublicoPorCodigo(req.params.codigo);
  return reply.send(resultado);
}


export async function gerarPdfController(
  req: FastifyRequest<{ Params: { tipo: string; id: string } }>,
  reply: FastifyReply
) {
  const pdfBuffer = await service.gerarPdfDocumento({
    municipioId: req.user.municipioId,
    referenciaTipo: req.params.tipo,
    referenciaId: req.params.id,
    nomeMunicipio: req.user.municipioId, // ajusta conforme o que o teu JWT/sessão realmente expõe
  });

  return reply
    .header("Content-Type", "application/pdf")
    .header("Content-Disposition", `inline; filename="documento-${req.params.id}.pdf"`)
    .send(pdfBuffer);
}