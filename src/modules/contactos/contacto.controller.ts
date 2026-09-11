import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarContacto,
  editarContacto,
  eliminarContacto,
  listarContactosAdmin,
  listarContactosPublico,
  ContactoNaoEncontradoError,
  DirecaoNaoEncontradaError,
} from "./contacto.service.js";
import type {
  CriarContactoInput,
  EditarContactoInput,
  ListarContactosQuery,
  ListarContactosPublicoQuery,
} from "./contacto.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof ContactoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof DirecaoNaoEncontradaError) {
    return reply.status(400).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

export async function criarContactoController(request: FastifyRequest<{ Body: CriarContactoInput }>, reply: FastifyReply) {
  try {
    const contacto = await criarContacto({
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: contacto });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar contacto institucional");
  }
}

export async function editarContactoController(
  request: FastifyRequest<{ Params: { id: string }; Body: EditarContactoInput }>,
  reply: FastifyReply
) {
  try {
    const contacto = await editarContacto({
      municipioId: request.user.municipioId,
      contactoId: request.params.id,
      input: request.body,
    });
    return reply.send({ success: true, data: contacto });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao editar contacto institucional");
  }
}

export async function eliminarContactoController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await eliminarContacto({ municipioId: request.user.municipioId, contactoId: request.params.id });
    return reply.status(204).send();
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao eliminar contacto institucional");
  }
}

export async function listarContactosAdminController(
  request: FastifyRequest<{ Querystring: ListarContactosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarContactosAdmin({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}

export async function listarContactosPublicoController(
  request: FastifyRequest<{ Querystring: ListarContactosPublicoQuery }>,
  reply: FastifyReply
) {
  if (!request.query.municipioId) {
    return reply.status(400).send({ success: false, message: "O parâmetro 'municipioId' é obrigatório (ver GET /municipios)." });
  }
  const resultado = await listarContactosPublico({ municipioId: request.query.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}
