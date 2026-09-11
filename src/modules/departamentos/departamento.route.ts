import type { FastifyInstance } from "fastify";
import {
  criarDepartamentoController,
  listarDepartamentosController,
  listarDepartamentosDaDirecaoController,
  obterDepartamentoController,
  atualizarDepartamentoController,
  eliminarDepartamentoController,
  listarUtilizadoresDoDepartamentoController,
  contarUtilizadoresDoDepartamentoController,
  estatisticasUtilizadoresPorDepartamentoController,
} from "./departamento.controller.js";
import { criarDepartamentoSchema, atualizarDepartamentoSchema } from "./departamentos.schema.js";
import type { CriarDepartamentoInput, AtualizarDepartamentoInput } from "./departamentos.schema.js";
import {
  criarDepartamentoDocs,
  listarDepartamentosDocs,
  listarDepartamentosDaDirecaoDocs,
  obterDepartamentoDocs,
  atualizarDepartamentoDocs,
  eliminarDepartamentoDocs,
  listarUtilizadoresDoDepartamentoDocs,
  contarUtilizadoresDoDepartamentoDocs,
  estatisticasUtilizadoresPorDepartamentoDocs,
} from "./departamento.docs.js";
import { validateBody } from "../../utils/validate.js";
import { requireAnyPermission } from "../../middleware/hasPermission.js";

export async function departamentosRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CriarDepartamentoInput }>(
    "/departamentos",
    {
      ...criarDepartamentoDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("departamentos:gerir"),
        validateBody(criarDepartamentoSchema),
      ],
    },
    criarDepartamentoController
  );

  fastify.get<{ Querystring: { page?: string; pageSize?: string; direcaoId?: string; search?: string } }>(
    "/departamentos",
    {
      ...listarDepartamentosDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("departamentos:consultar")],
    },
    listarDepartamentosController
  );

  // Rota fixa ANTES de "/departamentos/:id" — mesmo cuidado de ordenação da rota de direções
  fastify.get<{ Querystring: { direcaoId?: string } }>(
    "/departamentos/estatisticas/utilizadores",
    {
      ...estatisticasUtilizadoresPorDepartamentoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("departamentos:consultar")],
    },
    estatisticasUtilizadoresPorDepartamentoController
  );

  fastify.get<{ Params: { direcaoId: string }; Querystring: { page?: string; pageSize?: string } }>(
    "/direcoes/:direcaoId/departamentos",
    {
      ...listarDepartamentosDaDirecaoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("departamentos:consultar")],
    },
    listarDepartamentosDaDirecaoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/departamentos/:id",
    {
      ...obterDepartamentoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("departamentos:consultar")],
    },
    obterDepartamentoController
  );

  fastify.patch<{ Params: { id: string }; Body: AtualizarDepartamentoInput }>(
    "/departamentos/:id",
    {
      ...atualizarDepartamentoDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("departamentos:gerir"),
        validateBody(atualizarDepartamentoSchema),
      ],
    },
    atualizarDepartamentoController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/departamentos/:id",
    { ...eliminarDepartamentoDocs, preHandler: [fastify.authenticate, requireAnyPermission("departamentos:gerir")] },
    eliminarDepartamentoController
  );

  fastify.get<{ Params: { id: string }; Querystring: { page?: string; pageSize?: string } }>(
    "/departamentos/:id/utilizadores",
    {
      ...listarUtilizadoresDoDepartamentoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("departamentos:consultar")],
    },
    listarUtilizadoresDoDepartamentoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/departamentos/:id/utilizadores/contagem",
    {
      ...contarUtilizadoresDoDepartamentoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("departamentos:consultar")],
    },
    contarUtilizadoresDoDepartamentoController
  );
}