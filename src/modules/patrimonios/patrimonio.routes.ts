import type { FastifyInstance } from "fastify";
import {
  listarBensController,
  obterBemController,
  criarBemController,
  editarBemController,
  transferirBemController,
  abaterBemController,
  adicionarFachadaController,
  adicionarImagemController,
  criarMovimentoController,
  actualizarRegularizacaoController,
  obterAlertasController,
} from "./patrimonio.controller.js";
import {
  editarBemSchema,
  transferirBemSchema,
  abaterBemSchema,
  criarMovimentoSchema,
  actualizarRegularizacaoSchema,
  listarBensQuerySchema,
} from "./patrimonio.schema.js";
import type {
  EditarBemInput,
  TransferirBemInput,
  AbaterBemInput,
  CriarMovimentoInput,
  ActualizarRegularizacaoInput,
  ListarBensQuery,
} from "./patrimonio.schema.js";
import { requirePermission } from "../../middleware/hasPermission.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import {
  listarBensDocs,
  obterBemDocs,
  criarBemDocs,
  editarBemDocs,
  transferirBemDocs,
  abaterBemDocs,
  adicionarFachadaDocs,
  adicionarImagemDocs,
  criarMovimentoDocs,
  actualizarRegularizacaoDocs,
  obterAlertasDocs,
} from "./patrimonio.docs.js";

export async function patrimonioRoutes(fastify: FastifyInstance) {
  // ─── Listagem e consulta ───
  fastify.get<{ Querystring: ListarBensQuery }>(
    "/bens",
    { ...listarBensDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:consultar"), validateQuery(listarBensQuerySchema)] },
    listarBensController
  );

  fastify.get(
    "/bens/alertas",
    { ...obterAlertasDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:consultar")] },
    obterAlertasController
  );

  fastify.get<{ Params: { id: string } }>(
    "/bens/:id",
    { ...obterBemDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:consultar")] },
    obterBemController
  );

  // ─── CRUD base ───
  // Multipart (imagens/fachadas): validação feita manualmente (Zod) dentro
  // do controller, depois de parseMultipart() — validateBody não serve
  // aqui porque request.body não é auto-populado para multipart.
  fastify.post(
    "/bens",
    { ...criarBemDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:gerir")] },
    criarBemController
  );

  fastify.patch<{ Params: { id: string }; Body: EditarBemInput }>(
    "/bens/:id",
    { ...editarBemDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:gerir"), validateBody(editarBemSchema)] },
    editarBemController
  );

  // ─── Operações específicas ───
  fastify.post<{ Params: { id: string }; Body: TransferirBemInput }>(
    "/bens/:id/transferir",
    { ...transferirBemDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:gerir"), validateBody(transferirBemSchema)] },
    transferirBemController
  );

  fastify.post<{ Params: { id: string }; Body: AbaterBemInput }>(
    "/bens/:id/abater",
    { ...abaterBemDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:gerir"), validateBody(abaterBemSchema)] },
    abaterBemController
  );

  fastify.post<{ Params: { id: string } }>(
    "/bens/:id/fachadas",
    { ...adicionarFachadaDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:gerir")] },
    adicionarFachadaController
  );

  fastify.post<{ Params: { id: string } }>(
    "/bens/:id/imagens",
    { ...adicionarImagemDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:gerir")] },
    adicionarImagemController
  );

  fastify.post<{ Params: { id: string }; Body: CriarMovimentoInput }>(
    "/bens/:id/movimentos",
    { ...criarMovimentoDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:gerir"), validateBody(criarMovimentoSchema)] },
    criarMovimentoController
  );

  fastify.post<{ Params: { id: string }; Body: ActualizarRegularizacaoInput }>(
    "/bens/:id/regularizacao",
    { ...actualizarRegularizacaoDocs, preHandler: [fastify.authenticate, requirePermission("patrimonio:juridico"), validateBody(actualizarRegularizacaoSchema)] },
    actualizarRegularizacaoController
  );
}