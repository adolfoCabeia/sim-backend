/**
 * Biblioteca Jurídica Digital (secção 10.1 do documento técnico) —
 * "legislação municipal, posturas municipais, regulamento de taxas,
 * plano director municipal, contencioso e activo, Diário da República,
 * decretos presidenciais, despachos ministeriais... indexados e
 * pesquisáveis". ANTES DESTA ALTERAÇÃO: não existia nada disto — só o
 * perfil `DIRECTOR_JURIDICO`/`ASSESSOR_JURIDICO`, sem nenhum acervo.
 *
 * Reaproveita o Arquivo Digital (`Documento`, módulo `documentos`) para
 * o ficheiro em si — o upload do PDF do diploma faz-se por
 * `POST /documentos`, e o `documentoId` resultante é referenciado aqui.
 * A pesquisa livre (`q`) é `contains` (case-insensitive) sobre
 * título/número — não é full-text search (sem extensão pg_trgm/tsvector
 * configurada); suficiente para um acervo de ~200 diplomas, mas não
 * escala indefinidamente.
 */

import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import type { CriarDiplomaInput, AtualizarDiplomaInput } from "./biblioteca.schema.js";

export async function criarDiploma(municipioId: string, criadoPorId: string, dados: CriarDiplomaInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    if (dados.documentoId) {
      await tx.documento.findUniqueOrThrow({ where: { id: dados.documentoId } });
    }
    return tx.diplomaLegal.create({
      data: {
        municipioId,
        criadoPorId,
        categoria: dados.categoria,
        titulo: dados.titulo,
        ...(dados.numero !== undefined && { numero: dados.numero }),
        ...(dados.dataPublicacao !== undefined && dados.dataPublicacao !== null && { dataPublicacao: new Date(dados.dataPublicacao) }),
        ...(dados.documentoId !== undefined && { documentoId: dados.documentoId }),
      },
    });
  });
}

export async function pesquisarDiplomas(
  filtros: {
    municipioId: string;
    q?: string | undefined;
    categoria?: string | undefined;
    estado?: string | undefined;
  },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.DiplomaLegalWhereInput = {
    ...(filtros.categoria && { categoria: filtros.categoria as Prisma.EnumCategoriaDiplomaLegalFilter<"DiplomaLegal"> }),
    ...(filtros.estado && { estado: filtros.estado as Prisma.EnumEstadoDiplomaLegalFilter<"DiplomaLegal"> }),
    ...(filtros.q && {
      OR: [
        { titulo: { contains: filtros.q, mode: "insensitive" } },
        { numero: { contains: filtros.q, mode: "insensitive" } },
      ],
    }),
  };

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.diplomaLegal.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { dataPublicacao: "desc" },
        include: { documento: { select: { id: true, storageKey: true, nomeOriginal: true } } },
      }),
      tx.diplomaLegal.count({ where }),
    ]);
    return { data, total };
  });
}

export async function obterDiploma(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.diplomaLegal.findUnique({
      where: { id },
      include: { documento: true },
    });
  });
}

export async function atualizarDiploma(id: string, municipioId: string, dados: AtualizarDiplomaInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.diplomaLegal.findUniqueOrThrow({ where: { id } });
    if (dados.documentoId) {
      await tx.documento.findUniqueOrThrow({ where: { id: dados.documentoId } });
    }

    return tx.diplomaLegal.update({
      where: { id },
      data: {
        ...(dados.categoria !== undefined && { categoria: dados.categoria }),
        ...(dados.titulo !== undefined && { titulo: dados.titulo }),
        ...(dados.numero !== undefined && { numero: dados.numero }),
        ...(dados.estado !== undefined && { estado: dados.estado }),
        ...(dados.documentoId !== undefined && { documentoId: dados.documentoId }),
        ...(dados.dataPublicacao !== undefined && dados.dataPublicacao !== null && { dataPublicacao: new Date(dados.dataPublicacao) }),
      },
    });
  });
}

export async function removerDiploma(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.diplomaLegal.findUniqueOrThrow({ where: { id } });
    return tx.diplomaLegal.delete({ where: { id } });
  });
}