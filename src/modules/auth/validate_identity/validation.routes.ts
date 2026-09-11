import type { FastifyInstance } from "fastify";
import {
  submeterDocumentoController,
  listarPedidosPendentesController,
  obterPedidoController,
  obterUrlDocumentoController,
  solicitarCorrecaoController,
  rejeitarDefinitivamenteController,
  aprovarNivel1Controller,
  aprovarNivel2Controller,
} from "./validation.controller.js";
import {
  aprovarPedidoSchema,
  rejeitarPedidoSchema,
} from "./validation.schema.js";
import type {
  AprovarPedidoInput,
  RejeitarPedidoInput,
} from "./validation.schema.js";
import {
  submeterDocumentoDocs,
  listarPedidosPendentesDocs,
  obterPedidoDocs,
  obterUrlDocumentoDocs,
  solicitarCorrecaoDocs,
  rejeitarDefinitivamenteDocs,
  aprovarNivel1Docs,
  aprovarNivel2Docs,
} from "./validation.docs.js";
import { validateBody } from "../../../utils/validate.js";
import { requirePermission, requireAnyPermission } from "../../../middleware/hasPermission.js";


export async function validationRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/validacao-identidade/documentos",
    {
      ...submeterDocumentoDocs,
      preHandler: [fastify.authenticate],
    },
    submeterDocumentoController
  );

  fastify.get(
    "/validacao-identidade/pedidos",
    {
      ...listarPedidosPendentesDocs,
      preHandler: [fastify.authenticate, requirePermission("validacao_identidade:aprovar_nivel_1")],
    },
    listarPedidosPendentesController
  );

  fastify.get<{ Params: { id: string } }>(
    "/validacao-identidade/pedidos/:id",
    {
      ...obterPedidoDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission(
          "validacao_identidade:aprovar_nivel_1",
          "validacao_identidade:aprovar_nivel_2"
        ),
      ],
    },
    obterPedidoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/validacao-identidade/pedidos/:id/documento-url",
    {
      ...obterUrlDocumentoDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission(
          "validacao_identidade:aprovar_nivel_1",
          "validacao_identidade:aprovar_nivel_2"
        ),
      ],
    },
    obterUrlDocumentoController
  );

  fastify.post<{ Params: { id: string }; Body: RejeitarPedidoInput }>(
    "/validacao-identidade/pedidos/:id/solicitar-correcao",
    {
      ...solicitarCorrecaoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("validacao_identidade:aprovar_nivel_1"),
        validateBody(rejeitarPedidoSchema),
      ],
    },
    solicitarCorrecaoController
  );

  fastify.post<{ Params: { id: string }; Body: RejeitarPedidoInput }>(
    "/validacao-identidade/pedidos/:id/rejeitar",
    {
      ...rejeitarDefinitivamenteDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("validacao_identidade:aprovar_nivel_1"),
        validateBody(rejeitarPedidoSchema),
      ],
    },
    rejeitarDefinitivamenteController
  );

  fastify.post<{ Params: { id: string }; Body: AprovarPedidoInput }>(
    "/validacao-identidade/pedidos/:id/aprovar-nivel-1",
    {
      ...aprovarNivel1Docs,
      preHandler: [
        fastify.authenticate,
        requirePermission("validacao_identidade:aprovar_nivel_1"),
        validateBody(aprovarPedidoSchema),
      ],
    },
    aprovarNivel1Controller
  );

  fastify.post<{ Params: { id: string }; Body: AprovarPedidoInput }>(
    "/validacao-identidade/pedidos/:id/aprovar-nivel-2",
    {
      ...aprovarNivel2Docs,
      preHandler: [
        fastify.authenticate,
        requirePermission("validacao_identidade:aprovar_nivel_2"),
        validateBody(aprovarPedidoSchema),
      ],
    },
    aprovarNivel2Controller
  );
}
