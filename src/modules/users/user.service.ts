import type { Prisma } from "../../generated/prisma/client.js";
import { randomBytes } from "node:crypto";
import { withTenantTransaction, withTenantTransactionReadOnly } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { hashPassword, verifyPassword } from "../auth/password.service.js";
import { atribuirPerfilTx, revogarPerfil, getPerfisDoUtilizador } from "../auth/rbac/rbac.service.js";
import { undefinedToNull } from "../../utils/optional.js";
import { sendTemporaryPasswordEmail, sendContaInternaCriadaEmail, sendComissaoCredenciaisEmail } from "../email/email.service.js";
import { env } from "../../config/env.js";
import type {
  ListarUtilizadoresQuery,
  CriarUtilizadorInput,
  EditarUtilizadorInput,
  EditarMeuPerfilInput,
  AlterarEstadoInput,
} from "./user.schema.js";



export class EmailJaExisteError extends Error { }
export class UtilizadorNaoEncontradoError extends Error { }
export class PasswordActualInvalidaError extends Error { }
export class AutoSuspensaoError extends Error { }
export class MunicipioDestinoNaoPermitidoError extends Error { }
export class DirecaoNaoEncontradaError extends Error { }
export class DepartamentoNaoEncontradoError extends Error { }
export class DepartamentoSemDirecaoError extends Error { }
export class SuperiorInvalidoError extends Error { }
export class TipoContaNaoElegivelParaRedefinicaoError extends Error { }
export class CamposOrganizacionaisNaoPermitidosError extends Error {}

async function resolverDirecaoIdPorSigla(
  tx: Prisma.TransactionClient,
  municipioId: string,
  sigla: string
): Promise<string> {
  const direcao = await tx.direcao.findUnique({
    where: { municipioId_sigla: { municipioId, sigla } },
    select: { id: true },
  });
  if (!direcao) {
    throw new DirecaoNaoEncontradaError(
      `A direcção "${sigla}" não existe neste município (verifica se o seed foi corrido para todos os municípios).`
    );
  }
  return direcao.id;
}

async function resolverDepartamentoIdPorNome(
  tx: Prisma.TransactionClient,
  direcaoId: string,
  nome: string
): Promise<string> {
  const departamento = await tx.departamento.findUnique({
    where: { direcaoId_nome: { direcaoId, nome } },
    select: { id: true },
  });
  if (!departamento) {
    throw new DepartamentoNaoEncontradoError(
      `O departamento "${nome}" não existe nesta direcção (consulta DEPARTAMENTOS_POR_DIRECAO para os nomes exactos, ou GET /departamentos/funcionarios).`
    );
  }
  return departamento.id;
}

const SELECT_PUBLICO = {
  id: true,
  municipioId: true,
  direcaoId: true,
  departamentoId: true,
  superiorId: true,
  areaResponsabilidade: true,
  nomeCompleto: true,
  email: true,
  tipoConta: true,
  estado: true,
  mfaActivo: true,
  emailConfirmado: true,
  documentoTipo: true,
  documentoNumero: true,
  documentoValidadoEm: true,
  criadoEm: true,
  alteradoEm: true,
} satisfies Prisma.UtilizadorSelect;

type UtilizadorPublico = Prisma.UtilizadorGetPayload<{ select: typeof SELECT_PUBLICO }>;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function listarUtilizadores(
  municipioId: string,
  query: ListarUtilizadoresQuery
): Promise<PaginatedResult<UtilizadorPublico>> {
  return withTenantTransaction(municipioId, async (tx) => {
    const where: Prisma.UtilizadorWhereInput = {
      municipioId,
      ...(query.estado !== undefined && { estado: query.estado }),
      ...(query.tipoConta !== undefined && { tipoConta: query.tipoConta }),
      ...(query.q !== undefined && {
        OR: [
          { nomeCompleto: { contains: query.q, mode: "insensitive" as const } },
          { email: { contains: query.q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      tx.utilizador.findMany({
        where,
        select: SELECT_PUBLICO,
        orderBy: { criadoEm: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      tx.utilizador.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  });
}

export async function obterUtilizador(id: string, municipioId: string) {
  const utilizador = await withTenantTransaction(municipioId, (tx) =>
    tx.utilizador.findUnique({ where: { id }, select: SELECT_PUBLICO })
  );

  // Verificação explícita: um ID de outro município nunca deve ser
  // devolvido, mesmo que seja adivinhado ou passado por engano.
  if (!utilizador || utilizador.municipioId !== municipioId) {
    throw new UtilizadorNaoEncontradoError("Utilizador não encontrado.");
  }

  return utilizador;
}


export async function obterMeuPerfilCompleto(utilizadorId: string, municipioId: string) {
  return withTenantTransactionReadOnly(
    municipioId,
    async (tx) => {
      const utilizador = await tx.utilizador.findUnique({
        where: { id: utilizadorId },
        select: SELECT_PUBLICO,
      });

      if (!utilizador) {
        throw new UtilizadorNaoEncontradoError("Utilizador não encontrado.");
      }

      const utilizadorPerfis = await tx.utilizadorPerfil.findMany({
        where: { utilizadorId, perfil: { activo: true } },
        select: {
          criadoEm: true,
          perfil: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              sistemico: true,
              permissoes: { select: { permissao: { select: { chave: true } } } },
            },
          },
        },
      });
      const municipio = await tx.municipio.findUniqueOrThrow({
        where: { id: municipioId },
        select: { nome: true },
      });

      const perfis = utilizadorPerfis.map((up: typeof utilizadorPerfis[number]) => ({
        id: up.perfil.id,
        nome: up.perfil.nome,
        descricao: up.perfil.descricao,
        sistemico: up.perfil.sistemico,
        atribuidoEm: up.criadoEm,
      }));

      const chavesPermissao = new Set<string>();
      for (const up of utilizadorPerfis) {
        for (const pp of up.perfil.permissoes) {
          chavesPermissao.add(pp.permissao.chave);
        }
      }

      return {
        ...utilizador,
        perfis,
        permissoes: Array.from(chavesPermissao),
        municipioNome: municipio.nome,
      };
    },
    { timeout: 15000, maxWait: 10000 }
  );
}

export async function criarUtilizador(params: {
  input: CriarUtilizadorInput;
  municipioId: string;
  executorId: string;
}) {
  let municipioAlvo = params.municipioId;

  if (params.input.municipioId && params.input.municipioId !== params.municipioId) {
    const perfisDoExecutor = await getPerfisDoUtilizador(params.executorId, params.municipioId);
    const executorEhSuperAdmin = perfisDoExecutor.some((p) => p.nome === "SUPER_ADMIN");

    if (!executorEhSuperAdmin) {
      throw new MunicipioDestinoNaoPermitidoError(
        "Só o SUPER_ADMIN pode criar utilizadores num município diferente do seu."
      );
    }
    municipioAlvo = params.input.municipioId;
  }

  // NOVO: direcaoSigla, departamentoNome e superiorId só fazem sentido
  // para contas INTERNO — a Comissão de Moradores não pertence à estrutura
  // organizacional municipal. Rejeitamos explicitamente em vez de ignorar
  // em silêncio, para apanhar cedo qualquer chamada indevida (defesa em
  // profundidade, mesmo que o formulário já não envie estes campos para
  // COMISSAO_MORADORES).
  if (
    params.input.tipoConta !== "INTERNO" &&
    (params.input.direcaoSigla || params.input.departamentoNome || params.input.superiorId)
  ) {
    throw new CamposOrganizacionaisNaoPermitidosError(
      "direcaoSigla, departamentoNome e superiorId só se aplicam a contas do tipo INTERNO."
    );
  }

  const inicio = Date.now();
  const marcar = (etapa: string) =>
    logger.warn({ etapa, decorridoMs: Date.now() - inicio, email: params.input.email }, "criarUtilizador: checkpoint");
  let municipioNome: string | undefined;

  const utilizador = await withTenantTransaction(municipioAlvo, async (tx) => {
    marcar("transacção iniciada (ligação obtida + set_config aplicado)");

    const existente = await tx.utilizador.findUnique({
      where: { email: params.input.email },
    });
    marcar("verificação de email existente concluída");

    if (existente) {
      throw new EmailJaExisteError("Já existe uma conta com este email.");
    }

    const passwordHash = await hashPassword(params.input.password);
    marcar("hash da password (argon2) concluído");

    // NOVO: resolução de direcção/departamento/superior só corre para
    // INTERNO — para COMISSAO_MORADORES estes campos já vêm undefined
    // (validado acima), por isso o bloco simplesmente não se aplica.
    const direcaoId =
      params.input.tipoConta === "INTERNO" && params.input.direcaoSigla
        ? await resolverDirecaoIdPorSigla(tx, municipioAlvo, params.input.direcaoSigla)
        : undefined;
    marcar("resolução de direcção concluída");

    let departamentoId: string | undefined;
    if (params.input.tipoConta === "INTERNO" && params.input.departamentoNome) {
      if (!direcaoId) {
        throw new DepartamentoSemDirecaoError(
          "Para atribuir um departamento é preciso indicar também a direcaoSigla a que ele pertence."
        );
      }
      departamentoId = await resolverDepartamentoIdPorNome(tx, direcaoId, params.input.departamentoNome);
    }
    marcar("resolução de departamento concluída");

    if (params.input.tipoConta === "INTERNO" && params.input.superiorId) {
      const superior = await tx.utilizador.findUnique({
        where: { id: params.input.superiorId },
        select: { id: true },
      });
      if (!superior) {
        throw new SuperiorInvalidoError("O superior indicado não existe neste município.");
      }
    }
    marcar("validação de superior concluída");

    const utilizador = await tx.utilizador.create({
      data: {
        municipioId: municipioAlvo,
        nomeCompleto: params.input.nomeCompleto,
        email: params.input.email,
        passwordHash,
        tipoConta: params.input.tipoConta,
        estado: params.input.estado,
        // NOVO: contas COMISSAO_MORADORES são criadas por um funcionário,
        // tal como INTERNO — não passam por confirmação de email, apenas
        // pelo estado indicado no formulário.
        emailConfirmado: params.input.estado === "ACTIVA",
        ...(direcaoId !== undefined && { direcaoId }),
        ...(departamentoId !== undefined && { departamentoId }),
        ...(params.input.tipoConta === "INTERNO" &&
          params.input.areaResponsabilidade !== undefined && {
            areaResponsabilidade: params.input.areaResponsabilidade,
          }),
        ...(params.input.tipoConta === "INTERNO" &&
          params.input.superiorId !== undefined && { superiorId: params.input.superiorId }),
      },
      select: SELECT_PUBLICO,
    });
    marcar("INSERT do utilizador concluído");

    if (params.input.tipoConta !== "INTERNO") {
      const perfilCorrespondente = await tx.perfil.findFirst({
        where: { nome: params.input.tipoConta, activo: true },
        select: { id: true },
      });
      if (perfilCorrespondente) {
        await tx.utilizadorPerfil.create({
          data: { utilizadorId: utilizador.id, perfilId: perfilCorrespondente.id },
        });
      }
    }
    marcar("atribuição de perfil automática concluída");

    await tx.logAuditoria.create({
      data: {
        municipioId: municipioAlvo,
        utilizadorId: params.executorId,
        accao: "CRIAR_UTILIZADOR_ADMIN",
        entidade: "Utilizador",
        entidadeId: utilizador.id,
        detalhes: {
          estadoInicial: params.input.estado,
          tipoConta: params.input.tipoConta,
          ...(municipioAlvo !== params.municipioId && { criadoForaDoProprioMunicipio: true }),
        },
      },
    });
    marcar("log de auditoria concluído (transacção prestes a fazer commit)");

    // NOVO: a leitura do nome do município passa a acontecer para
    // qualquer tipo de conta que precise de email de boas-vindas com
    // password (INTERNO com direcção, ou COMISSAO_MORADORES), não só
    // para INTERNO.
    const precisaNomeMunicipio =
      (params.input.tipoConta === "INTERNO" && !!params.input.direcaoSigla) ||
      params.input.tipoConta === "COMISSAO_MORADORES";

    if (precisaNomeMunicipio) {
      const municipio = await tx.municipio.findUniqueOrThrow({
        where: { id: municipioAlvo },
        select: { nome: true },
      });
      municipioNome = municipio.nome;
    }

    return utilizador;
  });

  // NOVO: email de boas-vindas consoante o tipo de conta criado.
  if (params.input.tipoConta === "INTERNO" && params.input.direcaoSigla && municipioNome) {
    try {
      await sendContaInternaCriadaEmail({
        to: utilizador.email,
        toName: utilizador.nomeCompleto,
        municipioNome,
        password: params.input.password,
        direcaoSigla: params.input.direcaoSigla,
      });
    } catch (error) {
      console.error("Falha ao enviar email de conta interna criada (admin):", error);
    }
  }

  if (params.input.tipoConta === "COMISSAO_MORADORES" && municipioNome) {
    try {
      await sendComissaoCredenciaisEmail({
        to: utilizador.email,
        toName: utilizador.nomeCompleto,
        municipioNome,
        password: params.input.password,
        loginUrl: `${env.FRONTEND_URL}/login`,
      });
    } catch (error) {
      console.error("Falha ao enviar email de credenciais da comissão (admin):", error);
    }
  }

  return utilizador;
}

export async function editarUtilizador(params: {
  id: string;
  input: EditarUtilizadorInput;
  municipioId: string;
  executorId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.utilizador.findUnique({ where: { id: params.id } });
    if (!existente) {
      throw new UtilizadorNaoEncontradoError("Utilizador não encontrado.");
    }

    const novoDirecaoId =
      params.input.direcaoSigla === undefined
        ? undefined
        : params.input.direcaoSigla === null
          ? null
          : await resolverDirecaoIdPorSigla(tx, params.municipioId, params.input.direcaoSigla);

    const direcaoIdEfectiva = novoDirecaoId !== undefined ? novoDirecaoId : existente.direcaoId;

    let novoDepartamentoId: string | null | undefined;
    if (novoDirecaoId === null) {
      novoDepartamentoId = null;
    } else if (params.input.departamentoNome === undefined) {
      novoDepartamentoId = undefined;
    } else if (params.input.departamentoNome === null) {
      novoDepartamentoId = null;
    } else {
      if (!direcaoIdEfectiva) {
        throw new DepartamentoSemDirecaoError(
          "Para atribuir um departamento é preciso que o utilizador já tenha (ou esteja a receber nesta chamada) uma direcaoSigla."
        );
      }
      novoDepartamentoId = await resolverDepartamentoIdPorNome(tx, direcaoIdEfectiva, params.input.departamentoNome);
    }

    let novoSuperiorId: string | null | undefined;
    if (params.input.superiorId === undefined) {
      novoSuperiorId = undefined;
    } else if (params.input.superiorId === null) {
      novoSuperiorId = null;
    } else {
      if (params.input.superiorId === params.id) {
        throw new SuperiorInvalidoError("Um utilizador não pode ser o seu próprio superior.");
      }
      const superior = await tx.utilizador.findUnique({
        where: { id: params.input.superiorId },
        select: { id: true },
      });
      if (!superior) {
        throw new SuperiorInvalidoError("O superior indicado não existe neste município.");
      }
      novoSuperiorId = params.input.superiorId;
    }

    const utilizador = await tx.utilizador.update({
      where: { id: params.id },
      data: {
        ...(params.input.nomeCompleto !== undefined && {
          nomeCompleto: params.input.nomeCompleto,
        }),
        ...(novoDirecaoId !== undefined && {
          direcaoId: undefinedToNull(novoDirecaoId),
        }),
        ...(novoDepartamentoId !== undefined && {
          departamentoId: undefinedToNull(novoDepartamentoId),
        }),
        ...(params.input.areaResponsabilidade !== undefined && {
          areaResponsabilidade: undefinedToNull(params.input.areaResponsabilidade),
        }),
        ...(novoSuperiorId !== undefined && {
          superiorId: undefinedToNull(novoSuperiorId),
        }),
      },
      select: SELECT_PUBLICO,
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.executorId,
        accao: "EDITAR_UTILIZADOR",
        entidade: "Utilizador",
        entidadeId: params.id,
      },
    });

    return utilizador;
  });
}

export async function editarMeuPerfil(params: {
  utilizadorId: string;
  municipioId: string;
  input: EditarMeuPerfilInput;
}) {
  return withTenantTransaction(params.municipioId, (tx) =>
    tx.utilizador.update({
      where: { id: params.utilizadorId },
      data: { nomeCompleto: params.input.nomeCompleto },
      select: SELECT_PUBLICO,
    })
  );
}


export async function alterarEstado(params: {
  id: string;
  input: AlterarEstadoInput;
  municipioId: string;
  executorId: string;
}) {
  if (params.id === params.executorId) {
    throw new AutoSuspensaoError("Não é permitido alterar o seu próprio estado de conta.");
  }

  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.utilizador.findUnique({ where: { id: params.id } });
    if (!existente) {
      throw new UtilizadorNaoEncontradoError("Utilizador não encontrado.");
    }

    const utilizador = await tx.utilizador.update({
      where: { id: params.id },
      data: {
        estado: params.input.estado,
        ...(params.input.estado === "ACTIVA" && {
          tentativasLoginFalhadas: 0,
          bloqueadoAte: null,
        }),
      },
      select: SELECT_PUBLICO,
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.executorId,
        accao: "ALTERAR_ESTADO_UTILIZADOR",
        entidade: "Utilizador",
        entidadeId: params.id,
        detalhes: {
          estadoAnterior: existente.estado,
          estadoNovo: params.input.estado,
          ...(params.input.motivo !== undefined && { motivo: params.input.motivo }),
        },
      },
    });

    return utilizador;
  });
}

export async function trocarPassword(params: {
  utilizadorId: string;
  municipioId: string;
  passwordActual: string;
  novaPassword: string;
}): Promise<void> {
  await withTenantTransaction(params.municipioId, async (tx) => {
    const utilizador = await tx.utilizador.findUniqueOrThrow({
      where: { id: params.utilizadorId },
    });

    const passwordValida = await verifyPassword(utilizador.passwordHash, params.passwordActual);
    if (!passwordValida) {
      throw new PasswordActualInvalidaError("A password actual indicada está incorrecta.");
    }

    const novoHash = await hashPassword(params.novaPassword);

    await tx.utilizador.update({
      where: { id: params.utilizadorId },
      data: { passwordHash: novoHash, deveTrocarPassword: false },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "TROCAR_PASSWORD",
        entidade: "Utilizador",
        entidadeId: params.utilizadorId,
      },
    });
  });
}


export async function redefinirPasswordUtilizador(params: {
  utilizadorId: string;
  municipioId: string;
  executorId: string;
}): Promise<{ temporaryPassword: string }> {
  const resultado = await withTenantTransaction(params.municipioId, async (tx) => {
    const utilizador = await tx.utilizador.findUnique({ where: { id: params.utilizadorId } });
    if (!utilizador) {
      throw new UtilizadorNaoEncontradoError("Utilizador não encontrado.");
    }
    if (utilizador.tipoConta !== "INTERNO") {
      throw new TipoContaNaoElegivelParaRedefinicaoError(
        "Esta operação só se aplica a contas INTERNO (funcionários). Contas externas devem usar " +
        "o recovery por email — POST /auth/forgot-password."
      );
    }

    const executor = await tx.utilizador.findUnique({
      where: { id: params.executorId },
      select: { nomeCompleto: true },
    });
    const municipio = await tx.municipio.findUniqueOrThrow({
      where: { id: params.municipioId },
      select: { nome: true },
    });

    const temporaryPassword = gerarPasswordTemporaria();
    const passwordHash = await hashPassword(temporaryPassword);

    await tx.utilizador.update({
      where: { id: params.utilizadorId },
      data: {
        passwordHash,
        deveTrocarPassword: true,
        tentativasLoginFalhadas: 0,
        bloqueadoAte: null,
      },
    });
    await tx.refreshToken.updateMany({
      where: { utilizadorId: params.utilizadorId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "PASSWORD_REDEFINIDA_POR_ADMIN",
        entidade: "Utilizador",
        entidadeId: params.utilizadorId,
        detalhes: { redefinidoPorId: params.executorId },
      },
    });

    return {
      temporaryPassword,
      email: utilizador.email,
      nomeCompleto: utilizador.nomeCompleto,
      municipioNome: municipio.nome,
      redefinidoPorNome: executor?.nomeCompleto ?? "A Administração",
    };
  });

  try {
    await sendTemporaryPasswordEmail({
      to: resultado.email,
      toName: resultado.nomeCompleto,
      municipioNome: resultado.municipioNome,
      temporaryPassword: resultado.temporaryPassword,
      loginUrl: `${env.FRONTEND_URL}/login`,
      redefinidoPorNome: resultado.redefinidoPorNome,
    });
  } catch (error) {
    console.error("Falha ao enviar email de password temporária:", error);
  }
  return { temporaryPassword: resultado.temporaryPassword };
}

function gerarPasswordTemporaria(): string {
  const aleatorio = randomBytes(9).toString("base64url");
  return `Tmp9${aleatorio}`;
}

export async function atribuirPerfilAoUtilizador(params: {
  utilizadorId: string;
  perfilId: string;
  municipioId: string;
  executorId: string;
}): Promise<void> {
  return withTenantTransaction(params.municipioId, (tx) =>
    atribuirPerfilTx(tx, {
      utilizadorId: params.utilizadorId,
      perfilId: params.perfilId,
      executorId: params.executorId,
    })
  );
}

export async function revogarPerfilDoUtilizador(params: {
  utilizadorId: string;
  perfilId: string;
  municipioId: string;
  executorId: string;
}): Promise<void> {
  return revogarPerfil(params);
}