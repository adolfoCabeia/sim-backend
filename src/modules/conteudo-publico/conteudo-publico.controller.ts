import type { FastifyRequest, FastifyReply } from "fastify";
import type { TipoConta } from "../../generated/prisma/client.js";
import {
  criarConteudoPublico,
  editarConteudoPublico,
  publicarConteudoPublico,
  despublicarConteudoPublico,
  eliminarConteudoPublico,
  listarConteudosPublicosAdmin,
  obterConteudoPublicoAdmin,
  listarConteudosPublicos,
  obterConteudoPublicoPorChave,
  listarConteudosRestritosParaGrupo,
  ConteudoPublicoNaoEncontradoError,
  ChaveJaExisteError,
} from "./conteudo-publico.service.js";
import type {
  CriarConteudoPublicoInput,
  EditarConteudoPublicoInput,
  PublicarConteudoPublicoInput,
  ListarConteudosPublicosQuery,
  ListarConteudosPublicosPublicoQuery,
} from "./conteudo-publico.schema.js";

function tratarErro(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof ConteudoPublicoNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof ChaveJaExisteError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

function obterMunicipioIdPublico(request: FastifyRequest<{ Querystring: { municipioId?: string } }>) {
  return request.query.municipioId;
}

export async function criarConteudoPublicoController(
  request: FastifyRequest<{ Body: CriarConteudoPublicoInput }>,
  reply: FastifyReply
) {
  try {
    const conteudo = await criarConteudoPublico({
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.status(201).send({ success: true, data: conteudo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao criar conteúdo público");
  }
}

export async function editarConteudoPublicoController(
  request: FastifyRequest<{ Params: { id: string }; Body: EditarConteudoPublicoInput }>,
  reply: FastifyReply
) {
  try {
    const conteudo = await editarConteudoPublico({
      municipioId: request.user.municipioId,
      conteudoId: request.params.id,
      input: request.body,
    });
    return reply.send({ success: true, data: conteudo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao editar conteúdo público");
  }
}

export async function publicarConteudoPublicoController(
  request: FastifyRequest<{ Params: { id: string }; Body: PublicarConteudoPublicoInput }>,
  reply: FastifyReply
) {
  try {
    const conteudo = await publicarConteudoPublico({
      municipioId: request.user.municipioId,
      conteudoId: request.params.id,
      executorId: request.user.sub,
      input: request.body,
    });
    return reply.send({ success: true, data: conteudo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao publicar conteúdo público");
  }
}

export async function despublicarConteudoPublicoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const conteudo = await despublicarConteudoPublico({ municipioId: request.user.municipioId, conteudoId: request.params.id });
    return reply.send({ success: true, data: conteudo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao despublicar conteúdo público");
  }
}

export async function eliminarConteudoPublicoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await eliminarConteudoPublico({ municipioId: request.user.municipioId, conteudoId: request.params.id });
    return reply.status(204).send();
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao eliminar conteúdo público");
  }
}

export async function listarConteudosPublicosAdminController(
  request: FastifyRequest<{ Querystring: ListarConteudosPublicosQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarConteudosPublicosAdmin({ municipioId: request.user.municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}

export async function obterConteudoPublicoAdminController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const conteudo = await obterConteudoPublicoAdmin({ municipioId: request.user.municipioId, conteudoId: request.params.id });
    return reply.send({ success: true, data: conteudo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter conteúdo público");
  }
}

export async function listarConteudosPublicosController(
  request: FastifyRequest<{ Querystring: ListarConteudosPublicosPublicoQuery & { municipioId?: string } }>,
  reply: FastifyReply
) {
  const municipioId = obterMunicipioIdPublico(request);
  if (!municipioId) {
    return reply.status(400).send({ success: false, message: "O parâmetro 'municipioId' é obrigatório (ver GET /municipios)." });
  }
  const resultado = await listarConteudosPublicos({ municipioId, query: request.query });
  return reply.send({ success: true, data: resultado });
}

export async function obterConteudoPublicoPorChaveController(
  request: FastifyRequest<{ Params: { chave: string }; Querystring: { municipioId?: string } }>,
  reply: FastifyReply
) {
  const municipioId = obterMunicipioIdPublico(request);
  if (!municipioId) {
    return reply.status(400).send({ success: false, message: "O parâmetro 'municipioId' é obrigatório (ver GET /municipios)." });
  }
  try {
    const conteudo = await obterConteudoPublicoPorChave({ municipioId, chave: request.params.chave });
    return reply.send({ success: true, data: conteudo });
  } catch (error) {
    return tratarErro(request, reply, error, "Erro ao obter conteúdo público por chave");
  }
}

export async function listarConteudosRestritosController(
  request: FastifyRequest<{ Querystring: ListarConteudosPublicosPublicoQuery }>,
  reply: FastifyReply
) {
  const resultado = await listarConteudosRestritosParaGrupo({
    municipioId: request.user.municipioId,
    tipoConta: request.user.tipoConta as TipoConta,
    query: request.query,
  });
  return reply.send({ success: true, data: resultado });
}