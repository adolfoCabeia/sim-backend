import { prisma, withTenantTransaction } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { uploadImagem } from "../storage/upload-imagem.js";
import { storageService } from "../storage/storage.service.js";

export class RequisicaoNaoEncontradaError extends Error {}
export class TransicaoEstadoInvalidaError extends Error {}
export class ItensVaziosError extends Error {}
export class AnexosInsuficientesError extends Error {}

async function registarAuditoria(
  tx: Prisma.TransactionClient,
  params: {
    municipioId: string;
    utilizadorId: string;
    accao: string;
    entidade: string;
    entidadeId?: string | null;
    detalhes?: Prisma.InputJsonValue;
  },
) {
  await tx.logAuditoria.create({
    data: {
      municipioId: params.municipioId,
      utilizadorId: params.utilizadorId,
      accao: params.accao,
      entidade: params.entidade,
      ...(params.entidadeId !== undefined && { entidadeId: params.entidadeId }),
      ...(params.detalhes !== undefined && { detalhes: params.detalhes }),
    },
  });
}

/**
 * Gera o número da requisição dentro da mesma transacção
 * que cria a requisição.
 *
 * O advisory lock impede que duas transacções do mesmo
 * município/ano calculem simultaneamente o mesmo count + 1.
 */
async function gerarNumeroRequisicao(
  tx: Prisma.TransactionClient,
  municipioId: string,
): Promise<string> {
  const ano = new Date().getFullYear();
  const prefixo = "REQ";

  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${`requisicao:${municipioId}:${ano}`})
    )
  `;

  const count = await tx.requisicaoLogistica.count({
    where: {
      municipioId,
      criadoEm: {
        gte: new Date(`${ano}-01-01`),
      },
    },
  });

  return `${prefixo}/${ano}/${String(count + 1).padStart(4, "0")}`;
}

const transicoesPermitidas: Record<string, string[]> = {
  RASCUNHO: ["SUBMETIDA"],
  SUBMETIDA: ["APROVADA", "REJEITADA"],
  APROVADA: ["EM_EXECUCAO"],
  REJEITADA: ["RASCUNHO"],
  EM_EXECUCAO: ["CONCLUIDA", "PARADA"],
};

function podeTransitar(
  estadoActual: string,
  novoEstado: string,
): boolean {
  return (
    transicoesPermitidas[estadoActual]?.includes(novoEstado) ??
    false
  );
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

    ...(params.categoria && {
      categoria: params.categoria as any,
    }),

    ...(params.estado && {
      estado: params.estado as any,
    }),

    ...(params.direcaoId && {
      direcaoId: params.direcaoId,
    }),
  };

  const [items, total] = await Promise.all([
    prisma.requisicaoLogistica.findMany({
      where,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        direcao: {
          select: {
            id: true,
            nome: true,
          },
        },
        requerente: {
          select: {
            id: true,
            nomeCompleto: true,
          },
        },
        itens: {
          take: 3,
        },
        _count: {
          select: {
            itens: true,
            anexos: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    }),

    prisma.requisicaoLogistica.count({
      where,
    }),
  ]);

  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize),
  };
}

export async function obterRequisicao(
  id: string,
  municipioId: string,
) {
  const req = await prisma.requisicaoLogistica.findFirst({
    where: {
      id,
      municipioId,
    },
    include: {
      direcao: true,
      requerente: {
        select: {
          id: true,
          nomeCompleto: true,
        },
      },
      itens: true,
      anexos: true,
    },
  });

  if (!req) {
    throw new RequisicaoNaoEncontradaError(
      "Requisição não encontrada.",
    );
  }

  for (const a of req.anexos) {
    if (
      a.storageKey &&
      !a.storageKey.startsWith("http")
    ) {
      (a as any).url =
        await storageService.gerarUrlVisualizacao(
          a.storageKey,
          3600,
        );
    }
  }

  return req;
}

export async function criarRequisicao(params: {
  dados: Prisma.RequisicaoLogisticaUncheckedCreateInput;
  itens?: Array<{
    tipoBem: string;
    unidadeMedida: string;
    quantidade: number;
    especificacoes?: string | undefined;
  }>;
  anexos?: Array<{
    buffer: Buffer;
    direcao?: string | undefined;
    descricao?: string | undefined;
  }>;
  requerenteId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      if (
        params.dados.categoria === "BEM" &&
        (!params.itens || params.itens.length === 0)
      ) {
        throw new ItensVaziosError(
          "Uma requisição de Bem deve conter pelo menos um item.",
        );
      }

      if (
        params.dados.categoria === "EMPREITADA" &&
        (!params.anexos || params.anexos.length < 2)
      ) {
        throw new AnexosInsuficientesError(
          "Empreitada requer no mínimo 2 imagens (anexos).",
        );
      }

      const numero = await gerarNumeroRequisicao(
        tx,
        params.municipioId,
      );

      const anexosStorage: Array<{
        storageKey: string;
        direcao?: string;
        descricao?: string;
      }> = [];

      if (params.anexos) {
        for (const a of params.anexos) {
          const upload = await uploadImagem({
            buffer: a.buffer,
            prefixo: `logistica/${params.municipioId}/empreitadas`,
            ...(a.direcao && {
              nomeOriginal: `obra-${a.direcao}.jpg`,
            }),
          });

          anexosStorage.push({
            storageKey: upload.storageKey,
            ...(a.direcao !== undefined && {
              direcao: a.direcao,
            }),
            ...(a.descricao !== undefined && {
              descricao: a.descricao,
            }),
          });
        }
      }

      const createData: Prisma.RequisicaoLogisticaUncheckedCreateInput =
        {
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
              ...(item.especificacoes !== undefined && {
                especificacoes: item.especificacoes,
              }),
            })),
          },
        };
      }

      if (anexosStorage.length) {
        createData.anexos = {
          createMany: {
            data: anexosStorage,
          },
        };
      }

      const requisicao =
        await tx.requisicaoLogistica.create({
          data: createData,
          include: {
            itens: true,
            anexos: true,
            direcao: true,
          },
        });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.requerenteId,
        accao: "CRIAR_REQUISICAO_LOGISTICA",
        entidade: "RequisicaoLogistica",
        entidadeId: requisicao.id,
        detalhes: {
          numero: requisicao.numero,
          categoria: requisicao.categoria,
          estado: requisicao.estado,
          direcaoId: requisicao.direcaoId ?? null,
          quantidadeItens:
            params.itens?.length ?? 0,
          quantidadeAnexos:
            params.anexos?.length ?? 0,
        } as Prisma.InputJsonValue,
      });

      return requisicao;
    },
  );
}

export async function alterarEstadoRequisicao(params: {
  id: string;
  novoEstado: string;
  motivo?: string | undefined;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const req =
        await tx.requisicaoLogistica.findFirst({
          where: {
            id: params.id,
            municipioId: params.municipioId,
          },
        });

      if (!req) {
        throw new RequisicaoNaoEncontradaError(
          "Requisição não encontrada.",
        );
      }

      if (
        !podeTransitar(
          req.estado,
          params.novoEstado,
        )
      ) {
        throw new TransicaoEstadoInvalidaError(
          `Não é possível transitar de "${req.estado}" para "${params.novoEstado}".`,
        );
      }

      const agora = new Date();

      const updateData: Prisma.RequisicaoLogisticaUpdateInput =
        {
          estado: params.novoEstado as any,
          alteradoEm: agora,
        };

      if (params.novoEstado === "APROVADA") {
        updateData.aprovadoPorId =
          params.utilizadorId;
        updateData.aprovadoEm = agora;
      }

      /*
       * Compare-and-swap.
       *
       * A transição só é aplicada se o estado continuar
       * exactamente igual ao estado que foi lido.
       */
      const resultado =
        await tx.requisicaoLogistica.updateMany({
          where: {
            id: params.id,
            municipioId: params.municipioId,
            estado: req.estado,
          },
          data: updateData,
        });

      if (resultado.count !== 1) {
        throw new TransicaoEstadoInvalidaError(
          "A requisição foi alterada por outro utilizador. Actualize os dados e tente novamente.",
        );
      }

      const requisicaoActualizada =
        await tx.requisicaoLogistica.findFirst({
          where: {
            id: params.id,
            municipioId: params.municipioId,
          },
          include: {
            direcao: true,
            itens: true,
          },
        });

      if (!requisicaoActualizada) {
        throw new RequisicaoNaoEncontradaError(
          "Requisição não encontrada após actualização.",
        );
      }

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "ALTERAR_ESTADO_REQUISICAO",
        entidade: "RequisicaoLogistica",
        entidadeId: params.id,
        detalhes: {
          estadoAnterior: req.estado,
          estadoNovo: params.novoEstado,
          motivo: params.motivo ?? null,
          numero: req.numero,
        } as Prisma.InputJsonValue,
      });

      return requisicaoActualizada;
    },
  );
}

export async function adicionarAnexoEmpreitada(params: {
  requisicaoId: string;
  buffer: Buffer;
  direcao?: string | undefined;
  descricao?: string | undefined;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const req =
        await tx.requisicaoLogistica.findFirst({
          where: {
            id: params.requisicaoId,
            municipioId: params.municipioId,
            categoria: "EMPREITADA",
          },
        });

      if (!req) {
        throw new RequisicaoNaoEncontradaError(
          "Requisição de empreitada não encontrada.",
        );
      }

      const upload = await uploadImagem({
        buffer: params.buffer,
        prefixo: `logistica/${params.municipioId}/empreitadas`,
        ...(params.direcao && {
          nomeOriginal: `obra-${params.direcao}.jpg`,
        }),
      });

      const anexo =
        await tx.requisicaoAnexo.create({
          data: {
            requisicaoId: params.requisicaoId,
            storageKey: upload.storageKey,
            ...(params.direcao && {
              direcao: params.direcao,
            }),
            ...(params.descricao && {
              descricao: params.descricao,
            }),
          },
        });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "ADICIONAR_ANEXO_EMPREITADA",
        entidade: "RequisicaoAnexo",
        entidadeId: anexo.id,
        detalhes: {
          requisicaoId: params.requisicaoId,
          direcao: params.direcao ?? null,
          descricao: params.descricao ?? null,
        } as Prisma.InputJsonValue,
      });

      return anexo;
    },
  );
}

export async function actualizarPercentagemEmpreitada(
  params: {
    requisicaoId: string;
    percentagem: number;
    municipioId: string;
    utilizadorId?: string;
  },
) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const req =
        await tx.requisicaoLogistica.findFirst({
          where: {
            id: params.requisicaoId,
            municipioId: params.municipioId,
            categoria: "EMPREITADA",
          },
        });

      if (!req) {
        throw new RequisicaoNaoEncontradaError(
          "Empreitada não encontrada.",
        );
      }

      const resultado =
        await tx.requisicaoLogistica.updateMany({
          where: {
            id: params.requisicaoId,
            municipioId: params.municipioId,
            categoria: "EMPREITADA",
            estado: req.estado,
            percentagemExecucao:
              req.percentagemExecucao,
          },
          data: {
            percentagemExecucao:
              params.percentagem,
            alteradoEm: new Date(),
          },
        });

      if (resultado.count !== 1) {
        throw new Error(
          "A empreitada foi alterada por outro utilizador. Actualize os dados e tente novamente.",
        );
      }

      const requisicaoActualizada =
        await tx.requisicaoLogistica.findFirst({
          where: {
            id: params.requisicaoId,
            municipioId: params.municipioId,
          },
        });

      if (!requisicaoActualizada) {
        throw new RequisicaoNaoEncontradaError(
          "Empreitada não encontrada após actualização.",
        );
      }

      if (params.utilizadorId) {
        await registarAuditoria(tx, {
          municipioId: params.municipioId,
          utilizadorId: params.utilizadorId,
          accao: "ACTUALIZAR_PERCENTAGEM_EMPREITADA",
          entidade: "RequisicaoLogistica",
          entidadeId: params.requisicaoId,
          detalhes: {
            percentagemAnterior:
              req.percentagemExecucao,
            percentagemNova:
              params.percentagem,
            estado: req.estado,
          } as Prisma.InputJsonValue,
        });
      }

      return requisicaoActualizada;
    },
  );
}

export async function actualizarRequisicao(params: {
  id: string;
  categoria: "BEM" | "SERVICO" | "EMPREITADA";
  dados: Record<string, unknown>;
  itens?: Array<{
    tipoBem: string;
    unidadeMedida: string;
    quantidade: number;
    especificacoes?: string | undefined;
  }>;
  municipioId: string;
  utilizadorId?: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const req =
        await tx.requisicaoLogistica.findFirst({
          where: {
            id: params.id,
            municipioId: params.municipioId,
          },
        });

      if (!req) {
        throw new RequisicaoNaoEncontradaError(
          "Requisição não encontrada.",
        );
      }

      if (req.estado !== "RASCUNHO") {
        throw new TransicaoEstadoInvalidaError(
          "Só é possível editar requisições em estado RASCUNHO.",
        );
      }

      if (
        params.categoria === "BEM" &&
        params.itens &&
        params.itens.length === 0
      ) {
        throw new ItensVaziosError(
          "Uma requisição de Bem deve conter pelo menos um item.",
        );
      }

      const updateData: Prisma.RequisicaoLogisticaUncheckedUpdateInput =
        {
          ...params.dados,
          alteradoEm: new Date(),
        };

      /*
       * Primeiro actualizamos condicionalmente a requisição.
       *
       * Isto funciona como uma aquisição de lock lógico:
       * só continua se a requisição ainda estiver em RASCUNHO.
       *
       * Se outro processo a tiver tirado de RASCUNHO entretanto,
       * a operação é abortada.
       */
      const actualizacao =
        await tx.requisicaoLogistica.updateMany({
          where: {
            id: params.id,
            municipioId: params.municipioId,
            estado: "RASCUNHO",
          },
          data: {
            alteradoEm: new Date(),
          },
        });

      if (actualizacao.count !== 1) {
        throw new TransicaoEstadoInvalidaError(
          "A requisição foi alterada por outro utilizador. Actualize os dados e tente novamente.",
        );
      }

      if (
        params.categoria === "BEM" &&
        params.itens
      ) {
        await tx.requisicaoItem.deleteMany({
          where: {
            requisicaoId: params.id,
          },
        });

        updateData.itens = {
          createMany: {
            data: params.itens.map((item) => ({
              tipoBem: item.tipoBem,
              unidadeMedida: item.unidadeMedida,
              quantidade: item.quantidade,
              ...(item.especificacoes !== undefined && {
                especificacoes:
                  item.especificacoes,
              }),
            })),
          },
        };
      }

      const requisicao =
        await tx.requisicaoLogistica.update({
          where: {
            id: params.id,
          },
          data: updateData,
          include: {
            itens: true,
            anexos: true,
            direcao: true,
          },
        });

      if (params.utilizadorId) {
        await registarAuditoria(tx, {
          municipioId: params.municipioId,
          utilizadorId: params.utilizadorId,
          accao: "ACTUALIZAR_REQUISICAO",
          entidade: "RequisicaoLogistica",
          entidadeId: requisicao.id,
          detalhes: {
            numero: requisicao.numero,
            categoriaAnterior: req.categoria,
            categoriaNova:
              requisicao.categoria,
            estado: req.estado,
            quantidadeItens:
              params.itens?.length ?? null,
            camposActualizados:
              Object.keys(params.dados),
          } as Prisma.InputJsonValue,
        });
      }

      return requisicao;
    },
  );
}