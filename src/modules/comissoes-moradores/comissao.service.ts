import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { revokeAllRefreshTokens } from "../auth/jwt.service.js";
import type {
  ComissaoCreateInput,
  ComissaoUpdateInput,
  AlterarEstadoComissaoInput,
  AdicionarMembroInput,
} from "./comissao.schema.js";

export class ComissaoNaoEncontradaError extends Error {}
export class MembroNaoPertenceAComissaoError extends Error {}
export class TransicaoDeEstadoInvalidaError extends Error {}
// NOVO
export class UtilizadorInvalidoParaComissaoError extends Error {}
export class UtilizadorJaTemComissaoError extends Error {}

const TRANSICOES_PERMITIDAS: Record<string, readonly string[]> = {
  EM_REGULARIZACAO: ["ACTIVA", "INACTIVA"],
  ACTIVA: ["INACTIVA"],
  INACTIVA: ["EM_REGULARIZACAO", "ACTIVA"],
};

const UTILIZADOR_SELECT_SEGURO = {
  id: true,
  email: true,
  estado: true,
  online: true,
  ultimoLoginEm: true,
  deveTrocarPassword: true,
} as const;

export async function listarComissoes(
  filtros: { municipioId: string; bairro?: string | undefined; estado?: string | undefined },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.ComissaoModeradoresWhereInput = {
    ...(filtros.bairro && { bairro: { contains: filtros.bairro, mode: "insensitive" } }),
    ...(filtros.estado && {
      estado: filtros.estado as Prisma.EnumEstadoComissaoModeradoresFilter<"ComissaoModeradores">,
    }),
  };

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.comissaoModeradores.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { bairro: "asc" },
        include: {
          membros: true,
          utilizador: { select: UTILIZADOR_SELECT_SEGURO },
          _count: { select: { ocorrencias: true } },
        },
      }),
      tx.comissaoModeradores.count({ where }),
    ]);
    return { data, total };
  });
}

export async function obterComissao(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const comissao = await tx.comissaoModeradores.findUnique({
      where: { id },
      include: {
        membros: true,
        utilizador: { select: UTILIZADOR_SELECT_SEGURO },
        ocorrencias: { orderBy: { criadoEm: "desc" }, take: 20 },
      },
    });
    if (!comissao) throw new ComissaoNaoEncontradaError("Comissão não encontrada.");
    return comissao;
  });
}

/**
 * NOVO: a comissão liga-se a um Utilizador JÁ EXISTENTE (tipoConta
 * COMISSAO_MORADORES), em vez de criar email/password aqui — mesmo padrão
 * do módulo de Funcionários (ficha ligada a um utilizadorId pesquisado).
 * A conta é criada antes, por um fluxo administrativo de contas.
 */
export async function criarComissao(
  municipioId: string,
  dados: ComissaoCreateInput,
  criadoPor: { utilizadorId: string }
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const utilizador = await tx.utilizador.findUnique({ where: { id: dados.utilizadorId } });

    if (!utilizador) {
      throw new UtilizadorInvalidoParaComissaoError("Utilizador não encontrado.");
    }

    if (utilizador.tipoConta !== "COMISSAO_MORADORES") {
      throw new UtilizadorInvalidoParaComissaoError(
        "O utilizador seleccionado não tem o tipo de conta Comissão de Moradores."
      );
    }

    const jaTemComissao = await tx.comissaoModeradores.findUnique({
      where: { utilizadorId: dados.utilizadorId },
    });
    if (jaTemComissao) {
      throw new UtilizadorJaTemComissaoError("Este utilizador já está associado a uma comissão.");
    }

    const comissaoCriada = await tx.comissaoModeradores.create({
      data: {
        municipioId,
        utilizadorId: dados.utilizadorId,
        bairro: dados.bairro,
        presidenteNome: dados.presidenteNome,
        criadoPorUtilizadorId: criadoPor.utilizadorId,
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
      include: { membros: true, utilizador: { select: UTILIZADOR_SELECT_SEGURO } },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId,
        utilizadorId: criadoPor.utilizadorId,
        accao: "COMISSAO_MODERADORES_CRIADA",
        entidade: "ComissaoModeradores",
        entidadeId: comissaoCriada.id,
      },
    });

    return comissaoCriada;
  });
}

export async function atualizarComissao(
  id: string,
  municipioId: string,
  dados: ComissaoUpdateInput,
  alteradoPor: { utilizadorId: string }
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.comissaoModeradores.findUnique({ where: { id } });
    if (!existente) throw new ComissaoNaoEncontradaError("Comissão não encontrada.");

    const payload: Prisma.ComissaoModeradoresUncheckedUpdateInput = {
      ...(dados.bairro !== undefined && { bairro: dados.bairro }),
      ...(dados.presidenteNome !== undefined && { presidenteNome: dados.presidenteNome }),
      ...(dados.coordenadasLat !== undefined && { coordenadasLat: dados.coordenadasLat }),
      ...(dados.coordenadasLng !== undefined && { coordenadasLng: dados.coordenadasLng }),
      ...(dados.presidenteContacto !== undefined && { presidenteContacto: dados.presidenteContacto }),
      ...(dados.documentacaoLegalUrl !== undefined && { documentacaoLegalUrl: dados.documentacaoLegalUrl }),
      ...(dados.observacoes !== undefined && { observacoes: dados.observacoes }),
    };

    const atualizada = await tx.comissaoModeradores.update({
      where: { id },
      data: payload,
      include: { membros: true, utilizador: { select: UTILIZADOR_SELECT_SEGURO } },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId,
        utilizadorId: alteradoPor.utilizadorId,
        accao: "COMISSAO_MODERADORES_ACTUALIZADA",
        entidade: "ComissaoModeradores",
        entidadeId: id,
      },
    });

    return atualizada;
  });
}

export async function alterarEstadoComissao(
  id: string,
  municipioId: string,
  dados: AlterarEstadoComissaoInput,
  alteradoPor: { utilizadorId: string }
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.comissaoModeradores.findUnique({ where: { id } });
    if (!existente) throw new ComissaoNaoEncontradaError("Comissão não encontrada.");

    if (existente.estado === dados.estado) return existente;

    const permitido = TRANSICOES_PERMITIDAS[existente.estado]?.includes(dados.estado);
    if (!permitido) {
      throw new TransicaoDeEstadoInvalidaError(
        `Não é possível mudar de "${existente.estado}" para "${dados.estado}".`
      );
    }

    const atualizada = await tx.comissaoModeradores.update({
      where: { id },
      data: { estado: dados.estado },
      include: { membros: true, utilizador: { select: UTILIZADOR_SELECT_SEGURO } },
    });

    if (dados.estado === "INACTIVA") {
      await tx.utilizador.update({ where: { id: existente.utilizadorId }, data: { estado: "SUSPENSA" } });
      await revokeAllRefreshTokens(existente.utilizadorId);
    }
    if (dados.estado === "ACTIVA" && existente.estado === "INACTIVA") {
      await tx.utilizador.update({ where: { id: existente.utilizadorId }, data: { estado: "ACTIVA" } });
    }

    await tx.logAuditoria.create({
      data: {
        municipioId,
        utilizadorId: alteradoPor.utilizadorId,
        accao: `COMISSAO_MODERADORES_ESTADO_${dados.estado}`,
        entidade: "ComissaoModeradores",
        entidadeId: id,
        ...(dados.motivo !== undefined && { observacao: dados.motivo }),
      },
    });

    return atualizada;
  });
}

export async function removerComissao(id: string, municipioId: string, removidoPor: { utilizadorId: string }) {
  return alterarEstadoComissao(
    id,
    municipioId,
    { estado: "INACTIVA", motivo: "Comissão desactivada via remoção administrativa." },
    removidoPor
  );
}

export async function adicionarMembro(
  comissaoId: string,
  municipioId: string,
  dados: AdicionarMembroInput,
  adicionadoPor: { utilizadorId: string }
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const comissao = await tx.comissaoModeradores.findUnique({ where: { id: comissaoId } });
    if (!comissao) throw new ComissaoNaoEncontradaError("Comissão não encontrada.");

    const membro = await tx.membroComissao.create({
      data: {
        comissaoId,
        nome: dados.nome,
        cargo: dados.cargo,
        ...(dados.contacto !== undefined && { contacto: dados.contacto }),
      },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId,
        utilizadorId: adicionadoPor.utilizadorId,
        accao: "MEMBRO_COMISSAO_ADICIONADO",
        entidade: "MembroComissao",
        entidadeId: membro.id,
      },
    });

    return membro;
  });
}

export async function removerMembro(
  comissaoId: string,
  membroId: string,
  municipioId: string,
  removidoPor: { utilizadorId: string }
) {
  return withTenantTransaction(municipioId, async (tx) => {
    const membro = await tx.membroComissao.findUnique({ where: { id: membroId } });
    if (!membro) throw new ComissaoNaoEncontradaError("Membro não encontrado.");
    if (membro.comissaoId !== comissaoId) {
      throw new MembroNaoPertenceAComissaoError("Membro não pertence a esta comissão.");
    }

    await tx.membroComissao.delete({ where: { id: membroId } });

    await tx.logAuditoria.create({
      data: {
        municipioId,
        utilizadorId: removidoPor.utilizadorId,
        accao: "MEMBRO_COMISSAO_REMOVIDO",
        entidade: "MembroComissao",
        entidadeId: membroId,
      },
    });
  });
}