import type { FastifyInstance } from "fastify";
import {
  criarFuncionarioController,
  obterFuncionarioController,
  atualizarFuncionarioController,
  listarFuncionariosController,
  obterMeuPerfilController,
  obterFotografiaFuncionarioController,
  obterCvFuncionarioController,
  adicionarHabilitacaoController,
  obterComprovativoHabilitacaoController,
  removerHabilitacaoController,
} from "./funcionario.controller.js";
import type {
  AtualizarFuncionarioInput,
  ListarFuncionariosQuery,
  AdicionarHabilitacaoInput,
} from "./funcionario.schema.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function funcionariosRoutes(fastify: FastifyInstance) {
  fastify.get(
  "/funcionarios",
  { preHandler: [fastify.authenticate] },
  listarFuncionariosController,
);

  // Tem de vir antes de "/funcionarios/:id" para não ser capturado por ele.
  fastify.get(
    "/funcionarios/meu-perfil",
    { preHandler: [fastify.authenticate] },
    obterMeuPerfilController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/funcionarios/:id",
    { preHandler: [fastify.authenticate] },
    obterFuncionarioController,
  );

  fastify.post(
    "/funcionarios",
    { preHandler: [fastify.authenticate, requireAnyPermission("funcionarios:gerir")] },
    criarFuncionarioController,
  );

  fastify.patch<{ Params: { id: string }; Body: AtualizarFuncionarioInput }>(
    "/funcionarios/:id",
    { preHandler: [fastify.authenticate, requireAnyPermission("funcionarios:gerir")] },
    atualizarFuncionarioController,
  );

  /* ─── URLs de visualização (presigned) ─── */

  fastify.get<{ Params: { id: string } }>(
    "/funcionarios/:id/fotografia",
    { preHandler: [fastify.authenticate, requireAnyPermission("funcionarios:consultar")] },
    obterFotografiaFuncionarioController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/funcionarios/:id/cv",
    { preHandler: [fastify.authenticate, requireAnyPermission("funcionarios:consultar")] },
    obterCvFuncionarioController,
  );

  /* ─── Habilitações ─── */

  fastify.post<{ Params: { id: string }; Body: AdicionarHabilitacaoInput }>(
    "/funcionarios/:id/habilitacoes",
    { preHandler: [fastify.authenticate, requireAnyPermission("funcionarios:gerir")] },
    adicionarHabilitacaoController,
  );

  fastify.get<{ Params: { id: string; habilitacaoId: string } }>(
    "/funcionarios/:id/habilitacoes/:habilitacaoId/comprovativo",
    { preHandler: [fastify.authenticate, requireAnyPermission("funcionarios:consultar")] },
    obterComprovativoHabilitacaoController,
  );

  fastify.delete<{ Params: { id: string; habilitacaoId: string } }>(
    "/funcionarios/:id/habilitacoes/:habilitacaoId",
    { preHandler: [fastify.authenticate, requireAnyPermission("funcionarios:gerir")] },
    removerHabilitacaoController,
  );
}