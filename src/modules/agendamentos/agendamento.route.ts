import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
  import {
    criarAgendamentoController,
    confirmarAgendamentoController,
    cancelarAgendamentoController,
    reagendarAgendamentoController,
    marcarRealizadoController,
    marcarFaltaController,
    listarMeusAgendamentosController,
    listarAgendamentosController,
    listarAgendamentosHojeController,
    obterResumoAgendamentosController,
    obterStatusFilaController,
    estouACaminhoController,
    chamarAtendimentoController,
    listarOfertasPendentesController,
    aceitarOfertaController,
    recusarOfertaController,
  } from "./agendamento.controller.js";
  import {
    criarAgendamentoSchema,
    confirmarAgendamentoSchema,
    cancelarAgendamentoSchema,
    reagendarAgendamentoSchema,
    listarAgendamentosQuerySchema,
    listarMeusAgendamentosQuerySchema,
    listarAgendamentosHojeQuerySchema,
    estouACaminhoSchema,
    chamarAtendimentoSchema,
    responderOfertaSchema,
  } from "./agendamento.schema.js";
  import type {
    CriarAgendamentoInput,
    ConfirmarAgendamentoInput,
    CancelarAgendamentoInput,
    ReagendarAgendamentoInput,
    ListarAgendamentosQuery,
    ListarMeusAgendamentosQuery,
    ListarAgendamentosHojeQuery,
    EstouACaminhoInput,
    ChamarAtendimentoInput,
    ResponderOfertaInput,
  } from "./agendamento.schema.js";
  import {
    criarAgendamentoDocs,
    confirmarAgendamentoDocs,
    cancelarAgendamentoDocs,
    reagendarAgendamentoDocs,
    marcarRealizadoDocs,
    marcarFaltaDocs,
    listarMeusAgendamentosDocs,
    listarAgendamentosDocs,
    listarAgendamentosHojeDocs,
    obterResumoAgendamentosDocs,
    obterStatusFilaDocs,
    estouACaminhoDocs,
    chamarAtendimentoDocs,
    listarOfertasPendentesDocs,
    aceitarOfertaDocs,
    recusarOfertaDocs,
  } from "./agendamento.docs.js";
  import { validateBody } from "../../utils/validate.js";
  import { validateQuery } from "../../utils/validateQuery.js";
  import { requirePermission, requireAnyPermission } from "../../middleware/hasPermission.js";

  async function permitirCancelamentoProprioOuGerir(request: FastifyRequest, reply: FastifyReply) {
    if (request.user.tipoConta !== "INTERNO") return;
    return requirePermission("agendamentos:gerir")(request, reply);
  }

  export async function agendamentosRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: CriarAgendamentoInput }>(
      "/agendamentos",
      { ...criarAgendamentoDocs, preHandler: [fastify.authenticate, validateBody(criarAgendamentoSchema)] },
      criarAgendamentoController
    );

    // ALTERADO: passa a validar a querystring (era a única rota de
    // listagem sem isto), e aceita filtro por estado.
    fastify.get<{ Querystring: ListarMeusAgendamentosQuery }>(
      "/agendamentos/meus",
      {
        ...listarMeusAgendamentosDocs,
        preHandler: [fastify.authenticate, validateQuery(listarMeusAgendamentosQuerySchema)],
      },
      listarMeusAgendamentosController
    );

    // NOVO — requisito #4.
    fastify.get<{ Querystring: ListarAgendamentosHojeQuery }>(
      "/agendamentos/hoje",
      {
        ...listarAgendamentosHojeDocs,
        preHandler: [
          fastify.authenticate,
          requirePermission("agendamentos:consultar"),
          validateQuery(listarAgendamentosHojeQuerySchema),
        ],
      },
      listarAgendamentosHojeController
    );

    fastify.get<{ Querystring: ListarAgendamentosQuery }>(
      "/agendamentos",
      {
        ...listarAgendamentosDocs,
        preHandler: [fastify.authenticate, requirePermission("agendamentos:consultar"), validateQuery(listarAgendamentosQuerySchema)],
      },
      listarAgendamentosController
    );

    fastify.get(
      "/agendamentos/resumo",
      { ...obterResumoAgendamentosDocs, preHandler: [fastify.authenticate] },
      obterResumoAgendamentosController
    );

    fastify.post<{ Params: { id: string }; Body: ConfirmarAgendamentoInput }>(
      "/agendamentos/:id/confirmar",
      {
        ...confirmarAgendamentoDocs,
        preHandler: [fastify.authenticate, requirePermission("agendamentos:confirmar"), validateBody(confirmarAgendamentoSchema)],
      },
      confirmarAgendamentoController
    );

    fastify.post<{ Params: { id: string }; Body: CancelarAgendamentoInput }>(
      "/agendamentos/:id/cancelar",
      {
        ...cancelarAgendamentoDocs,
        preHandler: [fastify.authenticate, permitirCancelamentoProprioOuGerir, validateBody(cancelarAgendamentoSchema)],
      },
      cancelarAgendamentoController
    );

    // NOVO — reagendamento. Mesma regra de acesso que o cancelamento:
    // próprio requerente OU staff com "agendamentos:gerir".
    fastify.post<{ Params: { id: string }; Body: ReagendarAgendamentoInput }>(
      "/agendamentos/:id/reagendar",
      {
        ...reagendarAgendamentoDocs,
        preHandler: [fastify.authenticate, permitirCancelamentoProprioOuGerir, validateBody(reagendarAgendamentoSchema)],
      },
      reagendarAgendamentoController
    );

    fastify.post<{ Params: { id: string } }>(
      "/agendamentos/:id/realizado",
      { ...marcarRealizadoDocs, preHandler: [fastify.authenticate, requirePermission("agendamentos:gerir")] },
      marcarRealizadoController
    );

    fastify.post<{ Params: { id: string } }>(
      "/agendamentos/:id/falta",
      { ...marcarFaltaDocs, preHandler: [fastify.authenticate, requirePermission("agendamentos:gerir")] },
      marcarFaltaController
    );
    fastify.get<{ Params: { id: string } }>(
      "/agendamentos/:id/fila",
      { ...obterStatusFilaDocs, preHandler: [fastify.authenticate] },
      obterStatusFilaController
    );

    fastify.post<{ Params: { id: string }; Body: EstouACaminhoInput }>(
      "/agendamentos/:id/estou-a-caminho",
      {
        ...estouACaminhoDocs,
        preHandler: [fastify.authenticate, validateBody(estouACaminhoSchema)],
      },
      estouACaminhoController
    );

    // ALTERADO: já não é significativo o Body (numeroSenha deixou de
    // poder ser enviado pelo cliente — ver nota em agendamento.schema.ts).
    fastify.post<{ Params: { id: string }; Body: ChamarAtendimentoInput }>(
      "/agendamentos/:id/chamar",
      {
        ...chamarAtendimentoDocs,
        preHandler: [fastify.authenticate, requirePermission("agendamentos:gerir"), validateBody(chamarAtendimentoSchema)],
      },
      chamarAtendimentoController
    );
    fastify.get(
      "/ofertas/pendentes",
      { ...listarOfertasPendentesDocs, preHandler: [fastify.authenticate] },
      listarOfertasPendentesController
    );

    fastify.post<{ Params: { ofertaId: string } }>(
      "/ofertas/:ofertaId/aceitar",
      { ...aceitarOfertaDocs, preHandler: [fastify.authenticate] },
      aceitarOfertaController
    );

    fastify.post<{ Params: { ofertaId: string }; Body: ResponderOfertaInput }>(
      "/ofertas/:ofertaId/recusar",
      {
        ...recusarOfertaDocs,
        preHandler: [fastify.authenticate, validateBody(responderOfertaSchema)],
      },
      recusarOfertaController
    );
  }