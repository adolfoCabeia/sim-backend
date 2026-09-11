import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./fiscalizacao.service.js";
import { listarAccoesQuerySchema } from "./fiscalizacao.schema.js";
import type {
  CriarAccaoFiscalizacaoInput,
  RegistarCoimaInput,
  ListarAccoesQuery,
} from "./fiscalizacao.schema.js";

export async function criarController(
  req: FastifyRequest<{ Body: CriarAccaoFiscalizacaoInput }>,
  reply: FastifyReply
) {
  const resultado = await service.criarAccaoFiscalizacao({
    municipioId: req.user.municipioId,
    executorId: req.user.sub,
    dados: req.body,
  });
  return reply.status(201).send(resultado);
}

export async function obterController(
  req: FastifyRequest<{ Params: { processoId: string } }>,
  reply: FastifyReply
) {
  const detalhe = await service.obterAccaoFiscalizacao(req.params.processoId, req.user.municipioId);
  if (!detalhe) return reply.status(404).send({ error: "Acção de fiscalização não encontrada" });
  return reply.send(detalhe);
}

export async function listarController(
  req: FastifyRequest<{ Querystring: ListarAccoesQuery }>,
  reply: FastifyReply
) {
  const query = listarAccoesQuerySchema.parse(req.query);
  const resultado = await service.listarAccoesFiscalizacao(
    { municipioId: req.user.municipioId, tipoAccao: query.tipoAccao, estabelecimentoNome: query.estabelecimentoNome },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(resultado);
}

export async function historicoEstabelecimentoController(
  req: FastifyRequest<{ Params: { nome: string } }>,
  reply: FastifyReply
) {
  const historico = await service.historicoDoEstabelecimento(req.params.nome, req.user.municipioId);
  return reply.send(historico);
}

export async function registarCoimaController(
  req: FastifyRequest<{ Params: { processoId: string }; Body: RegistarCoimaInput }>,
  reply: FastifyReply
) {
  const detalhe = await service.registarCoima(req.params.processoId, req.user.municipioId, req.body);
  return reply.send(detalhe);
}