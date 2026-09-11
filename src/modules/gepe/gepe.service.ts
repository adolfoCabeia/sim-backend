import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { listarUtilizadoresComPermissao } from "../auth/rbac/rbac.service.js";
import type { CriarPlanoInput, AtualizarPlanoInput, RejeitarPlanoInput } from "./gepe.schema.js";

export class PlanoGepeNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

function construirPayload<T extends Prisma.PlanoGepeUncheckedCreateInput | Prisma.PlanoGepeUncheckedUpdateInput>(
  dados: CriarPlanoInput | AtualizarPlanoInput
): Partial<T> {
  return {
    ...("tipo" in dados && dados.tipo !== undefined && { tipo: dados.tipo }),
    ...(dados.titulo !== undefined && { titulo: dados.titulo }),
    ...(dados.ano !== undefined && { ano: dados.ano }),
    ...(dados.objectivos !== undefined && { objectivos: dados.objectivos }),
    ...(dados.documentoId !== undefined && { documentoId: dados.documentoId }),
    ...(dados.periodoInicio !== undefined && dados.periodoInicio !== null && { periodoInicio: new Date(dados.periodoInicio) }),
    ...(dados.periodoFim !== undefined && dados.periodoFim !== null && { periodoFim: new Date(dados.periodoFim) }),
  } as Partial<T>;
}

export async function criarPlano(municipioId: string, criadoPorId: string, dados: CriarPlanoInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    if (dados.documentoId) {
      await tx.documento.findUniqueOrThrow({ where: { id: dados.documentoId } });
    }

    const data: Prisma.PlanoGepeUncheckedCreateInput = {
      municipioId,
      criadoPorId,
      estado: "RASCUNHO",
      tipo: dados.tipo,
      titulo: dados.titulo,
      ...(dados.ano !== undefined && { ano: dados.ano }),
      ...(dados.objectivos !== undefined && { objectivos: dados.objectivos }),
      ...(dados.documentoId !== undefined && { documentoId: dados.documentoId }),
      ...(dados.periodoInicio !== undefined && dados.periodoInicio !== null && { periodoInicio: new Date(dados.periodoInicio) }),
      ...(dados.periodoFim !== undefined && dados.periodoFim !== null && { periodoFim: new Date(dados.periodoFim) }),
    };

    return tx.planoGepe.create({ data });
  });
}
export async function listarPlanos(
  filtros: { municipioId: string; tipo?: string | undefined; estado?: string | undefined },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.PlanoGepeWhereInput = {
    ...(filtros.tipo && { tipo: filtros.tipo as Prisma.EnumTipoPlanoGepeFilter<"PlanoGepe"> }),
    ...(filtros.estado && { estado: filtros.estado as Prisma.EnumEstadoPlanoGepeFilter<"PlanoGepe"> }),
  };

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.planoGepe.findMany({ where, skip, take: paginacao.limit, orderBy: { criadoEm: "desc" } }),
      tx.planoGepe.count({ where }),
    ]);
    return { data, total };
  });
}

export async function obterPlano(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.planoGepe.findUnique({ where: { id }, include: { documento: true } });
  });
}

export async function atualizarPlano(id: string, municipioId: string, dados: AtualizarPlanoInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.planoGepe.findUniqueOrThrow({ where: { id } });
    if (existente.estado !== "RASCUNHO") {
      throw new TransicaoInvalidaError("Só é possível editar um plano em estado RASCUNHO.");
    }
    if (dados.documentoId) {
      await tx.documento.findUniqueOrThrow({ where: { id: dados.documentoId } });
    }
    const data: Prisma.PlanoGepeUncheckedUpdateInput = construirPayload(dados);
    return tx.planoGepe.update({ where: { id }, data });
  });
}
export async function removerPlano(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.planoGepe.findUniqueOrThrow({ where: { id } });
    if (existente.estado !== "RASCUNHO") {
      throw new TransicaoInvalidaError("Só é possível remover um plano em estado RASCUNHO.");
    }
    return tx.planoGepe.delete({ where: { id } });
  });
}

/** "Planos Anuais de Actividades — Submissão de relatórios de execução ao Administrador" (secção 11). */
export async function submeterPlano(id: string, municipioId: string, submetidoPorId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.planoGepe.findUniqueOrThrow({ where: { id } });
    if (existente.estado !== "RASCUNHO") {
      throw new TransicaoInvalidaError("Só é possível submeter um plano em estado RASCUNHO.");
    }

    const plano = await tx.planoGepe.update({
      where: { id },
      data: { estado: "SUBMETIDO", submetidoPorId, submetidoEm: new Date() },
    });

    const administradores = await listarUtilizadoresComPermissao(tx, "GEPE:APPROVE");
    for (const admin of administradores) {
      await notificarUtilizador(tx, {
        utilizadorDestinoId: admin.id,
        titulo: `Plano submetido para aprovação: ${plano.titulo}`,
        mensagem: `O GEPE submeteu "${plano.titulo}" (${plano.tipo}) para a sua aprovação.`,
        tipo: "ACAO_REQUERIDA",
        metadata: { planoGepeId: plano.id, tipo: "PLANO_GEPE_SUBMETIDO" },
        emailDestino: admin.emailConfirmado ? admin.email : null,
        nomeDestino: admin.nomeCompleto,
        telefoneDestino: admin.telefone,
      });
    }

    return plano;
  });
}

export async function aprovarPlano(id: string, municipioId: string, aprovadoPorId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.planoGepe.findUniqueOrThrow({ where: { id } });
    if (existente.estado !== "SUBMETIDO") {
      throw new TransicaoInvalidaError("Só é possível aprovar um plano em estado SUBMETIDO.");
    }
    return tx.planoGepe.update({
      where: { id },
      data: { estado: "APROVADO", aprovadoPorId, aprovadoEm: new Date() },
    });
  });
}

export async function rejeitarPlano(id: string, municipioId: string, aprovadoPorId: string, dados: RejeitarPlanoInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const existente = await tx.planoGepe.findUniqueOrThrow({ where: { id } });
    if (existente.estado !== "SUBMETIDO") {
      throw new TransicaoInvalidaError("Só é possível rejeitar um plano em estado SUBMETIDO.");
    }
    return tx.planoGepe.update({
      where: { id },
      data: {
        estado: "REJEITADO",
        aprovadoPorId,
        aprovadoEm: new Date(),
        observacoesAdministrador: dados.observacoesAdministrador,
      },
    });
  });
}

export async function listarInvestimentosPublicos(municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.processoGenerico.findMany({
      where: { tipo: "REQUISICAO_EMPREITADA" },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        numero: true,
        assunto: true,
        estado: true,
        direcaoAtual: { select: { nome: true, sigla: true } },
        criadoEm: true,
      },
    });
  });
}