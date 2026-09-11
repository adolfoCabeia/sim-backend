import type { Prisma } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import type {
  CriarContactoInput,
  EditarContactoInput,
  ListarContactosQuery,
  ListarContactosPublicoQuery,
} from "./contacto.schema.js";

/**
 * Portal Administrativo (secção 16.2) — "Gestão de Contactos Institucionais
 * (registo de contactos telefónicos e e-mails, directório institucional,
 * comunicação entre utilizadores e instituições)."
 */

export class ContactoNaoEncontradoError extends Error {}
export class DirecaoNaoEncontradaError extends Error {}

export async function criarContacto(params: {
  municipioId: string;
  executorId: string;
  input: CriarContactoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    let direcaoId: string | undefined;
    if (params.input.direcaoSigla) {
      const direcao = await tx.direcao.findUnique({
        where: { municipioId_sigla: { municipioId: params.municipioId, sigla: params.input.direcaoSigla } },
        select: { id: true },
      });
      if (!direcao) {
        throw new DirecaoNaoEncontradaError(`A direcção "${params.input.direcaoSigla}" não existe neste município.`);
      }
      direcaoId = direcao.id;
    }

    return tx.contactoInstitucional.create({
      data: {
        municipioId: params.municipioId,
        tipo: params.input.tipo,
        nome: params.input.nome,
        visivelPublico: params.input.visivelPublico,
        criadoPorId: params.executorId,
        ...(direcaoId !== undefined && { direcaoId }),
        ...(params.input.cargo !== undefined && { cargo: params.input.cargo }),
        ...(params.input.instituicao !== undefined && { instituicao: params.input.instituicao }),
        ...(params.input.telefone !== undefined && { telefone: params.input.telefone }),
        ...(params.input.email !== undefined && { email: params.input.email }),
        ...(params.input.endereco !== undefined && { endereco: params.input.endereco }),
        ...(params.input.notas !== undefined && { notas: params.input.notas }),
      },
    });
  });
}

async function obterContactoOuFalhar(tx: Prisma.TransactionClient, id: string) {
  const contacto = await tx.contactoInstitucional.findUnique({ where: { id } });
  if (!contacto) {
    throw new ContactoNaoEncontradoError("Contacto institucional não encontrado.");
  }
  return contacto;
}

export async function editarContacto(params: { municipioId: string; contactoId: string; input: EditarContactoInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterContactoOuFalhar(tx, params.contactoId);
    return tx.contactoInstitucional.update({
      where: { id: params.contactoId },
      data: {
        ...(params.input.nome !== undefined && { nome: params.input.nome }),
        ...(params.input.cargo !== undefined && { cargo: params.input.cargo }),
        ...(params.input.instituicao !== undefined && { instituicao: params.input.instituicao }),
        ...(params.input.telefone !== undefined && { telefone: params.input.telefone }),
        ...(params.input.email !== undefined && { email: params.input.email }),
        ...(params.input.endereco !== undefined && { endereco: params.input.endereco }),
        ...(params.input.notas !== undefined && { notas: params.input.notas }),
        ...(params.input.visivelPublico !== undefined && { visivelPublico: params.input.visivelPublico }),
      },
    });
  });
}

export async function eliminarContacto(params: { municipioId: string; contactoId: string }): Promise<void> {
  await withTenantTransaction(params.municipioId, async (tx) => {
    await obterContactoOuFalhar(tx, params.contactoId);
    await tx.contactoInstitucional.delete({ where: { id: params.contactoId } });
  });
}

export async function listarContactosAdmin(params: { municipioId: string; query: ListarContactosQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.ContactoInstitucionalWhereInput = {
      ...(params.query.tipo !== undefined && { tipo: params.query.tipo }),
      ...(params.query.pesquisa !== undefined && {
        OR: [
          { nome: { contains: params.query.pesquisa, mode: "insensitive" } },
          { instituicao: { contains: params.query.pesquisa, mode: "insensitive" } },
          { email: { contains: params.query.pesquisa, mode: "insensitive" } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      tx.contactoInstitucional.findMany({
        where,
        orderBy: { nome: "asc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        include: { direcao: { select: { id: true, nome: true, sigla: true } } },
      }),
      tx.contactoInstitucional.count({ where }),
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

/** Directório público — só os contactos marcados como `visivelPublico: true`. */
export async function listarContactosPublico(params: { municipioId: string; query: ListarContactosPublicoQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.ContactoInstitucionalWhereInput = {
      visivelPublico: true,
      ...(params.query.pesquisa !== undefined && {
        OR: [
          { nome: { contains: params.query.pesquisa, mode: "insensitive" } },
          { instituicao: { contains: params.query.pesquisa, mode: "insensitive" } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      tx.contactoInstitucional.findMany({
        where,
        orderBy: { nome: "asc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        select: {
          id: true,
          tipo: true,
          nome: true,
          cargo: true,
          instituicao: true,
          telefone: true,
          email: true,
          endereco: true,
          direcao: { select: { nome: true, sigla: true } },
        },
      }),
      tx.contactoInstitucional.count({ where }),
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
