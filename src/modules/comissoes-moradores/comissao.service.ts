/**
 * Cadastro de Comissão de Moradores (secção 10.5 do documento técnico).
 * ANTES DESTA ALTERAÇÃO: só existiam 2 campos soltos em `Utilizador`
 * (`nomeComissao`, `cargoComissao`) — não havia bairro/coordenadas
 * territoriais, membros, documentação legal, nem estado da comissão.
 *
 * ISOLAMENTO MULTI-TENANT: `comissoes_moradores` e `membros_comissao` têm
 * RLS (ver prisma/enable_rls.sql) — `municipioId` é obrigatório em todas
 * as funções e é sempre o primeiro argumento de `withTenantTransaction`.
 */

import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import type { ComissaoCreateInput, ComissaoUpdateInput, AdicionarMembroInput } from "./comissao.schema.js";

export async function listarComissoes(
  filtros: { municipioId: string; bairro?: string | undefined; estado?: string | undefined },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.ComissaoModeradoresWhereInput = {
    ...(filtros.bairro && { bairro: { contains: filtros.bairro, mode: "insensitive" } }),
    ...(filtros.estado && { estado: filtros.estado as Prisma.EnumEstadoComissaoModeradoresFilter<"ComissaoModeradores"> }),
  };

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.comissaoModeradores.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { bairro: "asc" },
        include: { membros: true, _count: { select: { ocorrencias: true } } },
      }),
      tx.comissaoModeradores.count({ where }),
    ]);
    return { data, total };
  });
}

export async function obterComissao(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.comissaoModeradores.findUnique({
      where: { id },
      include: { membros: true, ocorrencias: { orderBy: { criadoEm: "desc" }, take: 20 } },
    });
  });
}

export async function criarComissao(municipioId: string, dados: ComissaoCreateInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.comissaoModeradores.create({
      data: {
        municipioId,
        bairro: dados.bairro,
        presidenteNome: dados.presidenteNome,
        estado: dados.estado,
        ...(dados.coordenadasLat !== undefined && { coordenadasLat: dados.coordenadasLat }),
        ...(dados.coordenadasLng !== undefined && { coordenadasLng: dados.coordenadasLng }),
        ...(dados.presidenteContacto !== undefined && { presidenteContacto: dados.presidenteContacto }),
        ...(dados.documentacaoLegalUrl !== undefined && { documentacaoLegalUrl: dados.documentacaoLegalUrl }),
        ...(dados.observacoes !== undefined && { observacoes: dados.observacoes }),
        ...(dados.membros?.length && {
          membros: {
            create: dados.membros.map((m) => ({
              nome: m.nome,
              cargo: m.cargo,
              ...(m.contacto !== undefined && { contacto: m.contacto }),
            })),
          },
        }),
      },
      include: { membros: true },
    });
  });
}

export async function atualizarComissao(id: string, municipioId: string, dados: ComissaoUpdateInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.comissaoModeradores.findUniqueOrThrow({ where: { id } });

    const payload: Prisma.ComissaoModeradoresUncheckedUpdateInput = {
      ...(dados.bairro !== undefined && { bairro: dados.bairro }),
      ...(dados.presidenteNome !== undefined && { presidenteNome: dados.presidenteNome }),
      ...(dados.estado !== undefined && { estado: dados.estado }),
      ...(dados.coordenadasLat !== undefined && { coordenadasLat: dados.coordenadasLat }),
      ...(dados.coordenadasLng !== undefined && { coordenadasLng: dados.coordenadasLng }),
      ...(dados.presidenteContacto !== undefined && { presidenteContacto: dados.presidenteContacto }),
      ...(dados.documentacaoLegalUrl !== undefined && { documentacaoLegalUrl: dados.documentacaoLegalUrl }),
      ...(dados.observacoes !== undefined && { observacoes: dados.observacoes }),
    };

    return tx.comissaoModeradores.update({ where: { id }, data: payload, include: { membros: true } });
  });
}

export async function removerComissao(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.comissaoModeradores.findUniqueOrThrow({ where: { id } });
    return tx.comissaoModeradores.delete({ where: { id } });
  });
}

export async function adicionarMembro(comissaoId: string, municipioId: string, dados: AdicionarMembroInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.comissaoModeradores.findUniqueOrThrow({ where: { id: comissaoId } });
    return tx.membroComissao.create({
      data: {
        comissaoId,
        nome: dados.nome,
        cargo: dados.cargo,
        ...(dados.contacto !== undefined && { contacto: dados.contacto }),
      },
    });
  });
}

export async function removerMembro(comissaoId: string, membroId: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const membro = await tx.membroComissao.findUniqueOrThrow({ where: { id: membroId } });
    if (membro.comissaoId !== comissaoId) {
      throw new Error("Membro não pertence a esta comissão.");
    }
    return tx.membroComissao.delete({ where: { id: membroId } });
  });
}