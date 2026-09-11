import type { FastifyRequest, FastifyReply } from "fastify";
import {
  criarPerfil,
  desactivarPerfil,
  definirAcessoIlimitadoPonto,
  criarPermissao,
  associarPermissaoAoPerfil,
  desassociarPermissaoDoPerfil,
  listarPerfis,
  listarPermissoes,
  PerfilJaExisteError,
  PerfilNaoEncontradoError,
  PerfilSistemicoError,
  PermissaoJaExisteError,
} from "./rbac.service.js";
import type { CriarPerfilInput, CriarPermissaoInput, AssociarPermissaoInput, DefinirAcessoIlimitadoPontoInput } from "./rbac.schema.js";

interface ListarQuerystring {
  page?: string;
  pageSize?: string;
}

function tratarErroRbac(request: FastifyRequest, reply: FastifyReply, error: unknown, contexto: string) {
  if (error instanceof PerfilJaExisteError || error instanceof PermissaoJaExisteError) {
    return reply.status(409).send({ success: false, message: error.message });
  }
  if (error instanceof PerfilNaoEncontradoError) {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error instanceof PerfilSistemicoError) {
    return reply.status(403).send({ success: false, message: error.message });
  }
  request.log.error({ error }, contexto);
  return reply.status(500).send({ success: false, message: "Erro interno." });
}

// ─── LISTAR ───
export async function listarPerfisController(
  request: FastifyRequest<{ Querystring: ListarQuerystring }>,
  reply: FastifyReply
) {
  try {
    const page = Number(request.query.page) || 1;
    const pageSize = Number(request.query.pageSize) || 20;
    const resultado = await listarPerfis({ page, pageSize });
    return reply.send({ success: true, data: resultado });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao listar perfis");
  }
}

export async function listarPermissoesController(
  request: FastifyRequest<{ Querystring: ListarQuerystring }>,
  reply: FastifyReply
) {
  try {
    const page = Number(request.query.page) || 1;
    const pageSize = Number(request.query.pageSize) || 100;
    const resultado = await listarPermissoes({ page, pageSize });
    return reply.send({ success: true, data: resultado });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao listar permissões");
  }
}

// ─── CRIAR / DESACTIVAR ───
export async function criarPerfilController(
  request: FastifyRequest<{ Body: CriarPerfilInput }>,
  reply: FastifyReply
) {
  try {
    const perfil = await criarPerfil(request.body);
    return reply.status(201).send({ success: true, data: perfil });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao criar perfil");
  }
}

export async function desactivarPerfilController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await desactivarPerfil(request.params.id);
    return reply.send({ success: true, message: "Perfil desactivado com sucesso." });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao desactivar perfil");
  }
}

export async function definirAcessoIlimitadoPontoController(
  request: FastifyRequest<{ Params: { id: string }; Body: DefinirAcessoIlimitadoPontoInput }>,
  reply: FastifyReply
) {
  try {
    const perfil = await definirAcessoIlimitadoPonto(request.params.id, request.body.acessoIlimitadoPonto);
    return reply.send({ success: true, data: perfil });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao definir acesso ilimitado ao ponto");
  }
}

export async function criarPermissaoController(
  request: FastifyRequest<{ Body: CriarPermissaoInput }>,
  reply: FastifyReply
) {
  try {
    const permissao = await criarPermissao(request.body);
    return reply.status(201).send({ success: true, data: permissao });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao criar permissão");
  }
}

// ─── ASSOCIAÇÕES ───
export async function associarPermissaoController(
  request: FastifyRequest<{ Params: { id: string }; Body: AssociarPermissaoInput }>,
  reply: FastifyReply
) {
  try {
    await associarPermissaoAoPerfil({
      perfilId: request.params.id,
      permissaoId: request.body.permissaoId,
      executorId: request.user.sub,
      municipioIdParaAuditoria: request.user.municipioId,
    });
    return reply.status(201).send({ success: true, message: "Permissão associada com sucesso." });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao associar permissão ao perfil");
  }
}

export async function desassociarPermissaoController(
  request: FastifyRequest<{ Params: { id: string; permissaoId: string } }>,
  reply: FastifyReply
) {
  try {
    await desassociarPermissaoDoPerfil({
      perfilId: request.params.id,
      permissaoId: request.params.permissaoId,
      executorId: request.user.sub,
      municipioIdParaAuditoria: request.user.municipioId,
    });
    return reply.send({ success: true, message: "Permissão desassociada com sucesso." });
  } catch (error) {
    return tratarErroRbac(request, reply, error, "Erro ao desassociar permissão do perfil");
  }
}