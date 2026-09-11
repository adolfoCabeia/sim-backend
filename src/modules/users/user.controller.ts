import type { FastifyRequest, FastifyReply } from "fastify";
import {
  listarUtilizadores,
  obterUtilizador,
  criarUtilizador,
  editarUtilizador,
  editarMeuPerfil,
  alterarEstado,
  trocarPassword,
  redefinirPasswordUtilizador,
  obterMeuPerfilCompleto,
  atribuirPerfilAoUtilizador,
  revogarPerfilDoUtilizador,
  EmailJaExisteError,
  UtilizadorNaoEncontradoError,
  PasswordActualInvalidaError,
  AutoSuspensaoError,
  MunicipioDestinoNaoPermitidoError,
  DirecaoNaoEncontradaError,
  DepartamentoNaoEncontradoError,
  DepartamentoSemDirecaoError,
  SuperiorInvalidoError,
  TipoContaNaoElegivelParaRedefinicaoError,
} from "./user.service.js";
import {
  getPerfisDoUtilizador,
  listarTodosPerfisAtivos,
  listarTodasPermissoes,
  AutoEscaladaDePermissaoError,
  SuperAdminSingularError,
} from "../auth/rbac/rbac.service.js";
import type {
  ListarUtilizadoresQuery,
  CriarUtilizadorInput,
  EditarUtilizadorInput,
  EditarMeuPerfilInput,
  AlterarEstadoInput,
  ChangePasswordInput,
  AtribuirPerfilInput,
} from "./user.schema.js";

export async function listarUtilizadoresController(
  request: FastifyRequest<{ Querystring: ListarUtilizadoresQuery }>,
  reply: FastifyReply
) {
  try {
    const resultado = await listarUtilizadores(request.user.municipioId, request.query);
    return reply.send({ success: true, data: resultado });
  } catch (error) {
    request.log.error({ error }, "Erro ao listar utilizadores");
    return reply.status(500).send({ success: false, message: "Erro interno ao listar utilizadores." });
  }
}

export async function obterUtilizadorController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const utilizador = await obterUtilizador(request.params.id, request.user.municipioId);
    return reply.send({ success: true, data: utilizador });
  } catch (error) {
    if (error instanceof UtilizadorNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao obter utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno ao obter utilizador." });
  }
}

export async function criarUtilizadorController(
  request: FastifyRequest<{ Body: CriarUtilizadorInput }>,
  reply: FastifyReply
) {
  try {
    const utilizador = await criarUtilizador({
      input: request.body,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.status(201).send({ success: true, data: utilizador });
  } catch (error) {
    if (error instanceof EmailJaExisteError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    if (error instanceof MunicipioDestinoNaoPermitidoError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof DirecaoNaoEncontradaError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    if (error instanceof DepartamentoNaoEncontradoError || error instanceof DepartamentoSemDirecaoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    if (error instanceof SuperiorInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao criar utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno ao criar utilizador." });
  }
}

export async function editarUtilizadorController(
  request: FastifyRequest<{ Params: { id: string }; Body: EditarUtilizadorInput }>,
  reply: FastifyReply
) {
  try {
    const utilizador = await editarUtilizador({
      id: request.params.id,
      input: request.body,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: utilizador });
  } catch (error) {
    if (error instanceof UtilizadorNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof DirecaoNaoEncontradaError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    if (error instanceof DepartamentoNaoEncontradoError || error instanceof DepartamentoSemDirecaoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    if (error instanceof SuperiorInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao editar utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno ao editar utilizador." });
  }
}

export async function alterarEstadoController(
  request: FastifyRequest<{ Params: { id: string }; Body: AlterarEstadoInput }>,
  reply: FastifyReply
) {
  try {
    const utilizador = await alterarEstado({
      id: request.params.id,
      input: request.body,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: utilizador });
  } catch (error) {
    if (error instanceof AutoSuspensaoError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof UtilizadorNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao alterar estado do utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno ao alterar estado." });
  }
}

export async function desactivarUtilizadorController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const utilizador = await alterarEstado({
      id: request.params.id,
      input: { estado: "SUSPENSA", motivo: "Desactivado via DELETE /utilizadores/:id" },
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, data: utilizador });
  } catch (error) {
    if (error instanceof AutoSuspensaoError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof UtilizadorNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao desactivar utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno ao desactivar utilizador." });
  }
}

export async function obterMeuPerfilController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const perfilCompleto = await obterMeuPerfilCompleto(request.user.sub, request.user.municipioId);
    return reply.send({ success: true, data: perfilCompleto });
  } catch (error) {
    if (error instanceof UtilizadorNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao obter o próprio perfil");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function editarMeuPerfilController(
  request: FastifyRequest<{ Body: EditarMeuPerfilInput }>,
  reply: FastifyReply
) {
  try {
    const utilizador = await editarMeuPerfil({
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
      input: request.body,
    });
    return reply.send({ success: true, data: utilizador });
  } catch (error) {
    request.log.error({ error }, "Erro ao editar o próprio perfil");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function changePasswordController(
  request: FastifyRequest<{ Body: ChangePasswordInput }>,
  reply: FastifyReply
) {
  try {
    await trocarPassword({
      utilizadorId: request.user.sub,
      municipioId: request.user.municipioId,
      passwordActual: request.body.passwordActual,
      novaPassword: request.body.novaPassword,
    });
    return reply.send({ success: true, message: "Password alterada com sucesso." });
  } catch (error) {
    if (error instanceof PasswordActualInvalidaError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao trocar password");
    return reply.status(500).send({ success: false, message: "Erro interno ao trocar password." });
  }
}

export async function redefinirPasswordController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { temporaryPassword } = await redefinirPasswordUtilizador({
      utilizadorId: request.params.id,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.send({
      success: true,
      message:
        "Password redefinida. Foi enviado um email ao funcionário com a password temporária; " +
        "vai ser obrigado a escolher uma password nova no primeiro login.",
      data: { temporaryPassword },
    });
  } catch (error) {
    if (error instanceof UtilizadorNaoEncontradoError) {
      return reply.status(404).send({ success: false, message: error.message });
    }
    if (error instanceof TipoContaNaoElegivelParaRedefinicaoError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao redefinir password do utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno ao redefinir password." });
  }
}

export async function listarPerfisDoUtilizadorController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const perfis = await getPerfisDoUtilizador(request.params.id, request.user.municipioId);
    return reply.send({ success: true, data: perfis });
  } catch (error) {
    request.log.error({ error }, "Erro ao listar perfis do utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function atribuirPerfilController(
  request: FastifyRequest<{ Params: { id: string }; Body: AtribuirPerfilInput }>,
  reply: FastifyReply
) {
  try {
    await atribuirPerfilAoUtilizador({
      utilizadorId: request.params.id,
      perfilId: request.body.perfilId,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.status(201).send({ success: true, message: "Perfil atribuído com sucesso." });
  } catch (error) {
    if (error instanceof AutoEscaladaDePermissaoError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    if (error instanceof SuperAdminSingularError) {
      return reply.status(409).send({ success: false, message: error.message, code: "SUPER_ADMIN_SINGULAR" });
    }
    request.log.error({ error }, "Erro ao atribuir perfil");
    return reply.status(500).send({ success: false, message: "Erro interno ao atribuir perfil." });
  }
}

export async function revogarPerfilController(
  request: FastifyRequest<{ Params: { id: string; perfilId: string } }>,
  reply: FastifyReply
) {
  try {
    await revogarPerfilDoUtilizador({
      utilizadorId: request.params.id,
      perfilId: request.params.perfilId,
      municipioId: request.user.municipioId,
      executorId: request.user.sub,
    });
    return reply.send({ success: true, message: "Perfil revogado com sucesso." });
  } catch (error) {
    if (error instanceof AutoEscaladaDePermissaoError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao revogar perfil");
    return reply.status(500).send({ success: false, message: "Erro interno ao revogar perfil." });
  }
}

export async function listarPerfisDisponiveisController(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const perfis = await listarTodosPerfisAtivos();
    return reply.send({ success: true, data: perfis });
  } catch (error) {
    _request.log.error({ error }, "Erro ao listar perfis disponíveis");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}

export async function listarPermissoesDisponiveisController(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const permissoes = await listarTodasPermissoes();
    return reply.send({ success: true, data: permissoes });
  } catch (error) {
    _request.log.error({ error }, "Erro ao listar permissões disponíveis");
    return reply.status(500).send({ success: false, message: "Erro interno." });
  }
}