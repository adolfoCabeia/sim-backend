import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./dashboard.service.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { dashboardDireccaoQuerySchema } from "./dashboard.schema.js";
import type { DashboardDireccaoQuery } from "./dashboard.schema.js";

export async function dashboardDireccaoController(
  req: FastifyRequest<{ Querystring: DashboardDireccaoQuery }>,
  reply: FastifyReply
) {
  const query = dashboardDireccaoQuerySchema.parse(req.query);
  const municipioId = req.user.municipioId;

  let direcaoId = query.direcaoId;
  if (!direcaoId) {
    const direcaoDoUtilizador = await withTenantTransaction(municipioId, async (tx) => {
      const utilizador = await tx.utilizador.findUnique({
        where: { id: req.user.sub },
        select: { direcaoId: true },
      });
      return utilizador?.direcaoId ?? null;
    });

    if (!direcaoDoUtilizador) {
      return reply.status(400).send({
        error: "O seu utilizador não está associado a nenhuma direcção/secção. Indique 'direcaoId' explicitamente.",
      });
    }
    direcaoId = direcaoDoUtilizador;
  }

  try {
    const dashboard = await service.obterDashboardDireccao(municipioId, direcaoId);
    return reply.send(dashboard);
  } catch (error) {
    if (error instanceof service.DireccaoNaoEncontradaError) {
      return reply.status(404).send({ error: error.message });
    }
    throw error;
  }
}

export async function dashboardAdministradorController(req: FastifyRequest, reply: FastifyReply) {
  const dashboard = await service.obterDashboardAdministrador(req.user.municipioId);
  return reply.send(dashboard);
}

export async function painelTransparenciaController(
  req: FastifyRequest<{ Params: { municipioId: string } }>,
  reply: FastifyReply
) {
  try {
    const painel = await service.obterPainelTransparencia(req.params.municipioId);
    return reply.send(painel);
  } catch (error) {
    if (error instanceof service.DireccaoNaoEncontradaError) {
      return reply.status(404).send({ error: error.message });
    }
    throw error;
  }
}