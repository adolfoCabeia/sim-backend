import type { FastifyInstance } from "fastify";
import * as controller from "./fiscalizacao.controller.js";
import * as docs from "./fiscalizacao.docs.js";
import { criarAccaoFiscalizacaoSchema, registarCoimaSchema } from "./fiscalizacao.schema.js";
import type {
  CriarAccaoFiscalizacaoInput,
  RegistarCoimaInput,
  ListarAccoesQuery,
} from "./fiscalizacao.schema.js";
import { validateBody } from "../../utils/validate.js";
import { requirePermission } from "../../middleware/hasPermission.js";

export async function fiscalizacaoRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CriarAccaoFiscalizacaoInput }>(
    "/fiscalizacao",
    {
      ...docs.criarAccaoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("fiscalizacao:gerir"),
        validateBody(criarAccaoFiscalizacaoSchema),
      ],
    },
    controller.criarController
  );

  fastify.get<{ Querystring: ListarAccoesQuery }>(
    "/fiscalizacao",
    {
      ...docs.listarAccoesDocs,
      preHandler: [fastify.authenticate, requirePermission("fiscalizacao:consultar")],
    },
    controller.listarController
  );

  fastify.get<{ Params: { processoId: string } }>(
    "/fiscalizacao/:processoId",
    {
      ...docs.obterAccaoDocs,
      preHandler: [fastify.authenticate, requirePermission("fiscalizacao:consultar")],
    },
    controller.obterController
  );

  fastify.get<{ Params: { nome: string } }>(
    "/fiscalizacao/estabelecimentos/:nome/historico",
    {
      ...docs.historicoEstabelecimentoDocs,
      preHandler: [fastify.authenticate, requirePermission("fiscalizacao:consultar")],
    },
    controller.historicoEstabelecimentoController
  );

  fastify.post<{ Params: { processoId: string }; Body: RegistarCoimaInput }>(
    "/fiscalizacao/:processoId/coima",
    {
      ...docs.registarCoimaDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("fiscalizacao:aplicar-coima"),
        validateBody(registarCoimaSchema),
      ],
    },
    controller.registarCoimaController
  );
}