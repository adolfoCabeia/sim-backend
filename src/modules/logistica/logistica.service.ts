import { prisma, withTenantTransaction } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { uploadImagem } from "../storage/upload-imagem.js";
import { storageService } from "../storage/storage.service.js";

export class RequisicaoNaoEncontradaError extends Error {}
export class TransicaoEstadoInvalidaError extends Error {}
export class ItensVaziosError extends Error {}
export class AnexosInsuficientesError extends Error {}

function gerarNumeroRequisicao(municipioId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const prefixo = "REQ";
  return prisma.$transaction(async (tx) => {
    const count = await tx.requisicaoLogistica.count({
      where: { municipioId, criadoEm: { gte: new Date(`${ano}-01-01`) } },
    });
    return `${prefixo}/${ano}/${String(count + 1).padStart(4, "0")}`;
  });
}

const transicoesPermitidas: Record<string, string[]> = {
  RASCUNHO: ["SUBMETIDA"],
  SUBMETIDA: ["APROVADA", "REJEITADA"],
  APROVADA: ["EM_EXECUCAO"],
  REJEITADA: ["RASCUNHO"],
  EM_EXECUCAO: ["CONCLUIDA", "PARADA"],
};

function podeTransitar(estadoActual: string, novoEstado: string): boolean {
  return transicoesPermitidas[estadoActual]?.includes(novoEstado) ?? false;
}

export async function listarRequisicoes(params: {
  municipioId: string;
  page: number;
  pageSize: number;
  categoria?: string | undefined;
  estado?: string | undefined;
  direcaoId?: string | undefined;
}) {
  const where: Prisma.RequisicaoLogisticaWhereInput = {
    municipioId: params.municipioId,
    ...(params.categoria && { categoria: params.categoria as any }),
    ...(params.estado && { estado: params.estado as any }),
    ...(params.direcaoId && { direcaoId: params.direcaoId }),
  };

  const [items, total] = await Promise.all([
    prisma.requisicaoLogistica.findMany({
      where,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        direcao: { select: { id: true, nome: true } },
        requerente: { select: { id: true, nomeCompleto: true } },
        itens: { take: 3 },
        _count: { select: { itens: true, anexos: true } },
      },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.requisicaoLogistica.count({ where }),
  ]);

  return { items, page: params.page, pageSize: params.pageSize, total, totalPages: Math.ceil(total / params.pageSize) };
}

export async function obterRequisicao(id: string, municipioId: string) {
  const req = await prisma.requisicaoLogistica.findFirst({
    where: { id, municipioId },
    include: {
      direcao: true,
      requerente: { select: { id: true, nomeCompleto: true } },
      itens: true,
      anexos: true,
    },
  });
  if (!req) throw new RequisicaoNaoEncontradaError("Requisição não encontrada.");

  for (const a of req.anexos) {
    if (a.storageKey && !a.storageKey.startsWith("http")) {
      (a as any).url = await storageService.gerarUrlVisualizacao(a.storageKey, 3600);
    }
  }
  return req;
}

export async function criarRequisicao(params: {
  dados: Prisma.RequisicaoLogisticaUncheckedCreateInput;
  itens?: Array<{ tipoBem: string; unidadeMedida: string; quantidade: number; especificacoes?: string | undefined }>;
  anexos?: Array<{ buffer: Buffer; direcao?: string | undefined; descricao?: string | undefined }>;
  requerenteId: string;
  municipioId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const numero = await gerarNumeroRequisicao(params.municipioId);

    if (params.dados.categoria === "BEM" && (!params.itens || params.itens.length === 0)) {
      throw new ItensVaziosError("Uma requisição de Bem deve conter pelo menos um item.");
    }
    if (params.dados.categoria === "EMPREITADA" && (!params.anexos || params.anexos.length < 2)) {
      throw new AnexosInsuficientesError("Empreitada requer no mínimo 2 imagens (anexos).");
    }

    const anexosStorage: Array<{ storageKey: string; direcao?: string; descricao?: string }> = [];
    if (params.anexos) {
      for (const a of params.anexos) {
        const upload = await uploadImagem({
          buffer: a.buffer,
          prefixo: `logistica/${params.municipioId}/empreitadas`,
          ...(a.direcao && { nomeOriginal: `obra-${a.direcao}.jpg` }),
        });
        anexosStorage.push({
          storageKey: upload.storageKey,
          ...(a.direcao !== undefined && { direcao: a.direcao }),
          ...(a.descricao !== undefined && { descricao: a.descricao }),
        });
      }
    }
    const createData: Prisma.RequisicaoLogisticaUncheckedCreateInput = {
      ...params.dados,
      municipioId: params.municipioId,
      requerenteId: params.requerenteId,
      numero,
    };

    if (params.itens?.length) {
      createData.itens = {
        createMany: {
          data: params.itens.map((item) => ({
            tipoBem: item.tipoBem,
            unidadeMedida: item.unidadeMedida,
            quantidade: item.quantidade,
            ...(item.especificacoes !== undefined && { especificacoes: item.especificacoes }),
          })),
        },
      };
    }
    if (anexosStorage.length) {
      createData.anexos = { createMany: { data: anexosStorage } };
    }

    return tx.requisicaoLogistica.create({
      data: createData,
      include: { itens: true, anexos: true, direcao: true },
    });
  });
}

export async function alterarEstadoRequisicao(params: {
  id: string;
  novoEstado: string;
  motivo?: string | undefined;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const req = await tx.requisicaoLogistica.findFirst({
      where: { id: params.id, municipioId: params.municipioId },
    });
    if (!req) throw new RequisicaoNaoEncontradaError("Requisição não encontrada.");
    if (!podeTransitar(req.estado, params.novoEstado)) {
      throw new TransicaoEstadoInvalidaError(
        `Não é possível transitar de "${req.estado}" para "${params.novoEstado}".`
      );
    }

    const updateData: Prisma.RequisicaoLogisticaUpdateInput = {
      estado: params.novoEstado as any,
      alteradoEm: new Date(),
    };
    if (params.novoEstado === "APROVADA") {
      updateData.aprovadoPorId = params.utilizadorId;
      updateData.aprovadoEm = new Date();
    }

    return tx.requisicaoLogistica.update({
      where: { id: params.id },
      data: updateData,
      include: { direcao: true, itens: true },
    });
  });
}

export async function adicionarAnexoEmpreitada(params: {
  requisicaoId: string;
  buffer: Buffer;
  direcao?: string | undefined;
  descricao?: string | undefined;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const req = await tx.requisicaoLogistica.findFirst({
      where: { id: params.requisicaoId, municipioId: params.municipioId, categoria: "EMPREITADA" },
    });
    if (!req) throw new RequisicaoNaoEncontradaError("Requisição de empreitada não encontrada.");

    const upload = await uploadImagem({
      buffer: params.buffer,
      prefixo: `logistica/${params.municipioId}/empreitadas`,
      ...(params.direcao && { nomeOriginal: `obra-${params.direcao}.jpg` }),
    });

    return tx.requisicaoAnexo.create({
      data: {
        requisicaoId: params.requisicaoId,
        storageKey: upload.storageKey,
        ...(params.direcao && { direcao: params.direcao }),
        ...(params.descricao && { descricao: params.descricao }),
      },
    });
  });
}

export async function actualizarPercentagemEmpreitada(params: {
  requisicaoId: string;
  percentagem: number;
  municipioId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const req = await tx.requisicaoLogistica.findFirst({
      where: { id: params.requisicaoId, municipioId: params.municipioId, categoria: "EMPREITADA" },
    });
    if (!req) throw new RequisicaoNaoEncontradaError("Empreitada não encontrada.");

    return tx.requisicaoLogistica.update({
      where: { id: params.requisicaoId },
      data: { percentagemExecucao: params.percentagem, alteradoEm: new Date() },
    });
  });
}

export async function actualizarRequisicao(params: {
  id: string;
  categoria: "BEM" | "SERVICO" | "EMPREITADA";
  dados: Record<string, unknown>;
  itens?: Array<{ tipoBem: string; unidadeMedida: string; quantidade: number; especificacoes?: string | undefined }>;
  municipioId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const req = await tx.requisicaoLogistica.findFirst({
      where: { id: params.id, municipioId: params.municipioId },
    });
    if (!req) throw new RequisicaoNaoEncontradaError("Requisição não encontrada.");
    if (req.estado !== "RASCUNHO") {
      throw new TransicaoEstadoInvalidaError("Só é possível editar requisições em estado RASCUNHO.");
    }

    if (params.categoria === "BEM" && params.itens && params.itens.length === 0) {
      throw new ItensVaziosError("Uma requisição de Bem deve conter pelo menos um item.");
    }

    const updateData: Prisma.RequisicaoLogisticaUncheckedUpdateInput = {
      ...params.dados,
      alteradoEm: new Date(),
    };

    if (params.categoria === "BEM" && params.itens) {
      await tx.requisicaoItem.deleteMany({ where: { requisicaoId: params.id } });
      updateData.itens = {
        createMany: {
          data: params.itens.map((item) => ({
            tipoBem: item.tipoBem,
            unidadeMedida: item.unidadeMedida,
            quantidade: item.quantidade,
            ...(item.especificacoes !== undefined && { especificacoes: item.especificacoes }),
          })),
        },
      };
    }

    return tx.requisicaoLogistica.update({
      where: { id: params.id },
      data: updateData,
      include: { itens: true, anexos: true, direcao: true },
    });
  });
}