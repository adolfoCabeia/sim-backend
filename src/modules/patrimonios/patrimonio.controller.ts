import type { FastifyRequest, FastifyReply } from "fastify";
import {
  listarBens,
  obterBem,
  criarBem,
  editarBem,
  transferirBem,
  abaterBem,
  adicionarFachada,
  adicionarImagem,
  criarMovimento,
  actualizarRegularizacaoJuridica,
  obterAlertasIrregularidade,
  BemNaoEncontradoError,
  BemJaAbatidoError,
  FachadaDuplicadaError,
  TransferenciaMesmaDirecaoError,
} from "./patrimonio.service.js";
import {
  criarBemSchema,
  adicionarFachadaSchema,
  adicionarImagemSchema,
  FachadaDirecaoEnum,
  type EditarBemInput,
  type TransferirBemInput,
  type AbaterBemInput,
  type CriarMovimentoInput,
  type ActualizarRegularizacaoInput,
  type ListarBensQuery,
} from "./patrimonio.schema.js";

function tratarErroPatrimonio(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof BemNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof BemJaAbatidoError || error instanceof FachadaDuplicadaError || error instanceof TransferenciaMesmaDirecaoError) {
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

const FACHADAS_DIRECOES = FachadaDirecaoEnum.options;

export async function listarBensController(
  request: FastifyRequest<{ Querystring: ListarBensQuery }>,
  reply: FastifyReply
) {
  try {
    const dados = await listarBens({
      municipioId: request.user.municipioId,
      page: request.query.page,
      pageSize: request.query.pageSize,
      ...(request.query.categoria && { categoria: request.query.categoria }),
      ...(request.query.estado && { estado: request.query.estado }),
      ...(request.query.direcaoId && { direcaoId: request.query.direcaoId }),
      ...(request.query.search && { search: request.query.search }),
    });
    return reply.send({ success: true, data: dados });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao listar bens");
  }
}

export async function obterAlertasController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const alertas = await obterAlertasIrregularidade(request.user.municipioId);
    return reply.send({ success: true, data: alertas });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao listar alertas");
  }
}

export async function obterBemController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const bem = await obterBem(request.params.id, request.user.municipioId);
    return reply.send({ success: true, data: bem });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao obter bem");
  }
}

export async function criarBemController(request: FastifyRequest, reply: FastifyReply) {
  try {
    let camposBrutos: Record<string, unknown>;
    let fachadasBrutas: Array<{ direcao: string; buffer?: Buffer; descricao?: string }> = [];
    let logotipoBuffer: Buffer | undefined;

    if (request.isMultipart()) {
      const { fields, files } = await parseMultipart(request);
      camposBrutos = fields;

      for (const dir of FACHADAS_DIRECOES) {
        const buffer = files[`fachada_${dir}`]?.[0];
        const descricao = fields[`fachadaDescricao_${dir}`];
        if (buffer) {
          fachadasBrutas.push({ direcao: dir, buffer, ...(descricao && { descricao }) });
        }
      }

      logotipoBuffer = files.logotipo?.[0];
    } else {
      camposBrutos = request.body as Record<string, unknown>;
    }

    const parsed = criarBemSchema.safeParse(camposBrutos);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: "Dados inválidos.", errors: parsed.error.issues });
    }
    const dados = parsed.data;

    const fachadas = fachadasBrutas.map((f) => ({
      direcao: f.direcao,
      ...(f.buffer && { imagemBuffer: f.buffer }),
      ...(f.descricao && { descricao: f.descricao }),
    }));

    const bem = await criarBem({
      dados: dados as any,
      ...(fachadas.length > 0 && { fachadas }),
      ...(logotipoBuffer && { logotipoBuffer }),
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.status(201).send({ success: true, data: bem });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao criar bem");
  }
}

export async function editarBemController(
  request: FastifyRequest<{ Params: { id: string }; Body: EditarBemInput }>,
  reply: FastifyReply
) {
  try {
    const bem = await editarBem({
      id: request.params.id,
      dados: request.body as any,
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: bem });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao editar bem");
  }
}

export async function transferirBemController(
  request: FastifyRequest<{ Params: { id: string }; Body: TransferirBemInput }>,
  reply: FastifyReply
) {
  try {
    const bem = await transferirBem({
      bemId: request.params.id,
      direcaoDestinoId: request.body.direcaoDestinoId,
      ...(request.body.observacao && { observacao: request.body.observacao }),
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: bem, message: "Bem transferido com sucesso." });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao transferir bem");
  }
}

export async function abaterBemController(
  request: FastifyRequest<{ Params: { id: string }; Body: AbaterBemInput }>,
  reply: FastifyReply
) {
  try {
    const bem = await abaterBem({
      bemId: request.params.id,
      motivo: request.body.motivo,
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: bem, message: "Bem abatido com sucesso." });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao abater bem");
  }
}

export async function adicionarFachadaController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { fields, files } = await parseMultipart(request);

    const parsed = adicionarFachadaSchema.safeParse(fields);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: "Dados inválidos.", errors: parsed.error.issues });
    }

    const imagemBuffer = files.imagem?.[0];

    const fachada = await adicionarFachada({
      bemId: request.params.id,
      direcao: parsed.data.direcao,
      ...(imagemBuffer && { imagemBuffer }),
      ...(parsed.data.descricao && { descricao: parsed.data.descricao }),
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.status(201).send({ success: true, data: fachada });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao adicionar fachada");
  }
}

export async function adicionarImagemController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { fields, files } = await parseMultipart(request);

    const parsed = adicionarImagemSchema.safeParse(fields);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: "Dados inválidos.", errors: parsed.error.issues });
    }

    const imagemBuffer = files.imagem?.[0];
    if (!imagemBuffer) {
      return reply.status(400).send({ success: false, message: "Imagem obrigatória." });
    }

    const imagem = await adicionarImagem({
      bemId: request.params.id,
      imagemBuffer,
      ...(parsed.data.legenda && { legenda: parsed.data.legenda }),
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.status(201).send({ success: true, data: imagem });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao anexar imagem");
  }
}

export async function criarMovimentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: CriarMovimentoInput }>,
  reply: FastifyReply
) {
  try {
    const body = request.body;
    const mov = await criarMovimento({
      bemId: request.params.id,
      tipo: body.tipo,
      descricao: body.descricao,
      ...(body.direcaoOrigemId && { direcaoOrigemId: body.direcaoOrigemId }),
      ...(body.direcaoDestinoId && { direcaoDestinoId: body.direcaoDestinoId }),
      ...(body.valor !== undefined && { valor: body.valor }),
      ...(body.observacao && { observacao: body.observacao }),
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.status(201).send({ success: true, data: mov });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao registar movimento");
  }
}

export async function actualizarRegularizacaoController(
  request: FastifyRequest<{ Params: { id: string }; Body: ActualizarRegularizacaoInput }>,
  reply: FastifyReply
) {
  try {
    const body = request.body;
    const reg = await actualizarRegularizacaoJuridica({
      bemId: request.params.id,
      dados: {
        situacaoJuridica: body.situacaoJuridica,
        estadoOcupacao: body.estadoOcupacao,
        ...(body.historicoDocumental && { historicoDocumental: body.historicoDocumental }),
        ...(body.alertaIrregularidade !== undefined && { alertaIrregularidade: body.alertaIrregularidade }),
        ...(body.processos && { processos: body.processos }),
      },
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
    });
    return reply.send({ success: true, data: reg });
  } catch (error) {
    return tratarErroPatrimonio(request, reply, error, "Erro ao actualizar regularização");
  }
}