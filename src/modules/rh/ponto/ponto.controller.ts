import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./ponto.service.js";
import { listarRegistosPontoQuerySchema } from "./ponto.schema.js";
import type {
  RegistarPontoInput,
  RegistarPontoManualInput,
  ListarRegistosPontoQuery,
} from "./ponto.schema.js";

function tratarErro(reply: FastifyReply, error: unknown) {
  if (error instanceof service.FuncionarioNaoEncontradoError) {
    return reply.status(404).send({ message: error.message });
  }
  if (error instanceof service.RegistoDuplicadoError) {
    return reply.status(409).send({ message: error.message });
  }
  // Erro inesperado — deixa o handler global de erros do Fastify tratar
  // (logging, 500, etc.), em vez de mascarar tudo aqui.
  throw error;
}

export async function registarPontoController(
  req: FastifyRequest<{ Body: RegistarPontoInput }>,
  reply: FastifyReply
) {
  try {
    const municipioId = req.user.municipioId;
    const registo = await service.registarPonto(municipioId, req.body);
    return reply.status(201).send(registo);
  } catch (error) {
    return tratarErro(reply, error);
  }
}

/** Registo manual — sempre por RH, sempre com justificação (ver validação no schema). */
export async function registarPontoManualController(
  req: FastifyRequest<{ Body: RegistarPontoManualInput }>,
  reply: FastifyReply
) {
  try {
    const municipioId = req.user.municipioId;
    const registo = await service.registarPonto(municipioId, req.body);
    return reply.status(201).send(registo);
  } catch (error) {
    return tratarErro(reply, error);
  }
}

export async function listarRegistosPontoController(
  req: FastifyRequest<{ Querystring: ListarRegistosPontoQuery }>,
  reply: FastifyReply
) {
  const query = listarRegistosPontoQuerySchema.parse(req.query);
  const municipioId = req.user.municipioId;

  const resultado = await service.listarRegistosPonto(
    {
      municipioId,
      funcionarioId: query.funcionarioId,
      tipo: query.tipo,
      desde: query.desde ? new Date(query.desde) : undefined,
      ate: query.ate ? new Date(query.ate) : undefined,
    },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(resultado);
}

export async function obterUltimoRegistoController(
  req: FastifyRequest<{ Params: { funcionarioId: string } }>,
  reply: FastifyReply
) {
  const municipioId = req.user.municipioId;
  const registo = await service.obterUltimoRegistoDoDia(req.params.funcionarioId, municipioId);
  return reply.send(registo ?? null);
}