import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./biblioteca.service.js";
import { pesquisarDiplomasQuerySchema } from "./biblioteca.schema.js";
import type {
  CriarDiplomaInput,
  AtualizarDiplomaInput,
  PesquisarDiplomasQuery,
} from "./biblioteca.schema.js";

export async function criarController(req: FastifyRequest<{ Body: CriarDiplomaInput }>, reply: FastifyReply) {
  const diploma = await service.criarDiploma(req.user.municipioId, req.user.sub, req.body);
  return reply.status(201).send(diploma);
}

export async function pesquisarController(
  req: FastifyRequest<{ Querystring: PesquisarDiplomasQuery }>,
  reply: FastifyReply
) {
  const query = pesquisarDiplomasQuerySchema.parse(req.query);
  const resultado = await service.pesquisarDiplomas(
    { municipioId: req.user.municipioId, q: query.q, categoria: query.categoria, estado: query.estado },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(resultado);
}

export async function obterController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const diploma = await service.obterDiploma(req.params.id, req.user.municipioId);
  if (!diploma) return reply.status(404).send({ error: "Diploma não encontrado" });
  return reply.send(diploma);
}

export async function atualizarController(
  req: FastifyRequest<{ Params: { id: string }; Body: AtualizarDiplomaInput }>,
  reply: FastifyReply
) {
  const diploma = await service.atualizarDiploma(req.params.id, req.user.municipioId, req.body);
  return reply.send(diploma);
}

export async function removerController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  await service.removerDiploma(req.params.id, req.user.municipioId);
  return reply.status(204).send();
}