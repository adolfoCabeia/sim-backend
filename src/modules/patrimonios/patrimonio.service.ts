import { prisma, withTenantTransaction } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { uploadImagem } from "../storage/upload-imagem.js";
import { storageService } from "../storage/storage.service.js";

export class BemNaoEncontradoError extends Error {}
export class BemJaAbatidoError extends Error {}
export class FachadaDuplicadaError extends Error {}
export class TransferenciaMesmaDirecaoError extends Error {}

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
      entidadeId: params.entidadeId ?? null,
      ...(params.detalhes !== undefined && {
        detalhes: params.detalhes,
      }),
    },
  });
}

async function enriquecerUrls(bem: any): Promise<any> {
  if (!bem) return bem;

  if (bem.fachadas?.length) {
    for (const f of bem.fachadas) {
      if (f.imagemUrl && !f.imagemUrl.startsWith("http")) {
        f.imagemUrl = await storageService.gerarUrlVisualizacao(
          f.imagemUrl,
          3600,
        );
      }
    }
  }

  if (bem.imagens?.length) {
    for (const img of bem.imagens) {
      if (img.url && !img.url.startsWith("http")) {
        img.url = await storageService.gerarUrlVisualizacao(
          img.url,
          3600,
        );
      }
    }
  }

  return bem;
}

export async function listarBens(params: {
  municipioId: string;
  page: number;
  pageSize: number;
  categoria?: string;
  estado?: string;
  direcaoId?: string;
  search?: string;
}) {
  const where: Prisma.BemWhereInput = {
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

    ...(params.search && {
      OR: [
        {
          designacao: {
            contains: params.search,
            mode: "insensitive",
          },
        },
        {
          localizacao: {
            contains: params.search,
            mode: "insensitive",
          },
        },
        {
          marca: {
            contains: params.search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.bem.findMany({
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
        imagens: {
          take: 1,
          select: {
            url: true,
          },
        },
        regularizacaoJuridica: {
          select: {
            situacaoJuridica: true,
            alertaIrregularidade: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    }),

    prisma.bem.count({
      where,
    }),
  ]);

  for (const item of items) {
    if (
      item.imagens?.[0]?.url &&
      !item.imagens[0].url.startsWith("http")
    ) {
      item.imagens[0].url =
        await storageService.gerarUrlVisualizacao(
          item.imagens[0].url,
          3600,
        );
    }
  }

  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize),
  };
}

export async function obterBem(
  id: string,
  municipioId: string,
) {
  const bem = await prisma.bem.findFirst({
    where: {
      id,
      municipioId,
    },
    include: {
      direcao: true,
      fachadas: true,
      imagens: true,
      historico: {
        orderBy: {
          data: "desc",
        },
        take: 50,
      },
      movimentos: {
        orderBy: {
          data: "desc",
        },
        take: 50,
      },
      regularizacaoJuridica: true,
    },
  });

  if (!bem) {
    throw new BemNaoEncontradoError("Bem não encontrado.");
  }

  return enriquecerUrls(bem);
}

export async function criarBem(params: {
  dados: Prisma.BemCreateInput;
  fachadas?: Array<{
    direcao: string;
    imagemBuffer?: Buffer;
    descricao?: string;
  }>;
  logotipoBuffer?: Buffer;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      let logotipoUrl: string | undefined;

      if (
        params.logotipoBuffer &&
        params.dados.categoria === "INTANGIVEIS"
      ) {
        const upload = await uploadImagem({
          buffer: params.logotipoBuffer,
          prefixo: `patrimonio/${params.municipioId}/logotipos`,
        });

        logotipoUrl = upload.storageKey;
      }

      const fachadasComStorage: Array<{
        direcao: string;
        imagemUrl?: string;
        descricao?: string;
      }> = [];

      if (params.fachadas) {
        for (const f of params.fachadas) {
          const fachada: {
            direcao: string;
            imagemUrl?: string;
            descricao?: string;
          } = {
            direcao: f.direcao,
          };

          if (f.imagemBuffer) {
            const upload = await uploadImagem({
              buffer: f.imagemBuffer,
              prefixo: `patrimonio/${params.municipioId}/fachadas`,
              ...(f.direcao && {
                nomeOriginal: `fachada-${f.direcao}.jpg`,
              }),
            });

            fachada.imagemUrl = upload.storageKey;
          }

          if (f.descricao) {
            fachada.descricao = f.descricao;
          }

          fachadasComStorage.push(fachada);
        }
      }

      const createData: Prisma.BemCreateInput = {
        ...params.dados,
        municipioId: params.municipioId,
        criadoPorId: params.utilizadorId,
      };

      if (logotipoUrl) {
        createData.logotipoUrl = logotipoUrl;
      }

      if (fachadasComStorage.length > 0) {
        createData.fachadas = {
          createMany: {
            data: fachadasComStorage,
          },
        };
      }

      const bem = await tx.bem.create({
        data: createData,
        include: {
          fachadas: true,
          direcao: true,
        },
      });

      await tx.bemHistorico.create({
        data: {
          bemId: bem.id,
          tipo: "CRIACAO",
          descricao: `Bem "${bem.designacao}" registado.`,
          utilizadorId: params.utilizadorId,
        },
      });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "CRIAR_BEM",
        entidade: "Bem",
        entidadeId: bem.id,
        detalhes: {
          designacao: bem.designacao,
          categoria: bem.categoria,
          direcaoId: bem.direcaoId,
        } as Prisma.InputJsonValue,
      });

      return enriquecerUrls(bem);
    },
  );
}

export async function editarBem(params: {
  id: string;
  dados: Prisma.BemUpdateInput;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const existente = await tx.bem.findFirst({
        where: {
          id: params.id,
          municipioId: params.municipioId,
        },
      });

      if (!existente) {
        throw new BemNaoEncontradoError(
          "Bem não encontrado.",
        );
      }

      const bem = await tx.bem.update({
        where: {
          id: params.id,
        },
        data: {
          ...params.dados,
          alteradoPorId: params.utilizadorId,
        },
        include: {
          direcao: true,
        },
      });

      await tx.bemHistorico.create({
        data: {
          bemId: bem.id,
          tipo: "EDICAO",
          descricao: `Dados do bem "${bem.designacao}" actualizados.`,
          utilizadorId: params.utilizadorId,
          dadosAnteriores: existente as any,
        },
      });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "EDITAR_BEM",
        entidade: "Bem",
        entidadeId: bem.id,
        detalhes: {
          dadosAnteriores: existente as any,
          dadosNovos: params.dados as any,
        } as Prisma.InputJsonValue,
      });

      return enriquecerUrls(bem);
    },
  );
}

export async function transferirBem(params: {
  bemId: string;
  direcaoDestinoId: string;
  observacao?: string;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const bem = await tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
        },
        include: {
          direcao: true,
        },
      });

      if (!bem) {
        throw new BemNaoEncontradoError(
          "Bem não encontrado.",
        );
      }

      if (bem.estado === "ABATIDO") {
        throw new BemJaAbatidoError(
          "Não é possível transferir um bem abatido.",
        );
      }

      if (bem.direcaoId === params.direcaoDestinoId) {
        throw new TransferenciaMesmaDirecaoError(
          "O bem já se encontra na direcção de destino.",
        );
      }

      const direcaoDestino = await tx.direcao.findUnique({
        where: {
          id: params.direcaoDestinoId,
        },
        select: {
          id: true,
          nome: true,
        },
      });

      if (!direcaoDestino) {
        throw new Error(
          "Direcção de destino não encontrada.",
        );
      }

      /*
       * Compare-and-swap:
       *
       * A actualização só é executada se o bem continuar
       * exactamente no estado/direcção que foram lidos.
       *
       * Se outra transacção alterar a direcção entretanto,
       * o UPDATE não encontra a linha e count será 0.
       */
      const resultado = await tx.bem.updateMany({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
          direcaoId: bem.direcaoId,
          estado: {
            not: "ABATIDO",
          },
        },
        data: {
          direcaoId: params.direcaoDestinoId,
          estado: "TRANSFERIDO",
          alteradoPorId: params.utilizadorId,
        },
      });

      if (resultado.count !== 1) {
        throw new Error(
          "O bem foi alterado por outro utilizador durante a transferência. Actualize os dados e tente novamente.",
        );
      }

      const bemActualizado = await tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
        },
        include: {
          direcao: true,
        },
      });

      if (!bemActualizado) {
        throw new BemNaoEncontradoError(
          "Bem não encontrado após transferência.",
        );
      }

      const movimentoData: Prisma.BemMovimentoCreateInput = {
        bem: {
          connect: {
            id: params.bemId,
          },
        },
        tipo: "TRANSFERENCIA",
        descricao: `Transferência de ${
          bem.direcao?.nome ?? "sem direcção"
        } para ${direcaoDestino.nome}.`,
        utilizadorId: params.utilizadorId,
      };

      if (bem.direcaoId) {
        movimentoData.direcaoOrigemId = bem.direcaoId;
      }

      movimentoData.direcaoDestinoId =
        params.direcaoDestinoId;

      if (params.observacao) {
        movimentoData.observacao = params.observacao;
      }

      await tx.bemMovimento.create({
        data: movimentoData,
      });

      await tx.bemHistorico.create({
        data: {
          bemId: params.bemId,
          tipo: "TRANSFERENCIA",
          descricao: `Bem transferido de ${
            bem.direcao?.nome ?? "sem direcção"
          } para ${direcaoDestino.nome}. ${
            params.observacao ?? ""
          }`,
          utilizadorId: params.utilizadorId,
        },
      });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "TRANSFERIR_BEM",
        entidade: "Bem",
        entidadeId: params.bemId,
        detalhes: {
          direcaoOrigemId: bem.direcaoId,
          direcaoOrigemNome:
            bem.direcao?.nome ?? null,
          direcaoDestinoId: direcaoDestino.id,
          direcaoDestinoNome: direcaoDestino.nome,
          observacao: params.observacao ?? null,
        } as Prisma.InputJsonValue,
      });

      return enriquecerUrls(bemActualizado);
    },
  );
}

export async function abaterBem(params: {
  bemId: string;
  motivo: string;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const bem = await tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
        },
      });

      if (!bem) {
        throw new BemNaoEncontradoError(
          "Bem não encontrado.",
        );
      }

      if (bem.estado === "ABATIDO") {
        throw new BemJaAbatidoError(
          "O bem já se encontra abatido.",
        );
      }

      /*
       * Compare-and-swap:
       *
       * Só abate se o bem ainda não estiver abatido.
       * Se outra transacção o abater primeiro, count será 0.
       */
      const resultado = await tx.bem.updateMany({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
          estado: {
            not: "ABATIDO",
          },
        },
        data: {
          estado: "ABATIDO",
          alteradoPorId: params.utilizadorId,
        },
      });

      if (resultado.count !== 1) {
        throw new BemJaAbatidoError(
          "O bem foi abatido ou alterado por outro utilizador.",
        );
      }

      await tx.bemMovimento.create({
        data: {
          bem: {
            connect: {
              id: params.bemId,
            },
          },
          tipo: "ABATIMENTO",
          descricao: `Abatimento do bem: ${params.motivo}`,
          utilizadorId: params.utilizadorId,
        },
      });

      await tx.bemHistorico.create({
        data: {
          bemId: params.bemId,
          tipo: "ABATIMENTO",
          descricao: `Bem abatido. Motivo: ${params.motivo}`,
          utilizadorId: params.utilizadorId,
        },
      });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "ABATER_BEM",
        entidade: "Bem",
        entidadeId: params.bemId,
        detalhes: {
          estadoAnterior: bem.estado,
          estadoNovo: "ABATIDO",
          motivo: params.motivo,
        } as Prisma.InputJsonValue,
      });

      return tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
        },
      });
    },
  );
}

export async function adicionarFachada(params: {
  bemId: string;
  direcao: string;
  imagemBuffer?: Buffer;
  descricao?: string;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const bem = await tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
        },
      });

      if (!bem) {
        throw new BemNaoEncontradoError(
          "Bem não encontrado.",
        );
      }

      const existente = await tx.bemFachada.findUnique({
        where: {
          bemId_direcao: {
            bemId: params.bemId,
            direcao: params.direcao,
          },
        },
      });

      if (existente) {
        throw new FachadaDuplicadaError(
          `Já existe fachada ${params.direcao} para este bem.`,
        );
      }

      const createData: Prisma.BemFachadaCreateInput = {
        bem: {
          connect: {
            id: params.bemId,
          },
        },
        direcao: params.direcao,
      };

      if (params.imagemBuffer) {
        const upload = await uploadImagem({
          buffer: params.imagemBuffer,
          prefixo: `patrimonio/${params.municipioId}/fachadas`,
          nomeOriginal: `fachada-${params.direcao}.jpg`,
        });

        createData.imagemUrl = upload.storageKey;
      }

      if (params.descricao) {
        createData.descricao = params.descricao;
      }

      let fachada;

      try {
        fachada = await tx.bemFachada.create({
          data: createData,
        });
      } catch (error) {

        if (
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new FachadaDuplicadaError(
            `Já existe fachada ${params.direcao} para este bem.`,
          );
        }

        throw error;
      }

      await tx.bemHistorico.create({
        data: {
          bemId: params.bemId,
          tipo: "EDICAO",
          descricao: `Fachada ${params.direcao} adicionada.`,
          utilizadorId: params.utilizadorId,
        },
      });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "ADICIONAR_FACHADA",
        entidade: "BemFachada",
        entidadeId: fachada.id,
        detalhes: {
          bemId: params.bemId,
          direcao: params.direcao,
          descricao: params.descricao ?? null,
          possuiImagem: Boolean(params.imagemBuffer),
        } as Prisma.InputJsonValue,
      });

      const resultado: any = {
        ...fachada,
      };

      if (fachada.imagemUrl) {
        resultado.imagemUrl =
          await storageService.gerarUrlVisualizacao(
            fachada.imagemUrl,
            3600,
          );
      }

      return resultado;
    },
  );
}

export async function adicionarImagem(params: {
  bemId: string;
  imagemBuffer: Buffer;
  legenda?: string;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const bem = await tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
        },
      });

      if (!bem) {
        throw new BemNaoEncontradoError(
          "Bem não encontrado.",
        );
      }

      const upload = await uploadImagem({
        buffer: params.imagemBuffer,
        prefixo: `patrimonio/${params.municipioId}/imagens`,
        ...(params.legenda && {
          nomeOriginal: `${params.legenda}.jpg`,
        }),
      });

      const imagem = await tx.bemImagem.create({
        data: {
          bem: {
            connect: {
              id: params.bemId,
            },
          },
          url: upload.storageKey,
          ...(params.legenda && {
            legenda: params.legenda,
          }),
        },
      });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "ADICIONAR_IMAGEM",
        entidade: "BemImagem",
        entidadeId: imagem.id,
        detalhes: {
          bemId: params.bemId,
          legenda: params.legenda ?? null,
        } as Prisma.InputJsonValue,
      });

      return {
        ...imagem,
        url: upload.urlVisualizacao,
      };
    },
  );
}

export async function criarMovimento(params: {
  bemId: string;
  tipo: string;
  descricao: string;
  direcaoOrigemId?: string;
  direcaoDestinoId?: string;
  valor?: number;
  observacao?: string;
  utilizadorId: string;
  municipioId: string;
}) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const bem = await tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
        },
      });

      if (!bem) {
        throw new BemNaoEncontradoError(
          "Bem não encontrado.",
        );
      }

      const data: Prisma.BemMovimentoCreateInput = {
        bem: {
          connect: {
            id: params.bemId,
          },
        },
        tipo: params.tipo as any,
        descricao: params.descricao,
        utilizadorId: params.utilizadorId,
      };

      if (params.direcaoOrigemId) {
        data.direcaoOrigemId =
          params.direcaoOrigemId;
      }

      if (params.direcaoDestinoId) {
        data.direcaoDestinoId =
          params.direcaoDestinoId;
      }

      if (params.valor !== undefined) {
        data.valor = params.valor;
      }

      if (params.observacao) {
        data.observacao = params.observacao;
      }

      const movimento =
        await tx.bemMovimento.create({
          data,
        });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "CRIAR_MOVIMENTO_BEM",
        entidade: "BemMovimento",
        entidadeId: movimento.id,
        detalhes: {
          bemId: params.bemId,
          tipo: params.tipo,
          descricao: params.descricao,
          direcaoOrigemId:
            params.direcaoOrigemId ?? null,
          direcaoDestinoId:
            params.direcaoDestinoId ?? null,
          valor: params.valor ?? null,
          observacao: params.observacao ?? null,
        } as Prisma.InputJsonValue,
      });

      return movimento;
    },
  );
}

export async function actualizarRegularizacaoJuridica(
  params: {
    bemId: string;
    dados: {
      situacaoJuridica: string;
      estadoOcupacao: string;
      historicoDocumental?: string;
      alertaIrregularidade?: boolean;
      processos?: any[];
    };
    utilizadorId: string;
    municipioId: string;
  },
) {
  return withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const bem = await tx.bem.findFirst({
        where: {
          id: params.bemId,
          municipioId: params.municipioId,
          categoria: {
            in: [
              "IMOVEL_DOMINIO_PUBLICO",
              "IMOVEL_DOMINIO_PRIVADO",
            ],
          },
        },
      });

      if (!bem) {
        throw new BemNaoEncontradoError(
          "Bem imóvel não encontrado.",
        );
      }

      const createData: Prisma.BemRegularizacaoJuridicaCreateInput =
        {
          bem: {
            connect: {
              id: params.bemId,
            },
          },
          situacaoJuridica:
            params.dados.situacaoJuridica as any,
          estadoOcupacao:
            params.dados.estadoOcupacao as any,
        };

      if (params.dados.historicoDocumental) {
        createData.historicoDocumental =
          params.dados.historicoDocumental;
      }

      if (
        params.dados.alertaIrregularidade !==
        undefined
      ) {
        createData.alertaIrregularidade =
          params.dados.alertaIrregularidade;
      }

      if (params.dados.processos) {
        createData.processos =
          params.dados.processos as any;
      }

      const updateData: Prisma.BemRegularizacaoJuridicaUpdateInput =
        {
          situacaoJuridica:
            params.dados.situacaoJuridica as any,
          estadoOcupacao:
            params.dados.estadoOcupacao as any,
        };

      if (params.dados.historicoDocumental) {
        updateData.historicoDocumental =
          params.dados.historicoDocumental;
      }

      if (
        params.dados.alertaIrregularidade !==
        undefined
      ) {
        updateData.alertaIrregularidade =
          params.dados.alertaIrregularidade;
      }

      if (params.dados.processos) {
        updateData.processos =
          params.dados.processos as any;
      }

      const reg =
        await tx.bemRegularizacaoJuridica.upsert({
          where: {
            bemId: params.bemId,
          },
          create: createData,
          update: updateData,
        });

      await tx.bemHistorico.create({
        data: {
          bemId: params.bemId,
          tipo: "REGULARIZACAO_JURIDICA",
          descricao: `Regularização jurídica actualizada: ${params.dados.situacaoJuridica}. Ocupação: ${params.dados.estadoOcupacao}.`,
          utilizadorId: params.utilizadorId,
        },
      });

      await registarAuditoria(tx, {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "ACTUALIZAR_REGULARIZACAO_JURIDICA",
        entidade: "BemRegularizacaoJuridica",
        entidadeId: reg.id,
        detalhes: {
          bemId: params.bemId,
          situacaoJuridica:
            params.dados.situacaoJuridica,
          estadoOcupacao:
            params.dados.estadoOcupacao,
          historicoDocumental:
            params.dados.historicoDocumental ??
            null,
          alertaIrregularidade:
            params.dados.alertaIrregularidade ??
            null,
          processos:
            params.dados.processos ?? null,
        } as Prisma.InputJsonValue,
      });

      return reg;
    },
  );
}

export async function obterAlertasIrregularidade(
  municipioId: string,
) {
  return prisma.bemRegularizacaoJuridica.findMany({
    where: {
      alertaIrregularidade: true,
      bem: {
        municipioId,
      },
    },
    include: {
      bem: {
        select: {
          id: true,
          designacao: true,
          localizacao: true,
          categoria: true,
        },
      },
    },
    orderBy: {
      alteradoEm: "desc",
    },
  });
}