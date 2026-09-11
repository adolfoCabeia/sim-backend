import type { FastifyRequest, FastifyReply } from "fastify";
import { uploadImagem } from "../../storage/upload-imagem.js";
import { storageService, TipoFicheiroInvalidoError } from "../../storage/storage.service.js";
import {
  criarFuncionario,
  atualizarFuncionario,
  obterFuncionario,
  obterFuncionarioPorUtilizador,
  listarFuncionarios,
  adicionarHabilitacao,
  removerHabilitacao,
  FuncionarioNaoEncontradoError,
  FuncionarioJaExisteError,
  HabilitacaoNaoEncontradaError,
} from "./funcionario.service.js";
import {
  criarFuncionarioSchema,
  atualizarFuncionarioSchema,
  adicionarHabilitacaoSchema,
  listarFuncionariosQuerySchema,
} from "./funcionario.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof FuncionarioNaoEncontradoError || error instanceof HabilitacaoNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof FuncionarioJaExisteError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof TipoFicheiroInvalidoError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

/* ─── Leitura genérica de multipart: campos de texto + ficheiros ─── */

function limparCampoTexto(valor: unknown): unknown {
  if (typeof valor === "string" && valor.trim() === "") return undefined;
  return valor;
}

interface FicheiroRecebido {
  buffer: Buffer;
  nomeOriginal?: string;
}

async function lerMultipart(
  request: FastifyRequest,
  camposFicheiroEsperados: string[],
  camposIgnorados: string[] = []
): Promise<{ campos: Record<string, unknown>; ficheiros: Record<string, FicheiroRecebido> }> {
  const camposTextoBruto: Record<string, unknown> = {};
  const ficheiros: Record<string, FicheiroRecebido> = {};

  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (camposFicheiroEsperados.includes(part.fieldname)) {
        ficheiros[part.fieldname] = { buffer: await part.toBuffer(), nomeOriginal: part.filename };
      } else {
        // Drena ficheiros inesperados para não bloquear o stream.
        await part.toBuffer();
      }
    } else {
      camposTextoBruto[part.fieldname] = part.value;
    }
  }

  const campos: Record<string, unknown> = {};
  for (const [key, valor] of Object.entries(camposTextoBruto)) {
    if (camposIgnorados.includes(key)) continue;
    const limpo = limparCampoTexto(valor);
    if (limpo !== undefined) campos[key] = limpo;
  }

  return { campos, ficheiros };
}

/* ─── Funcionário ─── */

export async function criarFuncionarioController(request: FastifyRequest, reply: FastifyReply) {
  try {
    // direcaoId é ignorado aqui — vem do Utilizador, não do Funcionário.
    const { campos, ficheiros } = await lerMultipart(request, ["fotografia", "cv"], ["direcaoId"]);

    request.log.debug({ campos }, "Campos de texto recebidos no multipart");

    const parse = criarFuncionarioSchema.safeParse(campos);
    if (!parse.success) {
      request.log.warn({ errors: parse.error.flatten().fieldErrors, campos }, "Validação Zod falhou ao criar funcionário");
      return reply.status(400).send({
        success: false,
        message: "Dados inválidos.",
        errors: parse.error.flatten().fieldErrors,
      });
    }

    let fotografiaKey: string | undefined;
    let cvKey: string | undefined;

    if (ficheiros.fotografia) {
      const up = await uploadImagem({
        buffer: ficheiros.fotografia.buffer,
        prefixo: "funcionarios/fotografias",
        ...(ficheiros.fotografia.nomeOriginal !== undefined && { nomeOriginal: ficheiros.fotografia.nomeOriginal }),
      });
      fotografiaKey = up.storageKey;
    }

    if (ficheiros.cv) {
      const up = await storageService.uploadDocumento({
        buffer: ficheiros.cv.buffer,
        prefixo: "funcionarios/cvs",
        ...(ficheiros.cv.nomeOriginal !== undefined && { nomeOriginal: ficheiros.cv.nomeOriginal }),
        mimeTiposAceites: ["application/pdf"],
      });
      cvKey = up.storageKey;
    }

    const funcionario = await criarFuncionario({
      municipioId: request.user.municipioId,
      input: parse.data,
      ...(fotografiaKey !== undefined && { fotografiaKey }),
      ...(cvKey !== undefined && { cvKey }),
    });

    return reply.status(201).send({ success: true, data: funcionario });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar funcionário");
  }
}

export async function atualizarFuncionarioController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    // Passa a ler multipart (antes só lia JSON, o que tornava impossível
    // substituir fotografia/cv depois de criado o funcionário).
    const { campos, ficheiros } = await lerMultipart(request, ["fotografia", "cv"], ["direcaoId"]);

    const parse = atualizarFuncionarioSchema.safeParse(campos);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados inválidos.",
        errors: parse.error.flatten().fieldErrors,
      });
    }

    let fotografiaKey: string | undefined;
    let cvKey: string | undefined;

    if (ficheiros.fotografia) {
      const up = await uploadImagem({
        buffer: ficheiros.fotografia.buffer,
        prefixo: "funcionarios/fotografias",
        ...(ficheiros.fotografia.nomeOriginal !== undefined && { nomeOriginal: ficheiros.fotografia.nomeOriginal }),
      });
      fotografiaKey = up.storageKey;
    }

    if (ficheiros.cv) {
      const up = await storageService.uploadDocumento({
        buffer: ficheiros.cv.buffer,
        prefixo: "funcionarios/cvs",
        ...(ficheiros.cv.nomeOriginal !== undefined && { nomeOriginal: ficheiros.cv.nomeOriginal }),
        mimeTiposAceites: ["application/pdf"],
      });
      cvKey = up.storageKey;
    }

    const funcionario = await atualizarFuncionario({
      municipioId: request.user.municipioId,
      id: request.params.id,
      input: parse.data,
      ...(fotografiaKey !== undefined && { fotografiaKey }),
      ...(cvKey !== undefined && { cvKey }),
    });

    return reply.send({ success: true, data: funcionario });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao atualizar funcionário");
  }
}

export async function obterFuncionarioController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const funcionario = await obterFuncionario({ municipioId: request.user.municipioId, id: request.params.id });
    return reply.send({ success: true, data: funcionario });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter funcionário");
  }
}

export async function obterMeuPerfilController(request: FastifyRequest, reply: FastifyReply) {
  const funcionario = await obterFuncionarioPorUtilizador({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
  });
  return reply.send({ success: true, data: funcionario });
}

export async function listarFuncionariosController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parse = listarFuncionariosQuerySchema.safeParse(request.query);
  if (!parse.success) {
    return reply.status(400).send({
      success: false,
      message: "Parâmetros de listagem inválidos.",
      errors: parse.error.flatten().fieldErrors,
    });
  }

  const resultado = await listarFuncionarios({
    municipioId: request.user.municipioId,
    query: parse.data,
  });
  return reply.send({ success: true, data: resultado });
}

/* ─── URLs de visualização (presigned) ─── */

export async function obterFotografiaFuncionarioController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const funcionario = await obterFuncionario({ municipioId: request.user.municipioId, id: request.params.id });
    if (!funcionario.fotografiaUrl) {
      return reply.status(404).send({ success: false, message: "Este funcionário não tem fotografia." });
    }
    const url = await storageService.gerarUrlVisualizacao(funcionario.fotografiaUrl);
    return reply.send({ success: true, data: { url } });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter fotografia do funcionário");
  }
}

export async function obterCvFuncionarioController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const funcionario = await obterFuncionario({ municipioId: request.user.municipioId, id: request.params.id });
    if (!funcionario.cvUrl) {
      return reply.status(404).send({ success: false, message: "Este funcionário não tem CV." });
    }
    const url = await storageService.gerarUrlVisualizacao(funcionario.cvUrl);
    return reply.send({ success: true, data: { url } });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter CV do funcionário");
  }
}


export async function adicionarHabilitacaoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    // Passa a multipart: o comprovativo é agora um ficheiro real enviado para o
    // MinIO, não um campo de texto com uma URL.
    const { campos, ficheiros } = await lerMultipart(request, ["comprovativo"]);

    const parse = adicionarHabilitacaoSchema.safeParse(campos);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados inválidos.",
        errors: parse.error.flatten().fieldErrors,
      });
    }

    let comprovativoKey: string | undefined;
    if (ficheiros.comprovativo) {
      const up = await storageService.uploadDocumento({
        buffer: ficheiros.comprovativo.buffer,
        prefixo: "funcionarios/habilitacoes",
        ...(ficheiros.comprovativo.nomeOriginal !== undefined && { nomeOriginal: ficheiros.comprovativo.nomeOriginal }),
        mimeTiposAceites: ["application/pdf", "image/jpeg", "image/png"],
      });
      comprovativoKey = up.storageKey;
    }

    const habilitacao = await adicionarHabilitacao({
      municipioId: request.user.municipioId,
      funcionarioId: request.params.id,
      input: parse.data,
      ...(comprovativoKey !== undefined && { comprovativoKey }),
    });

    return reply.status(201).send({ success: true, data: habilitacao });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao adicionar habilitação");
  }
}

export async function obterComprovativoHabilitacaoController(
  request: FastifyRequest<{ Params: { id: string; habilitacaoId: string } }>,
  reply: FastifyReply
) {
  try {
    const funcionario = await obterFuncionario({ municipioId: request.user.municipioId, id: request.params.id });
    const habilitacao = funcionario.habilitacoes.find((h) => h.id === request.params.habilitacaoId);
    if (!habilitacao) {
      return reply.status(404).send({ success: false, message: "Habilitação não encontrada." });
    }
    if (!habilitacao.comprovativoUrl) {
      return reply.status(404).send({ success: false, message: "Esta habilitação não tem comprovativo." });
    }
    const url = await storageService.gerarUrlVisualizacao(habilitacao.comprovativoUrl);
    return reply.send({ success: true, data: { url } });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter comprovativo da habilitação");
  }
}

export async function removerHabilitacaoController(
  request: FastifyRequest<{ Params: { id: string; habilitacaoId: string } }>,
  reply: FastifyReply
) {
  try {
    await removerHabilitacao({
      municipioId: request.user.municipioId,
      funcionarioId: request.params.id,
      habilitacaoId: request.params.habilitacaoId,
    });
    return reply.send({ success: true, data: null });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao remover habilitação");
  }
}