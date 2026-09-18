import type { FastifyInstance } from "fastify";
import {
  criarDirecaoController,
  listarDirecoesController,
  obterDirecaoController,
  atualizarDirecaoController,
  eliminarDirecaoController,
  listarUtilizadoresDaDirecaoController,
  contarUtilizadoresDaDirecaoController,
  estatisticasUtilizadoresPorDirecaoController,
} from "./direcoes.controller.js";
import { criarDirecaoSchema, atualizarDirecaoSchema } from "./direcoes.schema.js";
import type { CriarDirecaoInput, AtualizarDirecaoInput } from "./direcoes.schema.js";
import {
  criarDirecaoDocs,
  listarDirecoesDocs,
  obterDirecaoDocs,
  atualizarDirecaoDocs,
  eliminarDirecaoDocs,
  listarUtilizadoresDaDirecaoDocs,
  contarUtilizadoresDaDirecaoDocs,
  estatisticasUtilizadoresPorDirecaoDocs,
} from "./direcoes.docs.js";
import { validateBody } from "../../utils/validate.js";
import { requireAnyPermission } from "../../middleware/hasPermission.js";

export async function direcoesRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CriarDirecaoInput }>(
    "/direcoes",
    {
      ...criarDirecaoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("direcoes:gerir"), validateBody(criarDirecaoSchema)],
    },
    criarDirecaoController
  );

  fastify.get<{ Querystring: { page?: string; pageSize?: string; search?: string; tipo?: string } }>(
    "/direcoes",
    { ...listarDirecoesDocs, preHandler: [fastify.authenticate, requireAnyPermission("direcoes:consultar")] },
    listarDirecoesController
  );
  
  fastify.get(
    "/direcoes/estatisticas/utilizadores",
    {
      ...estatisticasUtilizadoresPorDirecaoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("direcoes:consultar")],
    },
    estatisticasUtilizadoresPorDirecaoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/direcoes/:id",
    { ...obterDirecaoDocs, preHandler: [fastify.authenticate, requireAnyPermission("direcoes:consultar")] },
    obterDirecaoController
  );

  fastify.patch<{ Params: { id: string }; Body: AtualizarDirecaoInput }>(
    "/direcoes/:id",
    {
      ...atualizarDirecaoDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("direcoes:gerir"),
        validateBody(atualizarDirecaoSchema),
      ],
    },
    atualizarDirecaoController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/direcoes/:id",
    { ...eliminarDirecaoDocs, preHandler: [fastify.authenticate, requireAnyPermission("direcoes:gerir")] },
    eliminarDirecaoController
  );

  fastify.get<{ Params: { id: string }; Querystring: { page?: string; pageSize?: string } }>(
    "/direcoes/:id/utilizadores",
    {
      ...listarUtilizadoresDaDirecaoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("direcoes:consultar")],
    },
    listarUtilizadoresDaDirecaoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/direcoes/:id/utilizadores/contagem",
    {
      ...contarUtilizadoresDaDirecaoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("direcoes:consultar")],
    },
    contarUtilizadoresDaDirecaoController
  );
}