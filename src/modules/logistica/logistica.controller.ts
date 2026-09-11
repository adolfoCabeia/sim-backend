import type { FastifyRequest, FastifyReply } from "fastify";
import {
  listarRequisicoes,
  obterRequisicao,
  criarRequisicao,
  alterarEstadoRequisicao,
  adicionarAnexoEmpreitada,
  actualizarPercentagemEmpreitada,
  RequisicaoNaoEncontradaError,
  TransicaoEstadoInvalidaError,
  ItensVaziosError,
  AnexosInsuficientesError,
  actualizarRequisicao
} from "./logistica.service.js";
import {
  criarRequisicaoSchema,
  type AlterarEstadoInput,
  type ListarRequisicoesQuery,
    actualizarRequisicaoBemSchema,
  actualizarRequisicaoServicoSchema,
  actualizarRequisicaoEmpreitadaSchema,
} from "./logistica.schema.js";

function tratarErroLogistica(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof RequisicaoNaoEncontradaError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof TransicaoEstadoInvalidaError || error instanceof ItensVaziosError || error instanceof AnexosInsuficientesError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

async function parseMultipart(request: FastifyRequest): Promise<{
  fields: Record<string, string>;
  files: Record<string, Buffer[]>;
}> {
  const fields: Record<string, string> = {};
  const files: Record<string, Buffer[]> = {};

  for await (const part of request.parts()) {
    if (part.type === "file") {
      const buffer = await part.toBuffer();
      const existing = files[part.fieldname];
      if (existing) {
        existing.push(buffer);
      } else {
        files[part.fieldname] = [buffer];
      }
    } else {
      fields[part.fieldname] = part.value as string;
    }
  }

  return { fields, files };
}

export async function listarRequisicoesController(
  request: FastifyRequest<{ Querystring: ListarRequisicoesQuery }>,
  reply: FastifyReply
) {
  try {
    const dados = await listarRequisicoes({
      municipioId: request.user.municipioId,
      page: request.query.page,
      pageSize: request.query.pageSize,
      ...(request.query.categoria && { categoria: request.query.categoria }),
      ...(request.query.estado && { estado: request.query.estado }),
      ...(request.query.direcaoId && { direcaoId: request.query.direcaoId }),
    });
    return reply.send({ success: true, data: dados });
  } catch (error) {
    return tratarErroLogistica(request, reply, error, "Erro ao listar requisições");
  }
}

export async function obterRequisicaoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const req = await obterRequisicao(request.params.id, request.user.municipioId);
    return reply.send({ success: true, data: req });
  } catch (error) {
    return tratarErroLogistica(request, reply, error, "Erro ao obter requisição");
  }
}

export async function criarRequisicaoController(request: FastifyRequest, reply: FastifyReply) {
  try {
    let camposBrutos: Record<string, unknown>;
    const anexos: Array<{ buffer: Buffer; direcao?: string; descricao?: string }> = [];

    if (request.isMultipart()) {
      const { fields, files } = await parseMultipart(request);
      camposBrutos = fields;

      const totalAnexos = Number(fields.totalAnexos ?? 0);
      let metaAnexos: Array<{ direcao?: string; descricao?: string }> = [];
      if (fields.anexosMeta) {
        try {
          metaAnexos = JSON.parse(fields.anexosMeta);
        } catch {
          metaAnexos = [];
        }
      }

      for (let i = 0; i < totalAnexos; i++) {
        const buffer = files[`anexo_${i}`]?.[0];
        const meta = metaAnexos[i];
        if (buffer) {
          anexos.push({
            buffer,
            ...(meta?.direcao && { direcao: meta.direcao }),
            ...(meta?.descricao && { descricao: meta.descricao }),
          });
        }
      }
    } else {
      camposBrutos = request.body as Record<string, unknown>;
    }

    // Validação única para JSON (BEM/SERVICO) e multipart (EMPREITADA).
    // Os campos numéricos (prazoExecucao, percentagemExecucao, quantidade)
    // usam z.coerce.number() no schema, por isso strings vindas de
    // FormData são convertidas automaticamente.
    const parsed = criarRequisicaoSchema.safeParse(camposBrutos);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados inválidos.",
        errors: parsed.error.issues,
      });
    }
    const body = parsed.data;
    const categoria = body.categoria;

    const dados: any = {
      categoria,
      ...(body.designacao && { designacao: body.designacao }),
      ...(body.destinatario && { destinatario: body.destinatario }),
      ...(body.observacao && { observacao: body.observacao }),
      ...(body.direcaoId && { direcaoId: body.direcaoId }),
    };

    if (categoria === "SERVICO") {
      dados.tipoServico = body.tipoServico;
      if (body.dataProximaAccao) dados.dataProximaAccao = new Date(body.dataProximaAccao);
      if (body.beneficiarioServico) dados.beneficiarioServico = body.beneficiarioServico;
      if (body.especificacoesTecnicas) dados.especificacoesTecnicas = body.especificacoesTecnicas;
    }

    if (categoria === "EMPREITADA") {
      if (body.dataInicioObra) dados.dataInicioObra = new Date(body.dataInicioObra);
      if (body.estadoObra) dados.estadoObra = body.estadoObra;
      if (body.prazoExecucao !== undefined) dados.prazoExecucao = body.prazoExecucao;
      if (body.percentagemExecucao !== undefined) dados.percentagemExecucao = body.percentagemExecucao;
    }

    const req = await criarRequisicao({
      dados,
      ...(categoria === "BEM" ? { itens: body.itens } : {}),
      ...(anexos.length > 0 ? { anexos } : {}),
      requerenteId: request.user.sub,
      municipioId: request.user.municipioId,
    });

    return reply.status(201).send({ success: true, data: req });
  } catch (error) {
    return tratarErroLogistica(request, reply, error, "Erro ao criar requisição");
  }
}

export async function alterarEstadoController(
  request: FastifyRequest<{ Params: { id: string }; Body: AlterarEstadoInput }>,
  reply: FastifyReply
) {
  try {
    const req = await alterarEstadoRequisicao({
      id: request.params.id,
      novoEstado: request.body.estado,
      ...(request.body.motivo && { motivo: request.body.motivo }),
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: req, message: `Estado alterado para ${request.body.estado}.` });
  } catch (error) {
    return tratarErroLogistica(request, reply, error, "Erro ao alterar estado");
  }
}

export async function adicionarAnexoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { fields, files } = await parseMultipart(request);
    const imagem = files.imagem?.[0];
    if (!imagem) {
      return reply.status(400).send({ success: false, message: "Imagem obrigatória." });
    }

    const anexo = await adicionarAnexoEmpreitada({
      requisicaoId: request.params.id,
      buffer: imagem,
      ...(fields.direcao && { direcao: fields.direcao }),
      ...(fields.descricao && { descricao: fields.descricao }),
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.status(201).send({ success: true, data: anexo });
  } catch (error) {
    return tratarErroLogistica(request, reply, error, "Erro ao anexar imagem");
  }
}

export async function actualizarPercentagemController(
  request: FastifyRequest<{ Params: { id: string }; Body: { percentagem: number } }>,
  reply: FastifyReply
) {
  try {
    const req = await actualizarPercentagemEmpreitada({
      requisicaoId: request.params.id,
      percentagem: request.body.percentagem,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: req });
  } catch (error) {
    return tratarErroLogistica(request, reply, error, "Erro ao actualizar percentagem");
  }
}

export async function actualizarRequisicaoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const existente = await obterRequisicao(request.params.id, request.user.municipioId);

    const schema =
      existente.categoria === "BEM"
        ? actualizarRequisicaoBemSchema
        : existente.categoria === "SERVICO"
          ? actualizarRequisicaoServicoSchema
          : actualizarRequisicaoEmpreitadaSchema;

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: "Dados inválidos.", errors: parsed.error.issues });
    }
    const body: any = parsed.data;

    const dados: any = {
      ...(body.designacao !== undefined && { designacao: body.designacao }),
      ...(body.destinatario !== undefined && { destinatario: body.destinatario }),
      ...(body.observacao !== undefined && { observacao: body.observacao }),
      ...(body.direcaoId !== undefined && { direcaoId: body.direcaoId }),
    };

    if (existente.categoria === "SERVICO") {
      if (body.tipoServico !== undefined) dados.tipoServico = body.tipoServico;
      if (body.dataProximaAccao !== undefined) dados.dataProximaAccao = new Date(body.dataProximaAccao);
      if (body.beneficiarioServico !== undefined) dados.beneficiarioServico = body.beneficiarioServico;
      if (body.especificacoesTecnicas !== undefined) dados.especificacoesTecnicas = body.especificacoesTecnicas;
    }

    if (existente.categoria === "EMPREITADA") {
      if (body.dataInicioObra !== undefined) dados.dataInicioObra = new Date(body.dataInicioObra);
      if (body.estadoObra !== undefined) dados.estadoObra = body.estadoObra;
      if (body.prazoExecucao !== undefined) dados.prazoExecucao = body.prazoExecucao;
      if (body.percentagemExecucao !== undefined) dados.percentagemExecucao = body.percentagemExecucao;
    }

    const req = await actualizarRequisicao({
      id: request.params.id,
      categoria: existente.categoria,
      dados,
      ...(existente.categoria === "BEM" && body.itens ? { itens: body.itens } : {}),
      municipioId: request.user.municipioId,
    });

    return reply.send({ success: true, data: req });
  } catch (error) {
    return tratarErroLogistica(request, reply, error, "Erro ao actualizar requisição");
  }
}