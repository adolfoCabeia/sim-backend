import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./comissao.service.js";
import { listarComissoesQuerySchema } from "./comissao.schema.js";
import { EmailJaExisteError } from "../auth/auth.service.js";
import type {
  ComissaoCreateInput,
  ComissaoUpdateInput,
  AlterarEstadoComissaoInput,
  ListarComissoesQuery,
  AdicionarMembroInput,
} from "./comissao.schema.js";

function tratarErro(error: unknown, reply: FastifyReply, request: FastifyRequest) {
  if (error instanceof service.ComissaoNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof service.MembroNaoPertenceAComissaoError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  if (error instanceof service.TransicaoDeEstadoInvalidaError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  // NOVO
  if (error instanceof service.UtilizadorInvalidoParaComissaoError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  if (error instanceof service.UtilizadorJaTemComissaoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, "Erro inesperado no módulo de comissões de moradores");
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function listarController(
  req: FastifyRequest<{ Querystring: ListarComissoesQuery }>,
  reply: FastifyReply
) {
  try {
    const query = listarComissoesQuerySchema.parse(req.query);
    const municipioId = req.user.municipioId;

    const resultado = await service.listarComissoes(
      { municipioId, bairro: query.bairro, estado: query.estado },
      { page: Number(query.page), limit: Number(query.limit) }
    );
    return reply.send({ success: true, ...resultado });
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}

export async function obterController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const comissao = await service.obterComissao(req.params.id, req.user.municipioId);
    return reply.send({ success: true, data: comissao });
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}

export async function criarController(
  req: FastifyRequest<{ Body: ComissaoCreateInput }>,
  reply: FastifyReply
) {
  try {
    const comissao = await service.criarComissao(req.user.municipioId, req.body, {
      utilizadorId: req.user.sub,
    });
    return reply.status(201).send({ success: true, data: comissao });
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}

export async function atualizarController(
  req: FastifyRequest<{ Params: { id: string }; Body: ComissaoUpdateInput }>,
  reply: FastifyReply
) {
  try {
    const comissao = await service.atualizarComissao(req.params.id, req.user.municipioId, req.body, {
      utilizadorId: req.user.sub,
    });
    return reply.send({ success: true, data: comissao });
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}

// NOVO: endpoint dedicado para transição de estado (ACTIVA/INACTIVA/EM_REGULARIZACAO).
export async function alterarEstadoController(
  req: FastifyRequest<{ Params: { id: string }; Body: AlterarEstadoComissaoInput }>,
  reply: FastifyReply
) {
  try {
    const comissao = await service.alterarEstadoComissao(req.params.id, req.user.municipioId, req.body, {
      utilizadorId: req.user.sub,
    });
    return reply.send({ success: true, data: comissao });
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}

export async function removerController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await service.removerComissao(req.params.id, req.user.municipioId, { utilizadorId: req.user.sub });
    return reply.status(204).send();
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}

export async function adicionarMembroController(
  req: FastifyRequest<{ Params: { id: string }; Body: AdicionarMembroInput }>,
  reply: FastifyReply
) {
  try {
    const membro = await service.adicionarMembro(req.params.id, req.user.municipioId, req.body, {
      utilizadorId: req.user.sub,
    });
    return reply.status(201).send({ success: true, data: membro });
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}

export async function removerMembroController(
  req: FastifyRequest<{ Params: { id: string; membroId: string } }>,
  reply: FastifyReply
) {
  try {
    await service.removerMembro(req.params.id, req.params.membroId, req.user.municipioId, {
      utilizadorId: req.user.sub,
    });
    return reply.status(204).send();
  } catch (error) {
    return tratarErro(error, reply, req);
  }
}