  import { prisma, withTenantTransaction } from "../../../config/prisma.js";
  import type { Prisma } from "../../../generated/prisma/client.js";


  export class PermissaoInsuficienteError extends Error { }
  export class AutoEscaladaDePermissaoError extends Error { }
  export class PerfilSistemicoError extends Error { }
  export class PerfilNaoEncontradoError extends Error { }
  export class PermissaoJaExisteError extends Error { }
  export class PerfilJaExisteError extends Error { }
  export class SuperAdminSingularError extends Error { }


  export async function hasPermission(
    utilizadorId: string,
    municipioId: string,
    permissaoChave: string
  ): Promise<boolean> {
    return withTenantTransaction(municipioId, async (tx) => {
      const count = await tx.utilizadorPerfil.count({
        where: {
          utilizadorId,
          perfil: {
            activo: true,
            permissoes: {
              some: { permissao: { chave: permissaoChave } },
            },
          },
        },
      });

      return count > 0;
    });
  }


  export async function getPermissoesDoUtilizador(
    utilizadorId: string,
    municipioId: string
  ): Promise<string[]> {
    return withTenantTransaction(municipioId, async (tx) => {
      const perfis = await tx.utilizadorPerfil.findMany({
        where: { utilizadorId, perfil: { activo: true } },
        select: {
          perfil: {
            select: {
              permissoes: { select: { permissao: { select: { chave: true } } } },
            },
          },
        },
      });

      const chaves = new Set<string>();
      for (const up of perfis) {
        for (const pp of up.perfil.permissoes) {
          chaves.add(pp.permissao.chave);
        }
      }
      return Array.from(chaves);
    });
  }

  /**
   * Lista os utilizadores activos de um município que têm uma dada permissão
   * (por qualquer um dos perfis activos que lhes estão atribuídos).
   *
   * Pensado para o worker de alertas operacionais (stock, manutenção,
   * serviços contínuos — ver `alertas-operacionais.service.ts`): quando um
   * item/serviço/manutenção não tem um responsável directo definido, é a
   * este conjunto de utilizadores (ex.: quem tem "stock:gerir") que o
   * alerta é enviado, em vez de nunca ser enviado a ninguém.
   */
  export async function listarUtilizadoresComPermissao(
    tx: Prisma.TransactionClient,
    permissaoChave: string
  ): Promise<Array<{ id: string; email: string; nomeCompleto: string; telefone: string | null; emailConfirmado: boolean }>> {
    const registos = await tx.utilizadorPerfil.findMany({
      where: {
        perfil: {
          activo: true,
          permissoes: { some: { permissao: { chave: permissaoChave } } },
        },
        utilizador: { estado: "ACTIVA" },
      },
      select: {
        utilizador: {
          select: { id: true, email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
        },
      },
      distinct: ["utilizadorId"],
    });

    return registos.map((r: typeof registos[number]) => r.utilizador);
  }

  export async function getPerfisDoUtilizador(utilizadorId: string, municipioId: string) {
    return withTenantTransaction(municipioId, async (tx) => {
      const registos = await tx.utilizadorPerfil.findMany({
        where: { utilizadorId },
        select: {
          perfil: { select: { id: true, nome: true, descricao: true, sistemico: true, acessoIlimitadoPonto: true } },
          criadoEm: true,
        },
      });

      return registos.map((r: typeof registos[number]) => ({ ...r.perfil, atribuidoEm: r.criadoEm }));
    });
  }


  export async function atribuirPerfil(params: {
    utilizadorId: string;
    perfilId: string;
    executorId: string;
    municipioId: string;
  }): Promise<void> {
    if (params.utilizadorId === params.executorId) {
      throw new AutoEscaladaDePermissaoError(
        "Não é permitido atribuir perfis a si próprio — nenhum perfil pode alterar o seu próprio nível de permissões."
      );
    }

    await withTenantTransaction(params.municipioId, (tx) =>
      atribuirPerfilTx(tx, {
        utilizadorId: params.utilizadorId,
        perfilId: params.perfilId,
        executorId: params.executorId,
      })
    );
  }

  export async function atribuirPerfilTx(
    tx: Prisma.TransactionClient,
    params: { utilizadorId: string; perfilId: string; executorId: string }
  ): Promise<void> {
    if (params.utilizadorId === params.executorId) {
      throw new AutoEscaladaDePermissaoError(
        "Não é permitido atribuir perfis a si próprio — nenhum perfil pode alterar o seu próprio nível de permissões."
      );
    }

    const jaTem = await tx.utilizadorPerfil.findUnique({
      where: {
        utilizadorId_perfilId: { utilizadorId: params.utilizadorId, perfilId: params.perfilId },
      },
    });

    if (jaTem) {
      return; 
    }

    // Regra de negócio: só pode existir UM utilizador com o perfil
    // SUPER_ADMIN em todo o sistema (secção 5.2 — "Administrador da
    // Plataforma"). Reforçado aqui e por índice único parcial em
    // prisma/singleton_super_admin.sql.
    const perfilAlvo = await tx.perfil.findUniqueOrThrow({
      where: { id: params.perfilId },
      select: { nome: true },
    });

    if (perfilAlvo.nome === "SUPER_ADMIN") {
      const contagemSuperAdmin = await tx.utilizadorPerfil.count({
        where: { perfil: { nome: "SUPER_ADMIN" } },
      });
      if (contagemSuperAdmin > 0) {
        throw new SuperAdminSingularError(
          "Já existe um utilizador com o perfil SUPER_ADMIN — este perfil é singular e não pode ser atribuído a mais ninguém."
        );
      }
    }

    const utilizador = await tx.utilizador.findUniqueOrThrow({
      where: { id: params.utilizadorId },
      select: { municipioId: true },
    });

    await tx.utilizadorPerfil.create({
      data: {
        utilizadorId: params.utilizadorId,
        perfilId: params.perfilId,
        atribuidoPorId: params.executorId,
      },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: utilizador.municipioId,
        utilizadorId: params.executorId,
        accao: "ATRIBUIR_PERFIL",
        entidade: "Utilizador",
        entidadeId: params.utilizadorId,
        detalhes: { perfilId: params.perfilId },
      },
    });
  }

  export async function revogarPerfil(params: {
    utilizadorId: string;
    perfilId: string;
    executorId: string;
    municipioId: string;
  }): Promise<void> {
    if (params.utilizadorId === params.executorId) {
      throw new AutoEscaladaDePermissaoError("Não é permitido revogar perfis a si próprio.");
    }

    await withTenantTransaction(params.municipioId, async (tx) => {
      const registo = await tx.utilizadorPerfil.findUnique({
        where: {
          utilizadorId_perfilId: { utilizadorId: params.utilizadorId, perfilId: params.perfilId },
        },
      });

      if (!registo) {
        return; // idempotente
      }

      const utilizador = await tx.utilizador.findUniqueOrThrow({
        where: { id: params.utilizadorId },
        select: { municipioId: true },
      });

      await tx.utilizadorPerfil.delete({ where: { id: registo.id } });

      await tx.logAuditoria.create({
        data: {
          municipioId: utilizador.municipioId,
          utilizadorId: params.executorId,
          accao: "REVOGAR_PERFIL",
          entidade: "Utilizador",
          entidadeId: params.utilizadorId,
          detalhes: { perfilId: params.perfilId },
        },
      });
    });
  }
export async function listarPerfis(paginacao: { page: number; pageSize: number }) {
  const skip = (paginacao.page - 1) * paginacao.pageSize;
  const [items, total] = await Promise.all([
    prisma.perfil.findMany({
      where: { activo: true },
      include: { permissoes: { include: { permissao: true } } },
      orderBy: { nome: "asc" },
      skip,
      take: paginacao.pageSize,
    }),
    prisma.perfil.count({ where: { activo: true } }),
  ]);
  return { items, total };
}

  export async function criarPerfil(params: { nome: string; descricao?: string | undefined }) {
    const existente = await prisma.perfil.findUnique({ where: { nome: params.nome } });
    if (existente) {
      throw new PerfilJaExisteError(`Já existe um perfil chamado "${params.nome}".`);
    }

    return prisma.perfil.create({
      data: {
        nome: params.nome,
        sistemico: false,
        ...(params.descricao !== undefined && { descricao: params.descricao }),
      },
    });
  }


  export async function desactivarPerfil(perfilId: string): Promise<void> {
    const perfil = await prisma.perfil.findUnique({ where: { id: perfilId } });

    if (!perfil) {
      throw new PerfilNaoEncontradoError("Perfil não encontrado.");
    }

    if (perfil.sistemico) {
      throw new PerfilSistemicoError(
        `O perfil "${perfil.nome}" é um dos 13 perfis oficiais do Estatuto Orgânico e não pode ser desactivado.`
      );
    }

    await prisma.perfil.update({ where: { id: perfilId }, data: { activo: false } });
  }

  /**
   * Decide se os utilizadores com este perfil ficam isentos da janela de horário de
   * registo de ponto (08h-16h, ver rh/ponto). Antes era a lista fixa
   * PERFIS_ACESSO_ILIMITADO em rh.constants.ts — agora é o Administrador que decide,
   * perfil a perfil, através deste endpoint.
   */
  export async function definirAcessoIlimitadoPonto(perfilId: string, acessoIlimitadoPonto: boolean) {
    const perfil = await prisma.perfil.findUnique({ where: { id: perfilId } });
    if (!perfil) {
      throw new PerfilNaoEncontradoError("Perfil não encontrado.");
    }

    return prisma.perfil.update({
      where: { id: perfilId },
      data: { acessoIlimitadoPonto },
    });
  }

  function gerarChavePermissao(recurso: string, accao: string): string {
    return `${recurso}:${accao}`;
  }

  export async function criarPermissao(params: {
    recurso: string;
    accao: string;
    descricao?: string | undefined;
  }) {
    const chave = gerarChavePermissao(params.recurso, params.accao);
    const existente = await prisma.permissao.findUnique({ where: { chave } });

    if (existente) {
      throw new PermissaoJaExisteError(`A permissão "${chave}" já existe.`);
    }

    return prisma.permissao.create({
      data: {
        recurso: params.recurso,
        accao: params.accao,
        chave,
        ...(params.descricao !== undefined && { descricao: params.descricao }),
      },
    });
  }

  export async function listarPermissoes(paginacao: { page: number; pageSize: number }) {
  const skip = (paginacao.page - 1) * paginacao.pageSize;
  const [items, total] = await Promise.all([
    prisma.permissao.findMany({
      orderBy: [{ recurso: "asc" }, { accao: "asc" }],
      skip,
      take: paginacao.pageSize,
    }),
    prisma.permissao.count(),
  ]);
  return { items, total };
}

  export async function associarPermissaoAoPerfil(params: {
    perfilId: string;
    permissaoId: string;
    executorId: string;
    municipioIdParaAuditoria: string;
  }): Promise<void> {
    const jaAssociada = await prisma.perfilPermissao.findUnique({
      where: {
        perfilId_permissaoId: { perfilId: params.perfilId, permissaoId: params.permissaoId },
      },
    });

    if (jaAssociada) return;

    await prisma.perfilPermissao.create({
      data: { perfilId: params.perfilId, permissaoId: params.permissaoId },
    });

    await withTenantTransaction(params.municipioIdParaAuditoria, (tx) =>
      tx.logAuditoria.create({
        data: {
          municipioId: params.municipioIdParaAuditoria,
          utilizadorId: params.executorId,
          accao: "ASSOCIAR_PERMISSAO_PERFIL",
          entidade: "Perfil",
          entidadeId: params.perfilId,
          detalhes: { permissaoId: params.permissaoId },
        },
      })
    );
  }

  export async function desassociarPermissaoDoPerfil(params: {
    perfilId: string;
    permissaoId: string;
    executorId: string;
    municipioIdParaAuditoria: string;
  }): Promise<void> {
    const associacao = await prisma.perfilPermissao.findUnique({
      where: {
        perfilId_permissaoId: { perfilId: params.perfilId, permissaoId: params.permissaoId },
      },
    });

    if (!associacao) return;

    await prisma.perfilPermissao.delete({ where: { id: associacao.id } });

    await withTenantTransaction(params.municipioIdParaAuditoria, (tx) =>
      tx.logAuditoria.create({
        data: {
          municipioId: params.municipioIdParaAuditoria,
          utilizadorId: params.executorId,
          accao: "DESASSOCIAR_PERMISSAO_PERFIL",
          entidade: "Perfil",
          entidadeId: params.perfilId,
          detalhes: { permissaoId: params.permissaoId },
        },
      })
    );
  }

  /**
 * Lista completa de perfis activos, sem paginação — para preencher
 * seletores/dropdowns (ex.: atribuir perfil a um utilizador).
 */
export async function listarTodosPerfisAtivos() {
  return prisma.perfil.findMany({
    where: { activo: true },
    include: { permissoes: { include: { permissao: true } } },
    orderBy: { nome: "asc" },
  });
}

/**
 * Lista completa de permissões, sem paginação — para preencher
 * seletores/dropdowns (ex.: associar permissão a um perfil).
 */
export async function listarTodasPermissoes() {
  return prisma.permissao.findMany({ orderBy: [{ recurso: "asc" }, { accao: "asc" }] });
}