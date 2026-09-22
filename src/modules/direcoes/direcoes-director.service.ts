import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { DirecaoNaoEncontradaError } from "./direcoes.errors.js";

/** O utilizador indicado não pode ser director desta direcção (pertence a outra, está inactivo, etc.). */
export class DirectorInvalidoError extends Error { }

const SELECT_DIRECTOR = { id: true, nomeCompleto: true, email: true, funcao: true } as const;

/**
 * Funcionários que podem ser escolhidos como director: só utilizadores INTERNOS e ACTIVOS
 * que PERTENCEM a esta direcção. É a lista que a UI mostra para "escolher o superior".
 */
export async function listarCandidatosADirector(params: {
  direcaoId: string;
  municipioId: string;
  search?: string;
}) {
  const direcao = await prisma.direcao.findFirst({
    where: { id: params.direcaoId, municipioId: params.municipioId },
    select: { id: true, directorId: true },
  });
  if (!direcao) throw new DirecaoNaoEncontradaError("Direção não encontrada.");

  const termo = params.search?.trim();
  const utilizadores = await prisma.utilizador.findMany({
    where: {
      municipioId: params.municipioId,
      direcaoId: direcao.id,
      estado: "ACTIVA",
      tipoConta: "INTERNO",
      ...(termo
        ? {
            OR: [
              { nomeCompleto: { contains: termo, mode: "insensitive" } },
              { email: { contains: termo, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { nomeCompleto: "asc" },
    take: 50,
    select: SELECT_DIRECTOR,
  });

  return {
    directorActualId: direcao.directorId,
    items: utilizadores.map((u) => ({ ...u, ehDirectorActual: u.id === direcao.directorId })),
  };
}

/**
 * Define (ou remove, com `utilizadorId = null`) o director de uma direcção.
 *
 * Regras que a base de dados sozinha não garante:
 *  - o director tem de pertencer a ESTA direcção, estar activo e ser conta interna;
 *  - cada utilizador dirige, no máximo, uma direcção (directorId é único).
 *
 * `responsavel` (texto livre, legado) é mantido em sincronia para os ecrãs antigos
 * continuarem a mostrar o nome certo.
 */
export async function definirDirector(params: {
  direcaoId: string;
  municipioId: string;
  utilizadorId: string | null;
  executorId: string;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const direcao = await tx.direcao.findFirst({
        where: { id: params.direcaoId, municipioId: params.municipioId },
        select: { id: true, directorId: true },
      });
      if (!direcao) throw new DirecaoNaoEncontradaError("Direção não encontrada.");

      let nomeDirector: string | undefined;
      if (params.utilizadorId !== null) {
        const utilizador = await tx.utilizador.findFirst({
          where: { id: params.utilizadorId, municipioId: params.municipioId },
          select: { id: true, nomeCompleto: true, direcaoId: true, estado: true, tipoConta: true },
        });
        if (!utilizador) {
          throw new DirectorInvalidoError("O utilizador indicado não existe neste município.");
        }
        if (utilizador.direcaoId !== direcao.id) {
          throw new DirectorInvalidoError("O director tem de pertencer a esta direcção.");
        }
        if (utilizador.estado !== "ACTIVA" || utilizador.tipoConta !== "INTERNO") {
          throw new DirectorInvalidoError("O director tem de ser um funcionário interno com a conta activa.");
        }
        nomeDirector = utilizador.nomeCompleto;
      }

      const actualizada = await tx.direcao.update({
        where: { id: direcao.id },
        data: {
          directorId: params.utilizadorId,
          ...(nomeDirector !== undefined ? { responsavel: nomeDirector } : {}),
        },
        select: {
          id: true,
          nome: true,
          sigla: true,
          directorId: true,
          director: { select: SELECT_DIRECTOR },
        },
      });

      // Quem manda no circuito dos processos muda: fica registado.
      await tx.logAuditoria.create({
        data: {
          municipioId: params.municipioId,
          utilizadorId: params.executorId,
          accao: "DEFINIR_DIRECTOR_DIRECCAO",
          entidade: "Direcao",
          detalhes: {
            direcaoId: direcao.id,
            directorAnteriorId: direcao.directorId,
            directorNovoId: params.utilizadorId,
          },
        },
      });

      return actualizada;
    });
  } catch (error) {
    // Único: um utilizador que ainda consta como director de outra direcção.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DirectorInvalidoError("Este utilizador já é director de outra direcção.");
    }
    throw error;
  }
}