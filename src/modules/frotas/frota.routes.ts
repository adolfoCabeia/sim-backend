import type { FastifyInstance } from "fastify";
import {
  listarController,
  obterController,
  criarController,
  atualizarController,
  removerController,
  registrarUsoController,
  registrarRevisaoController,
  registrarAbastecimentoController,
  alertasController,
} from "./frota.controller.js";
import {
  frotaCreateSchema,
  frotaUpdateSchema,
  listarFrotaQuerySchema,
  registrarUsoSchema,
  registrarRevisaoSchema,
  registrarAbastecimentoSchema,
} from "./frota.schema.js";
import type {
  FrotaCreateInput,
  FrotaUpdateInput,
  ListarFrotaQuery,
  RegistrarUsoInput,
  RegistrarRevisaoInput,
  RegistrarAbastecimentoInput,
} from "./frota.schema.js";
import { requirePermission } from "../../middleware/hasPermission.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import {
  listarDocs,
  obterDocs,
  criarDocs,
  atualizarDocs,
  removerDocs,
  registrarUsoDocs,
  registrarRevisaoDocs,
  registrarAbastecimentoDocs,
  alertasDocs,
} from "./frota.docs.js";

export async function frotaRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarFrotaQuery }>(
    "/frotas",
    {
      ...listarDocs,
      preHandler: [fastify.authenticate, requirePermission("frota:consultar"), validateQuery(listarFrotaQuerySchema)],
    },
    listarController
  );

  fastify.get(
    "/frotas/alertas",
    { ...alertasDocs, preHandler: [fastify.authenticate, requirePermission("frota:consultar")] },
    alertasController
  );

  fastify.get<{ Params: { id: string } }>(
    "/frotas/:id",
    { ...obterDocs, preHandler: [fastify.authenticate, requirePermission("frota:consultar")] },
    obterController
  );

  fastify.post<{ Body: FrotaCreateInput }>(
    "/frotas",
    {
      ...criarDocs,
      preHandler: [fastify.authenticate, requirePermission("frota:gerir"), validateBody(frotaCreateSchema)],
    },
    criarController
  );

  fastify.put<{ Params: { id: string }; Body: FrotaUpdateInput }>(
    "/frotas/:id",
    {
      ...atualizarDocs,
      preHandler: [fastify.authenticate, requirePermission("frota:gerir"), validateBody(frotaUpdateSchema)],
    },
    atualizarController
  );

  fastify.delete<{ Params: { id: string } }>(
    "/frotas/:id",
    { ...removerDocs, preHandler: [fastify.authenticate, requirePermission("frota:gerir")] },
    removerController
  );

  fastify.post<{ Params: { id: string }; Body: RegistrarUsoInput }>(
    "/frotas/:id/uso",
    {
      ...registrarUsoDocs,
      preHandler: [fastify.authenticate, requirePermission("frota:gerir"), validateBody(registrarUsoSchema)],
    },
    registrarUsoController
  );

  fastify.post<{ Params: { id: string }; Body: RegistrarRevisaoInput }>(
    "/frotas/:id/revisao",
    {
      ...registrarRevisaoDocs,
      preHandler: [fastify.authenticate, requirePermission("frota:gerir"), validateBody(registrarRevisaoSchema)],
    },
    registrarRevisaoController
  );

  fastify.post<{ Params: { id: string }; Body: RegistrarAbastecimentoInput }>(
    "/frotas/:id/abastecimento",
    {
      ...registrarAbastecimentoDocs,
      preHandler: [fastify.authenticate, requirePermission("frota:gerir"), validateBody(registrarAbastecimentoSchema)],
    },
    registrarAbastecimentoController
  );
}