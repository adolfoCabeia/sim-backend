import type { Prisma } from "../../../generated/prisma/client.js";
import { withTenantTransaction } from "../../../config/prisma.js";
import type {
  CriarProgramaInput,
  AtualizarProgramaInput,
  InscreverParticipanteInput,
  ListarProgramasQuery,
} from "./programa.schema.js";

export class ProgramaNaoEncontradoError extends Error {}
export class BeneficiarioNaoEncontradoError extends Error {}
export class ParticipanteJaInscritoError extends Error {}

export async function criarPrograma(params: { municipioId: string; input: CriarProgramaInput }) {
  return withTenantTransaction(params.municipioId, (tx) =>
    tx.programaSocial.create({
      data: {
        municipioId: params.municipioId,
        nome: params.input.nome,
        tipo: params.input.tipo,
        dataInicio: new Date(params.input.dataInicio),
        estado: "ATIVO",
        ...(params.input.descricao !== undefined && { descricao: params.input.descricao }),
        ...(params.input.dataFim !== undefined && { dataFim: new Date(params.input.dataFim) }),
      },
    })
  );
}

async function obterProgramaOuFalhar(tx: Prisma.TransactionClient, id: string) {
  const programa = await tx.programaSocial.findUnique({
    where: { id },
    include: { participantes: { include: { beneficiario: true } } },
  });
  if (!programa) throw new ProgramaNaoEncontradoError("Programa não encontrado.");
  return programa;
}

export async function obterPrograma(params: { municipioId: string; id: string }) {
  return withTenantTransaction(params.municipioId, (tx) => obterProgramaOuFalhar(tx, params.id));
}

export async function atualizarPrograma(params: { municipioId: string; id: string; input: AtualizarProgramaInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterProgramaOuFalhar(tx, params.id);
    return tx.programaSocial.update({
      where: { id: params.id },
      data: {
        ...(params.input.nome !== undefined && { nome: params.input.nome }),
        ...(params.input.tipo !== undefined && { tipo: params.input.tipo }),
        ...(params.input.descricao !== undefined && { descricao: params.input.descricao }),
        ...(params.input.dataInicio !== undefined && { dataInicio: new Date(params.input.dataInicio) }),
        ...(params.input.dataFim !== undefined && { dataFim: new Date(params.input.dataFim) }),
        ...(params.input.estado !== undefined && { estado: params.input.estado }),
      },
    });
  });
}

export async function inscreverParticipante(params: { municipioId: string; programaId: string; input: InscreverParticipanteInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterProgramaOuFalhar(tx, params.programaId);

    const beneficiario = await tx.beneficiario.findUnique({ where: { id: params.input.beneficiarioId } });
    if (!beneficiario) throw new BeneficiarioNaoEncontradoError("Beneficiário não encontrado.");

    const jaInscrito = await tx.participanteProgramas.findUnique({
      where: { programaId_beneficiarioId: { programaId: params.programaId, beneficiarioId: params.input.beneficiarioId } },
    });
    if (jaInscrito) throw new ParticipanteJaInscritoError("Este beneficiário já está inscrito no programa.");

    return tx.participanteProgramas.create({
      data: {
        programaId: params.programaId,
        beneficiarioId: params.input.beneficiarioId,
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
      },
    });
  });
}

export async function removerParticipante(params: { municipioId: string; programaId: string; participanteId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterProgramaOuFalhar(tx, params.programaId);
    await tx.participanteProgramas.delete({ where: { id: params.participanteId } });
  });
}

export async function listarProgramas(params: { municipioId: string; query: ListarProgramasQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.ProgramaSocialWhereInput = {
      ...(params.query.tipo !== undefined && { tipo: params.query.tipo }),
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
    };
    const [items, total] = await Promise.all([
      tx.programaSocial.findMany({
        where,
        include: { _count: { select: { participantes: true } } },
        orderBy: { dataInicio: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.programaSocial.count({ where }),
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