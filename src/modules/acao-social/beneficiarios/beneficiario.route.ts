import type { FastifyInstance } from "fastify";
import {
  listarZonasSensiveisController,
  criarZonaSensivelController,
  listarBeneficiariosController,
  obterBeneficiarioController,
  criarBeneficiarioController,
  atualizarBeneficiarioController,
} from "./beneficiario.controller.js";
import {
  criarZonaSensivelSchema,
  criarBeneficiarioSchema,
  atualizarBeneficiarioSchema,
} from "./beneficiario.schema.js";
import type {
  CriarZonaSensivelInput,
  CriarBeneficiarioInput,
  AtualizarBeneficiarioInput,
  ListarBeneficiariosQuery,
} from "./beneficiario.schema.js";
import {
  listarZonasSensiveisDocs,
  criarZonaSensivelDocs,
  listarBeneficiariosDocs,
  obterBeneficiarioDocs,
  criarBeneficiarioDocs,
  atualizarBeneficiarioDocs,
} from "./beneficiario.docs.js";
import { validateBody } from "../../../utils/validate.js";
import { requireAnyPermission } from "../../../middleware/hasPermission.js";

export async function beneficiariosRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/zonas-sensiveis",
    { ...listarZonasSensiveisDocs, preHandler: [fastify.authenticate] },
    listarZonasSensiveisController,
  );

  fastify.post<{ Body: CriarZonaSensivelInput }>(
    "/zonas-sensiveis",
    {
      ...criarZonaSensivelDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:beneficiarios:gerir"),
        validateBody(criarZonaSensivelSchema),
      ],
    },
    criarZonaSensivelController,
  );

  fastify.get<{ Querystring: ListarBeneficiariosQuery }>(
    "/beneficiarios",
    {
      ...listarBeneficiariosDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:beneficiarios:consultar"),
      ],
    },
    listarBeneficiariosController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/beneficiarios/:id",
    {
      ...obterBeneficiarioDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:beneficiarios:consultar"),
      ],
    },
    obterBeneficiarioController,
  );

  fastify.post<{ Body: CriarBeneficiarioInput }>(
    "/beneficiarios",
    {
      ...criarBeneficiarioDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:beneficiarios:gerir"),
        validateBody(criarBeneficiarioSchema),
      ],
    },
    criarBeneficiarioController,
  );

  fastify.put<{ Params: { id: string }; Body: AtualizarBeneficiarioInput }>(
    "/beneficiarios/:id",
    {
      ...atualizarBeneficiarioDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("acao-social:beneficiarios:gerir"),
        validateBody(atualizarBeneficiarioSchema),
      ],
    },
    atualizarBeneficiarioController,
  );
}