import type { FastifyInstance } from "fastify";
import {
  listarProgramasController,
  obterProgramaController,
  criarProgramaController,
  atualizarProgramaController,
  inscreverParticipanteController,
  removerParticipanteController,
} from "./programa.controller.js";
import {
  criarProgramaSchema,
  atualizarProgramaSchema,
  inscreverParticipanteSchema,
} from "./programa.schema.js";
import type {
  CriarProgramaInput,
  AtualizarProgramaInput,
  InscreverParticipanteInput,
  ListarProgramasQuery,
} from "./programa.schema.js";
import {
  listarProgramasDocs,
  obterProgramaDocs,
  criarProgramaDocs,
  atualizarProgramaDocs,
  inscreverParticipanteDocs,
  removerParticipanteDocs,
} from "./programa.docs.js";
import { validateBody } from "../../../utils/validate.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function programasRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarProgramasQuery }>(
    "/programas",
    { ...listarProgramasDocs, preHandler: [fastify.authenticate] },
    listarProgramasController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/programas/:id",
    { ...obterProgramaDocs, preHandler: [fastify.authenticate] },
    obterProgramaController,
  );

  fastify.post<{ Body: CriarProgramaInput }>(
    "/programas",
    {
      ...criarProgramaDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:programas:gerir"),
        validateBody(criarProgramaSchema),
      ],
    },
    criarProgramaController,
  );

  fastify.put<{ Params: { id: string }; Body: AtualizarProgramaInput }>(
    "/programas/:id",
    {
      ...atualizarProgramaDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:programas:gerir"),
        validateBody(atualizarProgramaSchema),
      ],
    },
    atualizarProgramaController,
  );

  fastify.post<{ Params: { id: string }; Body: InscreverParticipanteInput }>(
    "/programas/:id/participantes",
    {
      ...inscreverParticipanteDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:programas:gerir"),
        validateBody(inscreverParticipanteSchema),
      ],
    },
    inscreverParticipanteController,
  );

  fastify.delete<{ Params: { id: string; participanteId: string } }>(
    "/programas/:id/participantes/:participanteId",
    {
      ...removerParticipanteDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:programas:gerir"),
      ],
    },
    removerParticipanteController,
  );
}