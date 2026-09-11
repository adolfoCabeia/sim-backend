import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./comissao.service.js";
import { listarComissoesQuerySchema } from "./comissao.schema.js";
import type {
  ComissaoCreateInput,
  ComissaoUpdateInput,
  ListarComissoesQuery,
  AdicionarMembroInput,
} from "./comissao.schema.js";

export async function listarController(req: FastifyRequest<{ Querystring: ListarComissoesQuery }>, reply: FastifyReply) {
  const query = listarComissoesQuerySchema.parse(req.query);
  const municipioId = req.user.municipioId;

  const resultado = await service.listarComissoes(
    { municipioId, bairro: query.bairro, estado: query.estado },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(resultado);
}

export async function obterController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const municipioId = req.user.municipioId;
  const comissao = await service.obterComissao(req.params.id, municipioId);
  if (!comissao) return reply.status(404).send({ error: "Comissão não encontrada" });
  return reply.send(comissao);
}

export async function criarController(req: FastifyRequest<{ Body: ComissaoCreateInput }>, reply: FastifyReply) {
  const municipioId = req.user.municipioId;
  const comissao = await service.criarComissao(municipioId, req.body);
  return reply.status(201).send(comissao);
}

export async function atualizarController(
  req: FastifyRequest<{ Params: { id: string }; Body: ComissaoUpdateInput }>,
  reply: FastifyReply
) {
  const municipioId = req.user.municipioId;
  const comissao = await service.atualizarComissao(req.params.id, municipioId, req.body);
  return reply.send(comissao);
}

export async function removerController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const municipioId = req.user.municipioId;
  await service.removerComissao(req.params.id, municipioId);
  return reply.status(204).send();
}

export async function adicionarMembroController(
  req: FastifyRequest<{ Params: { id: string }; Body: AdicionarMembroInput }>,
  reply: FastifyReply
) {
  const municipioId = req.user.municipioId;
  const membro = await service.adicionarMembro(req.params.id, municipioId, req.body);
  return reply.status(201).send(membro);
}

export async function removerMembroController(
  req: FastifyRequest<{ Params: { id: string; membroId: string } }>,
  reply: FastifyReply
) {
  const municipioId = req.user.municipioId;
  await service.removerMembro(req.params.id, req.params.membroId, municipioId);
  return reply.status(204).send();
}