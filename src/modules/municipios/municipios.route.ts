import type { FastifyInstance } from "fastify";
import {
  listarMunicipiosController,
  listarDirecoesDoMunicipioController,
  criarMunicipioController,
  obterMunicipioController,
} from "./municipios.controller.js";
import { criarMunicipioSchema } from "./municipios.schema.js";
import type { CriarMunicipioInput } from "./municipios.schema.js";
import {
  listarMunicipiosDocs,
  listarDirecoesDoMunicipioDocs,
  criarMunicipioDocs,
  obterMunicipioDocs,
} from "./municipio.docs.js";
import { validateBody } from "../../utils/validate.js";
import { requireAnyPermission } from "../../middleware/hasPermission.js";

export async function municipiosRoutes(fastify: FastifyInstance) {
  fastify.get("/municipios", { ...listarMunicipiosDocs }, listarMunicipiosController);

  fastify.get<{ Params: { id: string } }>(
    "/municipios/:id",
    { ...obterMunicipioDocs },
    obterMunicipioController,
  );

  fastify.get<{ Params: { id: string } }>(
    "/municipios/:id/direcoes",
    { ...listarDirecoesDoMunicipioDocs },
    listarDirecoesDoMunicipioController,
  );

  fastify.post<{ Body: CriarMunicipioInput }>(
    "/municipios",
    {
      ...criarMunicipioDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("municipios:criar"),
        validateBody(criarMunicipioSchema),
      ],
    },
    criarMunicipioController,
  );
}