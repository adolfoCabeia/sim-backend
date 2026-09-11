import type { FastifyRequest, FastifyReply } from "fastify";
import {
  listarPagamentosDoProcesso,
  listarMeusPagamentos,
  listarPagamentos,
  confirmarPagamento,
  ajustarValorPagamento,
  cancelarPagamento,
  PagamentoNaoEncontradoError,
  PagamentoJaProcessadoError,
  obterResumoPagamentos,
} from "./pagamento.service.js";
import type {
  ConfirmarPagamentoInput,
  CancelarPagamentoInput,
  AjustarValorPagamentoInput,
  ListarPagamentosQuery,
} from "./pagamento.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof PagamentoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof PagamentoJaProcessadoError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function listarPagamentosDoProcessoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const pagamentos = await listarPagamentosDoProcesso({
    municipioId: request.user.municipioId,
    processoId: request.params.id,
  });
  return reply.send({ success: true, data: pagamentos });
}

export async function listarMeusPagamentosController(
  request: FastifyRequest<{ Querystring: ListarPagamentosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarMeusPagamentos({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
    query: request.query,
  });
  return reply.send({ success: true, data: resultado });
}

export async function listarPagamentosController(
  request: FastifyRequest<{ Querystring: ListarPagamentosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarPagamentos({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}

export async function confirmarPagamentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: ConfirmarPagamentoInput }>,
  reply: FastifyReply
) {
  try {
    const pagamento = await confirmarPagamento({
      municipioId: request.user.municipioId,
      pagamentoId: request.params.id,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: pagamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao confirmar pagamento");
  }
}

export async function ajustarValorPagamentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: AjustarValorPagamentoInput }>,
  reply: FastifyReply
) {
  try {
    const pagamento = await ajustarValorPagamento({
      municipioId: request.user.municipioId,
      pagamentoId: request.params.id,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: pagamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao ajustar valor do pagamento");
  }
}

export async function cancelarPagamentoController(
  request: FastifyRequest<{ Params: { id: string }; Body: CancelarPagamentoInput }>,
  reply: FastifyReply
) {
  try {
    const pagamento = await cancelarPagamento({
      municipioId: request.user.municipioId,
      pagamentoId: request.params.id,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: pagamento });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao cancelar pagamento");
  }
}

export async function obterResumoPagamentosController(request: FastifyRequest, reply: FastifyReply) {
  const resumo = await obterResumoPagamentos({
    municipioId: request.user.municipioId,
    utilizadorId: request.user.sub,
    tipoConta: request.user.tipoConta,
  });
  return reply.send({ success: true, data: resumo });
}