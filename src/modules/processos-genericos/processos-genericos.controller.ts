import type { FastifyRequest, FastifyReply } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import {
  criarProcessoGenerico,
  transicionarProcessoGenerico,
  listarProcessosGenericos,
  obterProcessoGenericoInterno,
  obterTimelineCidadao,
  arquivarDigital,
  arquivarMorto,
  atribuirResponsavelProcesso,
  listarFuncionariosParaAtribuicao,
  adicionarAnexoProcesso,
  listarDocumentosEmFaltaProcesso,
  apresentarAoAdministrador,
  despacharParaDireccao,
  despacharParaAssessorJuridico,
  expedirParaDireccao,
  subirResposta,
  prepararSaida,
  submeterParaDespachoSaida,
  despacharSaida,
  formalizarEnvioExterno,
  obterAnexoProcesso,
  obterAnexoSaidaCidadao,
  DirecaoNaoEncontradaError,
  receberRespostaSubida,
  registarAcessoArquivoMorto,
} from "./processos-genericos.service.js";
import { hasPermission } from "../auth/rbac/rbac.service.js";
import { storageService } from "../storage/storage.service.js";
import {
  ProcessoGenericoNaoEncontradoError,
  TransicaoGenericaInvalidaError,
  ProcessoJaArquivadoError,
  ProcessoNaoConcluidoError,
  DespachoFinalNaoAutorizadoError,
  AreaForaDaDelegacaoError,
  AtribuicaoInvalidaError,
  PagamentoPendenteError,
  ServicoNaoEncontradoError,
  ServicoIncompativelError,
  DocumentacaoIncompletaError,
  AnexoNaoAutorizadoError,
  AnexoNaoEncontradoError,
  ProcessoNaoAtribuidoAoExecutorError,
  AcaoRestritaAoGamError,
  CircuitoTransicaoInvalidaError,
  DespachoRoteamentoNaoAutorizadoError,
  ExpedicaoNaoAutorizadaError,
  DocumentoSaidaForaDeContextoError,
  DocumentoSaidaObrigatorioError,
} from "../../core/process-engine/process-engine.service.js";
import { listarAcoesDisponiveis } from "../../core/process-engine/process-engine.acoes.js";
import { uploadDocumento, TipoFicheiroInvalidoError } from "../../modules/storage/storage.service.js";
import { filtrarServicosCatalogo } from "../servicos/servico.service.js";
import type { OrigemProcessoGenerico, TipoProcessoGenerico as TipoProcessoGenericoEnum } from "../../generated/prisma/client.js";
import { anexarDocumentoSchema } from "./processos-genericos.schema.js";
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

async function parseMultipart(request: FastifyRequest): Promise<{
  fields: Record<string, string>;
  files: Record<string, Array<{ buffer: Buffer; filename: string; mimetype: string }>>;
}> {
  const fields: Record<string, string> = {};
  const files: Record<string, Array<{ buffer: Buffer; filename: string; mimetype: string }>> = {};

  for await (const part of request.parts()) {
    if (part.type === "file") {
      const buffer = await part.toBuffer();
      const fileData = {
        buffer,
        filename: part.filename,
        mimetype: part.mimetype,
      };
      const existing = files[part.fieldname];
      if (existing) {
        existing.push(fileData);
      } else {
        files[part.fieldname] = [fileData];
      }
    } else {
      fields[part.fieldname] = part.value as string;
    }
  }

  return { fields, files };
}

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof ProcessoGenericoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof AnexoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof TransicaoGenericaInvalidaError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof DespachoFinalNaoAutorizadoError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error instanceof AreaForaDaDelegacaoError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error instanceof PagamentoPendenteError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof AtribuicaoInvalidaError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  if (error instanceof ServicoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof ServicoIncompativelError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  if (error instanceof DocumentacaoIncompletaError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof AnexoNaoAutorizadoError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error instanceof ProcessoNaoAtribuidoAoExecutorError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error instanceof AcaoRestritaAoGamError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error instanceof CircuitoTransicaoInvalidaError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof DespachoRoteamentoNaoAutorizadoError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error instanceof ExpedicaoNaoAutorizadaError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof DocumentoSaidaForaDeContextoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof DocumentoSaidaObrigatorioError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof ProcessoJaArquivadoError || error instanceof ProcessoNaoConcluidoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof DirecaoNaoEncontradaError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  request.log.error({ err: error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarProcessoController(request: FastifyRequest<{ Body: CriarProcessoInput }>, reply: FastifyReply) {
  try {
    const processo = await criarProcessoGenerico({
      municipioId: request.user.municipioId,
      requerenteUtilizadorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar processo genérico");
  }
}

export async function obterAnexoController(
  request: FastifyRequest<{ Params: { id: string; anexoId: string } }>,
  reply: FastifyReply
) {
   const { id: processoId, anexoId } = request.params;
  const { municipioId, sub: executorId } = request.user; // ← sub é o utilizadorId

  const anexo = await obterAnexoProcesso({
    municipioId,
    processoId,
    anexoId,
    executorId,
  });

  const stream = await storageService.getObjectStream(anexo.storageKey);

  const extensao = anexo.nomeFicheiro.split(".").pop()?.toLowerCase() ?? "pdf";
  const contentType =
    extensao === "pdf"
      ? "application/pdf"
      : extensao === "png"
      ? "image/png"
      : extensao === "jpg" || extensao === "jpeg"
      ? "image/jpeg"
      : "application/octet-stream";

  reply.header("Content-Type", contentType);
  reply.header("Content-Disposition", `inline; filename="${encodeURIComponent(anexo.nomeFicheiro)}"`);
  reply.header("Cache-Control", "private, max-age=3600");

  return reply.send(stream);
}

export async function obterAnexoSaidaCidadaoController(
  request: FastifyRequest<{ Params: { id: string; anexoId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: processoId, anexoId } = request.params;
    const { municipioId, sub: utilizadorId } = request.user;

    const anexo = await obterAnexoSaidaCidadao({
      municipioId,
      processoId,
      anexoId,
      utilizadorId,
    });

    const stream = await storageService.getObjectStream(anexo.storageKey);

    const extensao = anexo.nomeFicheiro.split(".").pop()?.toLowerCase() ?? "pdf";
    const contentType =
      extensao === "pdf"
        ? "application/pdf"
        : extensao === "png"
        ? "image/png"
        : extensao === "jpg" || extensao === "jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

    reply.header("Content-Type", contentType);
    reply.header("Content-Disposition", `inline; filename="${encodeURIComponent(anexo.nomeFicheiro)}"`);
    reply.header("Cache-Control", "private, max-age=3600");

    return reply.send(stream);
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter documento de saída do processo (cidadão)");
  }
}

export async function listarAcoesDisponiveisController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const resultado = await listarAcoesDisponiveis({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: resultado });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar acções disponíveis");
  }
}

export async function transicionarProcessoController(
  request: FastifyRequest<{ Params: { id: string }; Body: TransicionarProcessoInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await transicionarProcessoGenerico({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao transicionar processo genérico");
  }
}

export async function listarProcessosController(
  request: FastifyRequest<{ Querystring: ListarProcessosGenericosQuery }>,
  reply: FastifyReply
) {
  // ACHADO DE AUDITORIA: o Arquivo Morto tem uma regra de negócio
  // explícita no documento do cliente (secção 8.1) — "o perfil da
  // Secretaria Geral não tem permissão de acesso directo; o acesso
  // depende de liberação explícita do Administrador Municipal,
  // registada em log". O parâmetro `arquivo=MORTO`/`TODOS` estava
  // disponível neste endpoint apenas atrás da permissão genérica
  // "processos_genericos:consultar" — a mesma que qualquer utilizador
  // com acesso normal a processos já tem — pelo que qualquer perfil
  // (incl. Secretaria Geral) conseguia listar processos em Arquivo
  // Morto sem qualquer liberação explícita nem registo de log. A rota
  // de mudança de estado para Arquivo Morto (`arquivo_morto:aceder`)
  // já estava correctamente protegida; faltava proteger a LEITURA.
  if (request.query.arquivo === "MORTO" || request.query.arquivo === "TODOS") {
    const permitido = await hasPermission(
      request.user.sub,
      request.user.municipioId,
      "arquivo_morto:aceder"
    );
    if (!permitido) {
      return reply.status(403).send({
        success: false,
        message:
          "Consulta ao Arquivo Morto requer liberação explícita do Administrador Municipal.",
        code: "PERMISSAO_INSUFICIENTE",
      });
    }
    await registarAcessoArquivoMorto({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      filtro: request.query.arquivo,
    });
  }

  const resultado = await listarProcessosGenericos({
    municipioId: request.user.municipioId,
    executorId: request.user.sub,
    query: request.query,
  });
  return reply.send({ success: true, data: resultado });
}

export async function listarAtribuidosAMimController(
  request: FastifyRequest<{ Querystring: Omit<ListarProcessosGenericosQuery, "atribuidosAMim"> }>,
  reply: FastifyReply
) {
  // Ver nota de auditoria em listarProcessosController — a mesma
  // restrição ao Arquivo Morto aplica-se aqui.
  if (request.query.arquivo === "MORTO" || request.query.arquivo === "TODOS") {
    const permitido = await hasPermission(
      request.user.sub,
      request.user.municipioId,
      "arquivo_morto:aceder"
    );
    if (!permitido) {
      return reply.status(403).send({
        success: false,
        message:
          "Consulta ao Arquivo Morto requer liberação explícita do Administrador Municipal.",
        code: "PERMISSAO_INSUFICIENTE",
      });
    }
    await registarAcessoArquivoMorto({
      municipioId: request.user.municipioId,
      utilizadorId: request.user.sub,
      filtro: request.query.arquivo,
    });
  }

  const resultado = await listarProcessosGenericos({
    municipioId: request.user.municipioId,
    executorId: request.user.sub,
    query: { ...request.query, atribuidosAMim: true },
  });
  return reply.send({ success: true, data: resultado });
}

export async function obterProcessoInternoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const processo = await obterProcessoGenericoInterno({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter processo genérico");
  }
}


export async function obterTimelineCidadaoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const processo = await obterTimelineCidadao({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      utilizadorId: request.user.sub,
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter timeline do processo");
  }
}

export async function arquivarDigitalController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const processo = await arquivarDigital({ municipioId: request.user.municipioId, processoId: request.params.id });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao mover processo para Arquivo Digital");
  }
}

export async function arquivarMortoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const processo = await arquivarMorto({ municipioId: request.user.municipioId, processoId: request.params.id });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao mover processo para Arquivo Morto");
  }
}

export async function atribuirResponsavelController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtribuirResponsavelInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await atribuirResponsavelProcesso({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      novoResponsavelActualId: request.body.novoResponsavelActualId,
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao atribuir responsável ao processo");
  }
}

/**
 * Lista os funcionários da direcção indicada com a contagem de processos
 * actualmente atribuídos a cada um — usado pelo diálogo de "Distribuir a
 * funcionário" para mostrar a carga de trabalho antes de escolher.
 */
export async function listarFuncionariosParaAtribuicaoController(
  request: FastifyRequest<{ Params: { direcaoId: string } }>,
  reply: FastifyReply
) {
  try {
    const funcionarios = await listarFuncionariosParaAtribuicao({
      municipioId: request.user.municipioId,
      direcaoId: request.params.direcaoId,
    });
    return reply.send({ success: true, data: funcionarios });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar funcionários da direcção");
  }
}

export async function anexarDocumentoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    if (!request.isMultipart()) {
      return reply.status(400).send({
        success: false,
        message: "O pedido tem de ser multipart/form-data.",
      });
    }

    const { fields, files } = await parseMultipart(request);

    const parsed = anexarDocumentoSchema.safeParse({
      ...(fields.tipoDocumentoCodigo !== undefined && {
        tipoDocumentoCodigo: fields.tipoDocumentoCodigo,
      }),
      ...(fields.tipoAnexo !== undefined && {
        tipoAnexo: fields.tipoAnexo.toUpperCase(),
      }),
    });
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados inválidos.",
        errors: parsed.error.issues,
      });
    }

    const documento = files.documento?.[0];
    if (!documento) {
      return reply.status(400).send({
        success: false,
        message: "É obrigatório anexar um ficheiro no campo 'documento'.",
      });
    }

    const upload = await uploadDocumento({
      buffer: documento.buffer,
      prefixo: `processos-genericos/${request.params.id}`,
      nomeOriginal: documento.filename,
    });

    const anexo = await adicionarAnexoProcesso({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      nomeFicheiro: upload.nomeOriginal,
      storageKey: upload.storageKey,
      utilizadorUploadId: request.user.sub,
      exigirRequerente: request.user.tipoConta !== "INTERNO",
      origemInterna: request.user.tipoConta === "INTERNO",
      ...(parsed.data.tipoDocumentoCodigo && {
        tipoDocumentoCodigo: parsed.data.tipoDocumentoCodigo,
      }),
      ...(parsed.data.tipoAnexo && { tipoAnexo: parsed.data.tipoAnexo }),
    });

    return reply.status(201).send({ success: true, data: anexo });
  } catch (error) {
    if (error instanceof TipoFicheiroInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    return tratarErro(request, reply, error, "Erro ao anexar documento ao processo");
  }
}

export async function listarDocumentosEmFaltaController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const emFalta = await listarDocumentosEmFaltaProcesso({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
    });
    return reply.send({ success: true, data: emFalta });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao consultar documentos em falta");
  }
}


export async function listarServicosMunicipaisController(
  request: FastifyRequest<{ Querystring: { origem?: string; tipo?: string; direcaoSigla?: string; municipioId?: string } }>,
  reply: FastifyReply
) {
  try {
    const { origem, tipo, direcaoSigla, municipioId } = request.query ?? {};
    if (!municipioId) {
      return reply.status(400).send({
        success: false,
        message:
          "O catálogo de serviços passou a ser por município — indique municipioId. Considere usar GET /servicos/publico.",
      });
    }
    const servicos = await filtrarServicosCatalogo({
      municipioId,
      ...(origem !== undefined && { origem: origem as OrigemProcessoGenerico }),
      ...(tipo !== undefined && { tipoProcesso: tipo as TipoProcessoGenericoEnum }),
      ...(direcaoSigla !== undefined && { direcaoResponsavelSigla: direcaoSigla }),
    });
    return reply.send({ success: true, data: servicos });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao listar catálogo de serviços");
  }
}

export async function apresentarAoAdministradorController(
  request: FastifyRequest<{ Params: { id: string }; Body: ApresentarAdministradorInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await apresentarAoAdministrador({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      ...(request.body?.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao apresentar processo ao Administrador");
  }
}

export async function despacharParaDireccaoController(
  request: FastifyRequest<{ Params: { id: string }; Body: DespacharEncaminhamentoInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await despacharParaDireccao({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      direcaoDespachadaSigla: request.body.direcaoDespachadaSigla,
      ...(request.body.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao despachar processo para a Direcção");
  }
}

export async function despacharParaAssessorJuridicoController(
  request: FastifyRequest<{ Params: { id: string }; Body: DespacharAssessorJuridicoInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await despacharParaAssessorJuridico({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      assessorUtilizadorId: request.body.assessorUtilizadorId,
      ...(request.body.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao despachar processo para o Assessor Jurídico");
  }
}

export async function expedirParaDireccaoController(
  request: FastifyRequest<{ Params: { id: string }; Body: ExpedirInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await expedirParaDireccao({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      ...(request.body?.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao expedir processo para a Direcção");
  }
}

export async function subirRespostaController(
  request: FastifyRequest<{ Params: { id: string }; Body: SubirRespostaInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await subirResposta({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      viaExpediente: request.body.viaExpediente,
      ...(request.body.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao subir a resposta do processo");
  }
}

export async function prepararSaidaController(
  request: FastifyRequest<{ Params: { id: string }; Body: PrepararSaidaInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await prepararSaida({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      ...(request.body?.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao preparar processo de saída");
  }
}

export async function submeterParaDespachoSaidaController(
  request: FastifyRequest<{ Params: { id: string }; Body: SubmeterDespachoSaidaInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await submeterParaDespachoSaida({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      ...(request.body?.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao submeter saída para despacho");
  }
}
export async function despacharSaidaController(
  request: FastifyRequest<{ Params: { id: string }; Body: DespacharSaidaInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await despacharSaida({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      autorizar: request.body.autorizar,
      ...(request.body.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao despachar saída");
  }
}

export async function formalizarEnvioExternoController(
  request: FastifyRequest<{ Params: { id: string }; Body: FormalizarEnvioExternoInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await formalizarEnvioExterno({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      destinoExterno: request.body.destinoExterno,
      ...(request.body.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao formalizar envio externo");
  }
}

export async function receberRespostaSubidaController(
  request: FastifyRequest<{ Params: { id: string }; Body: ApresentarAdministradorInput }>,
  reply: FastifyReply
) {
  try {
    const processo = await receberRespostaSubida({
      municipioId: request.user.municipioId,
      processoId: request.params.id,
      executorId: request.user.sub,
      ...(request.body?.observacao !== undefined && { observacao: request.body.observacao }),
    });
    return reply.send({ success: true, data: processo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao receber resposta subida ao Gabinete");
  }
}