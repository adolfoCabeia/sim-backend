import type { FastifyRequest, FastifyReply } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import {
  submeterDocumento,
  listarPedidosPendentes,
  obterPedido,
  obterUrlDocumento,
  solicitarCorrecao,
  rejeitarDefinitivamente,
  aprovarNivel1,
  aprovarNivel2,
  PedidoNaoEncontradoError,
  EstadoInvalidoParaOperacaoError,
  SemPermissaoNivel2Error,
} from "./validation.service.js";
import { TipoFicheiroInvalidoError } from "../../storage/storage.service.js";
import { submeterDocumentoSchema } from "./validation.schema.js";
import type { AprovarPedidoInput, RejeitarPedidoInput } from "./validation.schema.js";


interface SubmeterDocumentoMultipartBody {
  documentoTipo: { value: string };
  documentoNumero: { value: string };
  perfilSolicitadoId?: { value: string };
  documento: MultipartFile;
}

export async function submeterDocumentoController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body = request.body as Partial<SubmeterDocumentoMultipartBody> | undefined;

    if (!body?.documento || typeof body.documento.toBuffer !== "function") {
      return reply.status(400).send({
        success: false,
        message: "É obrigatório anexar um ficheiro no campo 'documento' (multipart/form-data).",
      });
    }

    const dadosParaValidar = {
      documentoTipo: body.documentoTipo?.value,
      documentoNumero: body.documentoNumero?.value,
      perfilSolicitadoId: body.perfilSolicitadoId?.value || undefined,
    };

    const resultado = submeterDocumentoSchema.safeParse(dadosParaValidar);
    if (!resultado.success) {
      return reply.status(400).send({
        success: false,
        message: resultado.error.issues[0]?.message ?? "Dados inválidos.",
        errors: resultado.error.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensagem: issue.message,
        })),
      });
    }

    const ficheiroBuffer = await body.documento.toBuffer();

    const pedido = await submeterDocumento({
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
      documentoTipo: resultado.data.documentoTipo,
      documentoNumero: resultado.data.documentoNumero,
      ...(resultado.data.perfilSolicitadoId !== undefined
        ? { perfilSolicitadoId: resultado.data.perfilSolicitadoId }
        : {}),
      ficheiroBuffer,
      ...(body.documento.filename !== undefined && { nomeOriginal: body.documento.filename }),
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: pedido.id,
        estado: pedido.estado,
      },
    });
  } catch (error) {
    if (error instanceof TipoFicheiroInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao submeter documento de identidade");
    return reply
      .status(500)
      .send({ success: false, message: "Erro interno ao submeter documento." });
  }
}

export async function listarPedidosPendentesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const pedidos = await listarPedidosPendentes(request.user.municipioId);
    return reply.send({ success: true, data: pedidos });
  } catch (error) {
    request.log.error({ error }, "Erro ao listar pedidos de validação pendentes");
    return reply
      .status(500)
      .send({ success: false, message: "Erro interno ao listar pedidos." });
  }
}

export async function obterPedidoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const pedido = await obterPedido(request.params.id, request.user.municipioId);
    return reply.send({ success: true, data: pedido });
  } catch (error) {
    if (error instanceof PedidoNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao obter pedido de validação");
    return reply.status(500).send({ success: false, message: "Erro interno ao obter pedido." });
  }
}

export async function obterUrlDocumentoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const url = await obterUrlDocumento(request.params.id, request.user.municipioId);
    return reply.send({ success: true, data: { url } });
  } catch (error) {
    if (error instanceof PedidoNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof EstadoInvalidoParaOperacaoError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao gerar URL do documento");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function solicitarCorrecaoController(
  request: FastifyRequest<{ Params: { id: string }; Body: RejeitarPedidoInput }>,
  reply: FastifyReply
) {
  try {
    const actualizado = await solicitarCorrecao({
      pedidoId: request.params.id,
      municipioId: request.user.municipioId,
      motivoRejeicao: request.body.motivoRejeicao,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: actualizado });
  } catch (error) {
    if (error instanceof PedidoNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof EstadoInvalidoParaOperacaoError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao solicitar correcção");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function rejeitarDefinitivamenteController(
  request: FastifyRequest<{ Params: { id: string }; Body: RejeitarPedidoInput }>,
  reply: FastifyReply
) {
  try {
    const actualizado = await rejeitarDefinitivamente({
      pedidoId: request.params.id,
      municipioId: request.user.municipioId,
      motivoRejeicao: request.body.motivoRejeicao,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: actualizado });
  } catch (error) {
    if (error instanceof PedidoNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof EstadoInvalidoParaOperacaoError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao rejeitar definitivamente");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function aprovarNivel1Controller(
  request: FastifyRequest<{ Params: { id: string }; Body: AprovarPedidoInput }>,
  reply: FastifyReply
) {
  try {
    const actualizado = await aprovarNivel1({
      pedidoId: request.params.id,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: actualizado });
  } catch (error) {
    if (error instanceof PedidoNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof SemPermissaoNivel2Error) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof EstadoInvalidoParaOperacaoError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao aprovar pedido (nível 1)");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function aprovarNivel2Controller(
  request: FastifyRequest<{ Params: { id: string }; Body: AprovarPedidoInput }>,
  reply: FastifyReply
) {
  try {
    const actualizado = await aprovarNivel2({
      pedidoId: request.params.id,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: actualizado });
  } catch (error) {
    if (error instanceof PedidoNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof SemPermissaoNivel2Error) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof EstadoInvalidoParaOperacaoError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao aprovar pedido (nível 2)");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}
