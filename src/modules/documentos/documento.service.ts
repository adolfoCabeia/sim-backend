/**
 * Arquivo Digital (secção 8.1 do documento técnico) — "substitui o
 * funcionamento tradicional (papel, presença física)". Antes desta
 * alteração, o modelo `Documento` existia no schema mas nenhum módulo o
 * usava (dead model), não tinha `municipioId` (logo, sem RLS possível), e
 * não havia nenhum conceito de pasta — não era possível ao utilizador
 * organizar o que ia digitalizando.
 *
 * ISOLAMENTO MULTI-TENANT: `pastas` e `documentos` têm RLS por
 * "municipioId" — `municipioId` é obrigatório em todas as funções.
 */

import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import {
  uploadDocumento,
  gerarUrlVisualizacao,
  eliminarDocumento,
  TipoFicheiroInvalidoError,
} from "../storage/storage.service.js";
import type { CriarPastaInput, AtualizarPastaInput, AtualizarDocumentoInput } from "./documento.schema.js";

export class PastaNaoEncontradaError extends Error {}
export class DocumentoNaoEncontradoError extends Error {}
const MAX_FILE_SIZE = 7 * 1024 * 1024;
const MIME_TIPOS_ACEITES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

export async function criarPasta(municipioId: string, criadoPorId: string, dados: CriarPastaInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    if (dados.pastaPaiId) {
      await tx.pasta.findUniqueOrThrow({ where: { id: dados.pastaPaiId } });
    }
    return tx.pasta.create({
      data: {
        municipioId,
        nome: dados.nome,
        criadoPorId,
        ...(dados.pastaPaiId !== undefined && { pastaPaiId: dados.pastaPaiId }),
        ...(dados.direcaoId !== undefined && { direcaoId: dados.direcaoId }),
      },
    });
  });
}

export async function listarPastas(params: {
  municipioId: string;
  pastaPaiId?: string | undefined;
  direcaoId?: string | undefined;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    return tx.pasta.findMany({
      where: {
        pastaPaiId: params.pastaPaiId ?? null,
        ...(params.direcaoId && { direcaoId: params.direcaoId }),
      },
      orderBy: { nome: "asc" },
      include: { _count: { select: { subPastas: true, documentos: true } } },
    });
  });
}

export async function obterPasta(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.pasta.findUnique({
      where: { id },
      include: {
        subPastas: { orderBy: { nome: "asc" } },
        documentos: { orderBy: { criadoEm: "desc" } },
      },
    });
  });
}

export async function atualizarPasta(id: string, municipioId: string, dados: AtualizarPastaInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.pasta.findUniqueOrThrow({ where: { id } });
    return tx.pasta.update({
      where: { id },
      data: { ...(dados.nome !== undefined && { nome: dados.nome }) },
    });
  });
}

/** Remove a pasta — sub-pastas seguem em cascata; documentos ficam soltos (pastaId → null), nunca apagados. */
export async function removerPasta(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.pasta.findUniqueOrThrow({ where: { id } });
    await tx.documento.updateMany({ where: { pastaId: id }, data: { pastaId: null } });
    return tx.pasta.delete({ where: { id } });
  });
}

// ─── Documentos ───

export async function uploadDocumentoParaPasta(params: {
  municipioId: string;
  utilizadorId: string;
  pastaId?: string | undefined;
  direcaoId?: string | undefined;
  descricao?: string | undefined;
  buffer: Buffer;
  nomeOriginal: string;
}) {
  if (params.buffer.length > MAX_FILE_SIZE) {
    throw new TipoFicheiroInvalidoError("Ficheiro excede o tamanho máximo permitido (7 MB).");
  }
  return withTenantTransaction(params.municipioId, async (tx) => {
    if (params.pastaId) {
      await tx.pasta.findUniqueOrThrow({ where: { id: params.pastaId } });
    }

    const upload = await uploadDocumento({
      buffer: params.buffer,
      prefixo: `arquivo-digital/${params.municipioId}`,
      nomeOriginal: params.nomeOriginal,
      mimeTiposAceites: MIME_TIPOS_ACEITES,
    });

    return tx.documento.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        nome: upload.nomeOriginal,
        storageKey: upload.storageKey,
        nomeOriginal: upload.nomeOriginal,
        tipo: upload.mimeType,
        ...(params.pastaId !== undefined && { pastaId: params.pastaId }),
        ...(params.direcaoId !== undefined && { direcaoId: params.direcaoId }),
        ...(params.descricao !== undefined && { descricao: params.descricao }),
      },
    });
  });
}

export async function listarDocumentos(
  filtros: { municipioId: string; pastaId?: string | undefined },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.DocumentoWhereInput = {
    pastaId: filtros.pastaId ?? null,
  };

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.documento.findMany({ where, skip, take: paginacao.limit, orderBy: { criadoEm: "desc" } }),
      tx.documento.count({ where }),
    ]);
    return { data, total };
  });
}

export async function obterDocumento(id: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.documento.findUnique({ where: { id } });
  });
}

export async function obterUrlVisualizacao(id: string, municipioId: string): Promise<string> {
  const documento = await obterDocumento(id, municipioId);
  if (!documento) throw new DocumentoNaoEncontradoError("Documento não encontrado.");
  return gerarUrlVisualizacao(documento.storageKey);
}

export async function atualizarDocumento(id: string, municipioId: string, dados: AtualizarDocumentoInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.documento.findUniqueOrThrow({ where: { id } });
    if (dados.pastaId) {
      await tx.pasta.findUniqueOrThrow({ where: { id: dados.pastaId } });
    }
    return tx.documento.update({
      where: { id },
      data: {
        ...(dados.nome !== undefined && { nome: dados.nome }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
        ...(dados.pastaId !== undefined && { pastaId: dados.pastaId }),
      },
    });
  });
}

export async function removerDocumento(id: string, municipioId: string) {
  const documento = await withTenantTransaction(municipioId, async (tx) => {
    const doc = await tx.documento.findUniqueOrThrow({ where: { id } });
    await tx.documento.delete({ where: { id } });
    return doc;
  });

  // Remove do MinIO só depois de confirmar que o registo na BD foi
  // apagado — evita ficar com o registo órfão se o storage falhar a meio.
  await eliminarDocumento(documento.storageKey).catch(() => {
    // Ficheiro órfão no bucket não é crítico (não há fuga de dados — só
    // desperdício de espaço); a remoção do registo é o que importa aqui.
  });

  return documento;
}