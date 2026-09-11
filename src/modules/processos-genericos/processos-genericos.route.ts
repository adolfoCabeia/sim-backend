import type { FastifyInstance } from "fastify";
import {
  criarProcessoController,
  transicionarProcessoController,
  listarProcessosController,
  listarAtribuidosAMimController,
  obterProcessoInternoController,
  obterTimelineCidadaoController,
  arquivarDigitalController,
  arquivarMortoController,
  atribuirResponsavelController,
  listarFuncionariosParaAtribuicaoController,
  anexarDocumentoController,
  listarDocumentosEmFaltaController,
  listarServicosMunicipaisController,
  apresentarAoAdministradorController,
  despacharParaDireccaoController,
  despacharParaAssessorJuridicoController,
  expedirParaDireccaoController,
  subirRespostaController,
  prepararSaidaController,
  submeterParaDespachoSaidaController,
  despacharSaidaController,
  formalizarEnvioExternoController,
  obterAnexoController,
  obterAnexoSaidaCidadaoController,
  receberRespostaSubidaController,
  listarAcoesDisponiveisController
} from "./processos-genericos.controller.js";
import {
  criarProcessoSchema,
  transicionarProcessoSchema,
  listarProcessosGenericosQuerySchema,
  atribuirResponsavelSchema,
  apresentarAdministradorSchema,
  despacharEncaminhamentoSchema,
  despacharAssessorJuridicoSchema,
  expedirSchema,
  subirRespostaSchema,
  prepararSaidaSchema,
  submeterDespachoSaidaSchema,
  despacharSaidaSchema,
  formalizarEnvioExternoSchema,
} from "./processos-genericos.schema.js";
import type {
  CriarProcessoInput,
  TransicionarProcessoInput,
  ListarProcessosGenericosQuery,
  AtribuirResponsavelInput,
  ApresentarAdministradorInput,
  DespacharEncaminhamentoInput,
  DespacharAssessorJuridicoInput,
  ExpedirInput,
  SubirRespostaInput,
  PrepararSaidaInput,
  SubmeterDespachoSaidaInput,
  DespacharSaidaInput,
  FormalizarEnvioExternoInput,
} from "./processos-genericos.schema.js";
import {
  criarProcessoDocs,
  transicionarProcessoDocs,
  listarProcessosDocs,
  listarAtribuidosAMimDocs,
  obterProcessoInternoDocs,
  obterTimelineCidadaoDocs,
  arquivarDigitalDocs,
  arquivarMortoDocs,
  atribuirResponsavelDocs,
  listarFuncionariosParaAtribuicaoDocs,
  anexarDocumentoDocs,
  listarDocumentosEmFaltaDocs,
  listarServicosMunicipaisDocs,
  apresentarAoAdministradorDocs,
  despacharParaDireccaoDocs,
  despacharParaAssessorJuridicoDocs,
  expedirParaDireccaoDocs,
  subirRespostaDocs,
  prepararSaidaDocs,
  submeterParaDespachoSaidaDocs,
  despacharSaidaDocs,
  formalizarEnvioExternoDocs,
  obterAnexoDocs,
  obterAnexoSaidaCidadaoDocs,
  receberRespostaSubidaDocs,
  listarAcoesDisponiveisDocs,
} from "./processos-genericos.docs.js";
import { validateBody } from "../../utils/validate.js";
import { validateQuery } from "../../utils/validateQuery.js";
import { requirePermission, requireAnyPermission } from "../../middleware/hasPermission.js";
import {
  enviarMensagemProcessoController,
  listarMensagensProcessoController,
  contarNaoLidasProcessoController,
  listarConversasController,
  enviarAnexoMensagemProcessoController
} from "./processos-genericos-chat.controller.js";
import {
  enviarMensagemProcessoSchema,
  listarMensagensProcessoQuerySchema,
  listarConversasQuerySchema,
} from "./processos-genericos-chat.schema.js";
import type {
  EnviarMensagemProcessoInput,
  ListarMensagensProcessoQuery,
  ListarConversasQuery,
} from "./processos-genericos-chat.schema.js";
import {
  enviarMensagemProcessoDocs,
  listarMensagensProcessoDocs,
  contarNaoLidasProcessoDocs,
  listarConversasDocs,
  enviarAnexoMensagemProcessoDocs
} from "./processos-genericos-chat.docs.js";


export async function processosGenericosRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CriarProcessoInput }>(
    "/processos-genericos",
    {
      ...criarProcessoDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:criar"), validateBody(criarProcessoSchema)],
    },
    criarProcessoController
  );

  fastify.post<{ Params: { id: string }; Body: TransicionarProcessoInput }>(
    "/processos-genericos/:id/transicionar",
    {
      ...transicionarProcessoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:transicionar"),
        validateBody(transicionarProcessoSchema),
      ],
    },
    transicionarProcessoController
  );

  fastify.get<{ Querystring: ListarProcessosGenericosQuery }>(
    "/processos-genericos",
    {
      ...listarProcessosDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:consultar"), validateQuery(listarProcessosGenericosQuerySchema)],
    },
    listarProcessosController
  );

  fastify.get<{ Querystring: ListarProcessosGenericosQuery }>(
    "/processos-genericos/atribuidos-a-mim",
    {
      ...listarAtribuidosAMimDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:consultar"), validateQuery(listarProcessosGenericosQuerySchema)],
    },
    listarAtribuidosAMimController
  );

  fastify.get<{ Params: { id: string } }>(
    "/processos-genericos/:id",
    { ...obterProcessoInternoDocs, preHandler: [fastify.authenticate, requirePermission("processos_genericos:consultar")] },
    obterProcessoInternoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/portal-municipe/processos/:id/timeline",
    { ...obterTimelineCidadaoDocs, preHandler: [fastify.authenticate, requirePermission("portal_municipe:consultar_processo")] },
    obterTimelineCidadaoController
  );

  fastify.get<{ Params: { id: string; anexoId: string } }>(
    "/portal-municipe/processos/:id/documentos-saida/:anexoId",
    {
      ...obterAnexoSaidaCidadaoDocs,
      preHandler: [fastify.authenticate, requirePermission("portal_municipe:consultar_processo")],
    },
    obterAnexoSaidaCidadaoController
  );

  fastify.post<{ Params: { id: string } }>(
    "/processos-genericos/:id/arquivo-digital",
    { ...arquivarDigitalDocs, preHandler: [fastify.authenticate, requirePermission("processos_genericos:arquivar_digital")] },
    arquivarDigitalController
  );

  fastify.post<{ Params: { id: string } }>(
    "/processos-genericos/:id/arquivo-morto",
    { ...arquivarMortoDocs, preHandler: [fastify.authenticate, requirePermission("arquivo_morto:aceder")] },
    arquivarMortoController
  );

 fastify.get<{ Params: { id: string } }>(
  "/processos-genericos/:id/acoes-disponiveis",
  {
    ...listarAcoesDisponiveisDocs,
    preHandler: [fastify.authenticate, requirePermission("processos_genericos:consultar")],
  },
  listarAcoesDisponiveisController
);
  fastify.post<{ Params: { id: string }; Body: AtribuirResponsavelInput }>(
    "/processos-genericos/:id/atribuir",
    {
      ...atribuirResponsavelDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:atribuir_responsavel"),
        validateBody(atribuirResponsavelSchema),
      ],
    },
    atribuirResponsavelController
  );

  fastify.post<{ Params: { id: string } }>(
  "/processos-genericos/:id/mensagens/anexo",
  { ...enviarAnexoMensagemProcessoDocs, preHandler: [fastify.authenticate] },
  enviarAnexoMensagemProcessoController
);

  fastify.post<{ Params: { id: string }; Body: ApresentarAdministradorInput }>(
    "/processos-genericos/:id/receber-resposta-subida",
    {
      ...receberRespostaSubidaDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission(
          "processos_genericos:tramitar_gabinete",
          "processos_genericos:despachar_encaminhamento"
        ),
        validateBody(apresentarAdministradorSchema),
      ],
    },
    receberRespostaSubidaController
  );


  fastify.get<{ Params: { direcaoId: string } }>(
    "/processos-genericos/direccoes/:direcaoId/funcionarios",
    {
      ...listarFuncionariosParaAtribuicaoDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:atribuir_responsavel")],
    },
    listarFuncionariosParaAtribuicaoController
  );

  fastify.get("/servicos-municipais", { ...listarServicosMunicipaisDocs }, listarServicosMunicipaisController);

  fastify.post<{ Params: { id: string } }>(
    "/processos-genericos/:id/anexos",
    { ...anexarDocumentoDocs, preHandler: [fastify.authenticate, requirePermission("processos_genericos:anexar")] },
    anexarDocumentoController
  );

  fastify.get<{ Params: { id: string; anexoId: string } }>(
    "/processos-genericos/:id/anexos/:anexoId",
    {
      ...obterAnexoDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:consultar")],
    },
    obterAnexoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/processos-genericos/:id/documentos-em-falta",
    { ...listarDocumentosEmFaltaDocs, preHandler: [fastify.authenticate, requirePermission("processos_genericos:consultar")] },
    listarDocumentosEmFaltaController
  );

  fastify.post<{ Params: { id: string }; Body: ApresentarAdministradorInput }>(
    "/processos-genericos/:id/apresentar-administrador",
    {
      ...apresentarAoAdministradorDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:tramitar_gabinete"),
        validateBody(apresentarAdministradorSchema),
      ],
    },
    apresentarAoAdministradorController
  );

  fastify.post<{ Params: { id: string }; Body: DespacharEncaminhamentoInput }>(
    "/processos-genericos/:id/despachar-direccao",
    {
      ...despacharParaDireccaoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:despachar_encaminhamento"),
        validateBody(despacharEncaminhamentoSchema),
      ],
    },
    despacharParaDireccaoController
  );

  fastify.post<{ Params: { id: string }; Body: DespacharAssessorJuridicoInput }>(
    "/processos-genericos/:id/despachar-assessor-juridico",
    {
      ...despacharParaAssessorJuridicoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:despachar_encaminhamento"),
        validateBody(despacharAssessorJuridicoSchema),
      ],
    },
    despacharParaAssessorJuridicoController
  );

  fastify.post<{ Params: { id: string }; Body: ExpedirInput }>(
    "/processos-genericos/:id/expedir-direccao",
    {
      ...expedirParaDireccaoDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:expedir"), validateBody(expedirSchema)],
    },
    expedirParaDireccaoController
  );

  fastify.post<{ Params: { id: string }; Body: SubirRespostaInput }>(
    "/processos-genericos/:id/subir-resposta",
    {
      ...subirRespostaDocs,
      preHandler: [
        fastify.authenticate,
        requireAnyPermission("processos_genericos:expedir", "processos_genericos:tramitar_gabinete"),
        validateBody(subirRespostaSchema),
      ],
    },
    subirRespostaController
  );

  fastify.post<{ Params: { id: string }; Body: PrepararSaidaInput }>(
    "/processos-genericos/:id/preparar-saida",
    {
      ...prepararSaidaDocs,
      preHandler: [fastify.authenticate, requirePermission("processos_genericos:transicionar"), validateBody(prepararSaidaSchema)],
    },
    prepararSaidaController
  );

  fastify.post<{ Params: { id: string }; Body: SubmeterDespachoSaidaInput }>(
    "/processos-genericos/:id/submeter-despacho-saida",
    {
      ...submeterParaDespachoSaidaDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:transicionar"),
        validateBody(submeterDespachoSaidaSchema),
      ],
    },
    submeterParaDespachoSaidaController
  );

  fastify.post<{ Params: { id: string }; Body: DespacharSaidaInput }>(
    "/processos-genericos/:id/despachar-saida",
    {
      ...despacharSaidaDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:despachar_encaminhamento"),
        validateBody(despacharSaidaSchema),
      ],
    },
    despacharSaidaController
  );

  fastify.post<{ Params: { id: string }; Body: FormalizarEnvioExternoInput }>(
    "/processos-genericos/:id/formalizar-envio-externo",
    {
      ...formalizarEnvioExternoDocs,
      preHandler: [
        fastify.authenticate,
        requirePermission("processos_genericos:expedir"),
        validateBody(formalizarEnvioExternoSchema),
      ],
    },
    formalizarEnvioExternoController
  );

   fastify.get<{ Querystring: ListarConversasQuery }>(
    "/processos-genericos/conversas",
    { ...listarConversasDocs, preHandler: [fastify.authenticate, validateQuery(listarConversasQuerySchema)] },
    listarConversasController
  );

  fastify.post<{ Params: { id: string }; Body: EnviarMensagemProcessoInput }>(
    "/processos-genericos/:id/mensagens",
    {
      ...enviarMensagemProcessoDocs,
      preHandler: [fastify.authenticate, validateBody(enviarMensagemProcessoSchema)],
    },
    enviarMensagemProcessoController
  );

  fastify.get<{ Params: { id: string }; Querystring: ListarMensagensProcessoQuery }>(
    "/processos-genericos/:id/mensagens",
    {
      ...listarMensagensProcessoDocs,
      preHandler: [fastify.authenticate, validateQuery(listarMensagensProcessoQuerySchema)],
    },
    listarMensagensProcessoController
  );

  fastify.get<{ Params: { id: string } }>(
    "/processos-genericos/:id/mensagens/contagem",
    { ...contarNaoLidasProcessoDocs, preHandler: [fastify.authenticate] },
    contarNaoLidasProcessoController
  );
}