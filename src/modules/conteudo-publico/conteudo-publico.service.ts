import type { Prisma, TipoConta } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import type {
  CriarConteudoPublicoInput,
  EditarConteudoPublicoInput,
  PublicarConteudoPublicoInput,
  ListarConteudosPublicosQuery,
  ListarConteudosPublicosPublicoQuery,
} from "./conteudo-publico.schema.js";

export class ConteudoPublicoNaoEncontradoError extends Error {}
export class ChaveJaExisteError extends Error {}

export async function criarConteudoPublico(params: {
  municipioId: string;
  executorId: string;
  input: CriarConteudoPublicoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.conteudoPublico.findUnique({
      where: {
        municipioId_chave: {
          municipioId: params.municipioId,
          chave: params.input.chave,
        },
      },
      select: { id: true },
    });
    if (existente) {
      throw new ChaveJaExisteError(
        `Já existe um conteúdo com a chave "${params.input.chave}" neste município.`,
      );
    }

    return tx.conteudoPublico.create({
      data: {
        municipioId: params.municipioId,
        chave: params.input.chave,
        titulo: params.input.titulo,
        corpo: params.input.corpo,
        categoria: params.input.categoria,
        criadoPorId: params.executorId,
        ...(params.input.resumo !== undefined && {
          resumo: params.input.resumo,
        }),
      },
    });
  });
}

async function obterConteudoOuFalhar(tx: Prisma.TransactionClient, id: string) {
  const conteudo = await tx.conteudoPublico.findUnique({ where: { id } });
  if (!conteudo) {
    throw new ConteudoPublicoNaoEncontradoError("Conteúdo não encontrado.");
  }
  return conteudo;
}

export async function editarConteudoPublico(params: {
  municipioId: string;
  conteudoId: string;
  input: EditarConteudoPublicoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterConteudoOuFalhar(tx, params.conteudoId);
    return tx.conteudoPublico.update({
      where: { id: params.conteudoId },
      data: {
        ...(params.input.titulo !== undefined && {
          titulo: params.input.titulo,
        }),
        ...(params.input.resumo !== undefined && {
          resumo: params.input.resumo,
        }),
        ...(params.input.corpo !== undefined && { corpo: params.input.corpo }),
        ...(params.input.categoria !== undefined && {
          categoria: params.input.categoria,
        }),
      },
    });
  });
}

export async function publicarConteudoPublico(params: {
  municipioId: string;
  conteudoId: string;
  executorId: string;
  input: PublicarConteudoPublicoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterConteudoOuFalhar(tx, params.conteudoId);
    return tx.conteudoPublico.update({
      where: { id: params.conteudoId },
      data: {
        estadoPublicacao: params.input.estadoPublicacao,
        gruposComAcesso:
          params.input.estadoPublicacao === "RESTRITO"
            ? (params.input.gruposComAcesso ?? [])
            : [],
        publicadoPorId: params.executorId,
        publicadoEm: new Date(),
      },
    });
  });
}
export async function despublicarConteudoPublico(params: {
  municipioId: string;
  conteudoId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterConteudoOuFalhar(tx, params.conteudoId);
    return tx.conteudoPublico.update({
      where: { id: params.conteudoId },
      data: { estadoPublicacao: "RASCUNHO", gruposComAcesso: [] },
    });
  });
}

export async function eliminarConteudoPublico(params: {
  municipioId: string;
  conteudoId: string;
}): Promise<void> {
  await withTenantTransaction(params.municipioId, async (tx) => {
    await obterConteudoOuFalhar(tx, params.conteudoId);
    await tx.conteudoPublico.delete({ where: { id: params.conteudoId } });
  });
}

export async function listarConteudosPublicosAdmin(params: {
  municipioId: string;
  query: ListarConteudosPublicosQuery;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.ConteudoPublicoWhereInput = {
      ...(params.query.categoria !== undefined && {
        categoria: params.query.categoria,
      }),
      ...(params.query.estadoPublicacao !== undefined && {
        estadoPublicacao: params.query.estadoPublicacao,
      }),
    };
    const [items, total] = await Promise.all([
      tx.conteudoPublico.findMany({
        where,
        orderBy: { alteradoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.conteudoPublico.count({ where }),
    ]);
    return {
      items,
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

export async function obterConteudoPublicoAdmin(params: {
  municipioId: string;
  conteudoId: string;
}) {
  return withTenantTransaction(params.municipioId, (tx) =>
    obterConteudoOuFalhar(tx, params.conteudoId),
  );
}

export async function listarConteudosPublicos(params: {
  municipioId: string;
  query: ListarConteudosPublicosPublicoQuery;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const pesquisa = params.query.pesquisa?.trim();

    const where: Prisma.ConteudoPublicoWhereInput = {
      estadoPublicacao: {
        in: ["PUBLICADO", "PUBLICADO_PARCIAL"],
      },

      ...(params.query.categoria !== undefined && {
        categoria: params.query.categoria,
      }),

      ...(pesquisa
        ? {
            OR: [
              {
                titulo: {
                  contains: pesquisa,
                  mode: "insensitive",
                },
              },
              {
                resumo: {
                  contains: pesquisa,
                  mode: "insensitive",
                },
              },
              {
                corpo: {
                  contains: pesquisa,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      tx.conteudoPublico.findMany({
        where,
        orderBy: { publicadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        select: {
          id: true,
          chave: true,
          titulo: true,
          resumo: true,
          corpo: true,
          categoria: true,
          estadoPublicacao: true,
          publicadoEm: true,
        },
      }),
      tx.conteudoPublico.count({ where }),
    ]);
    return {
      items: items.map(ocultarCorpoSeParcial),
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

export async function obterConteudoPublicoPorChave(params: {
  municipioId: string;
  chave: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const conteudo = await tx.conteudoPublico.findUnique({
      where: {
        municipioId_chave: {
          municipioId: params.municipioId,
          chave: params.chave,
        },
      },
    });
    if (
      !conteudo ||
      !["PUBLICADO", "PUBLICADO_PARCIAL"].includes(conteudo.estadoPublicacao)
    ) {
      throw new ConteudoPublicoNaoEncontradoError("Conteúdo não encontrado.");
    }
    return ocultarCorpoSeParcial(conteudo);
  });
}

export async function listarConteudosRestritosParaGrupo(params: {
  municipioId: string;
  tipoConta: TipoConta;
  query: ListarConteudosPublicosPublicoQuery;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.ConteudoPublicoWhereInput = {
      estadoPublicacao: "RESTRITO",
      gruposComAcesso: { has: params.tipoConta },
      ...(params.query.categoria !== undefined && {
        categoria: params.query.categoria,
      }),
    };
    const [items, total] = await Promise.all([
      tx.conteudoPublico.findMany({
        where,
        orderBy: { publicadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.conteudoPublico.count({ where }),
    ]);
    return {
      items,
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

function ocultarCorpoSeParcial<
  T extends { estadoPublicacao: string; corpo: string },
>(conteudo: T): T {
  if (conteudo.estadoPublicacao !== "PUBLICADO_PARCIAL") return conteudo;
  return { ...conteudo, corpo: "" };
}
