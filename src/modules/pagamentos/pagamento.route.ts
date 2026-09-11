import type { FastifyInstance } from "fastify";
import {
  listarPagamentosDoProcessoController,
  listarMeusPagamentosController,
  listarPagamentosController,
  confirmarPagamentoController,
  ajustarValorPagamentoController,
  cancelarPagamentoController,
  obterResumoPagamentosController,
} from "./pagamento.controller.js";
import {
  confirmarPagamentoSchema,
  cancelarPagamentoSchema,
  ajustarValorPagamentoSchema,
  listarPagamentosQuerySchema,
} from "./pagamento.schema.js";
import type {
  ConfirmarPagamentoInput,
  CancelarPagamentoInput,
  AjustarValorPagamentoInput,
  ListarPagamentosQuery,
} from "./pagamento.schema.js";
import {
  listarMeusPagamentosDocs,
  listarPagamentosDocs,
  listarPagamentosDoProcessoDocs,
  confirmarPagamentoDocs,
  ajustarValorPagamentoDocs,
  cancelarPagamentoDocs,
  obterResumoPagamentosDocs,
} from "./pagamento.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission, requireAnyPermission } from "../../middleware/hasPermission.js";

export async function pagamentosRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListarPagamentosQuery }>(
    "/pagamentos/meus",
    { ...listarMeusPagamentosDocs, preHandler: [fastify.authenticate, validateQuery(listarPagamentosQuerySchema)] },
    listarMeusPagamentosController
  );

  fastify.get<{ Querystring: ListarPagamentosQuery }>(
    "/pagamentos",
    {
      ...listarPagamentosDocs,
      preHandler: [fastify.authenticate, requirePermission("pagamentos:consultar"), validateQuery(listarPagamentosQuerySchema)],
    },
    listarPagamentosController
  );
  fastify.get<{ Params: { id: string } }>(
    "/pagamentos/processo/:id",
    {
      ...listarPagamentosDoProcessoDocs,
      preHandler: [fastify.authenticate, requireAnyPermission("pagamentos:consultar", "processos_genericos:consultar")],
    },
    listarPagamentosDoProcessoController
  );

  fastify.post<{ Params: { id: string }; Body: ConfirmarPagamentoInput }>(
    "/pagamentos/:id/confirmar",
    {
      ...confirmarPagamentoDocs,
      preHandler: [fastify.authenticate, requirePermission("pagamentos:confirmar"), validateBody(confirmarPagamentoSchema)],
    },
    confirmarPagamentoController
  );

  fastify.post<{ Params: { id: string }; Body: AjustarValorPagamentoInput }>(
    "/pagamentos/:id/ajustar-valor",
    {
      ...ajustarValorPagamentoDocs,
      preHandler: [fastify.authenticate, requirePermission("pagamentos:gerar_rupe"), validateBody(ajustarValorPagamentoSchema)],
    },
    ajustarValorPagamentoController
  );

  fastify.post<{ Params: { id: string }; Body: CancelarPagamentoInput }>(
    "/pagamentos/:id/cancelar",
    {
      ...cancelarPagamentoDocs,
      preHandler: [fastify.authenticate, requirePermission("pagamentos:gerir"), validateBody(cancelarPagamentoSchema)],
    },
    cancelarPagamentoController
  );

  fastify.get(
  "/pagamentos/resumo",
  { ...obterResumoPagamentosDocs, preHandler: [fastify.authenticate] },
  obterResumoPagamentosController
);
}