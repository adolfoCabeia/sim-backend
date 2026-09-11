import type { Prisma } from "../../../generated/prisma/client.js";
import { withTenantTransaction } from "../../../config/prisma.js";
import type { CriarCentroInput, AtualizarCentroInput, ListarCentrosQuery } from "./centro.schema.js";

export class CentroNaoEncontradoError extends Error {}
export class OcupacaoExcedeCapacidadeError extends Error {}

function validarOcupacao(ocupacao: number | undefined, capacidade: number | null | undefined) {
  if (ocupacao !== undefined && capacidade != null && ocupacao > capacidade) {
    throw new OcupacaoExcedeCapacidadeError(`A ocupação (${ocupacao}) não pode exceder a capacidade máxima (${capacidade}).`);
  }
}

export async function criarCentro(params: { municipioId: string; input: CriarCentroInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    return tx.centroAcolhimento.create({
      data: {
        municipioId: params.municipioId,
        departamentoId: params.input.departamentoId,
        nome: params.input.nome,
        tipo: params.input.tipo,
        bairro: params.input.bairro,
        estado: "ATIVO",
        ...(params.input.endereco !== undefined && { endereco: params.input.endereco }),
        ...(params.input.latitude !== undefined && { latitude: params.input.latitude }),
        ...(params.input.longitude !== undefined && { longitude: params.input.longitude }),
        ...(params.input.capacidadeMaxima !== undefined && { capacidadeMaxima: params.input.capacidadeMaxima }),
        ...(params.input.responsavelNome !== undefined && { responsavelNome: params.input.responsavelNome }),
        ...(params.input.responsavelContacto !== undefined && { responsavelContacto: params.input.responsavelContacto }),
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
      },
    });
  });
}

async function obterCentroOuFalhar(tx: Prisma.TransactionClient, id: string) {
  const centro = await tx.centroAcolhimento.findUnique({ where: { id } });
  if (!centro) throw new CentroNaoEncontradoError("Centro não encontrado.");
  return centro;
}

export async function obterCentro(params: { municipioId: string; id: string }) {
  return withTenantTransaction(params.municipioId, (tx) => obterCentroOuFalhar(tx, params.id));
}

export async function atualizarCentro(params: { municipioId: string; id: string; input: AtualizarCentroInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const centro = await obterCentroOuFalhar(tx, params.id);
    const capacidadeFinal = params.input.capacidadeMaxima ?? centro.capacidadeMaxima;
    validarOcupacao(params.input.ocupacaoAtual, capacidadeFinal);

    return tx.centroAcolhimento.update({
      where: { id: params.id },
      data: {
        ...(params.input.departamentoId !== undefined && { departamentoId: params.input.departamentoId }),
        ...(params.input.nome !== undefined && { nome: params.input.nome }),
        ...(params.input.tipo !== undefined && { tipo: params.input.tipo }),
        ...(params.input.bairro !== undefined && { bairro: params.input.bairro }),
        ...(params.input.endereco !== undefined && { endereco: params.input.endereco }),
        ...(params.input.latitude !== undefined && { latitude: params.input.latitude }),
        ...(params.input.longitude !== undefined && { longitude: params.input.longitude }),
        ...(params.input.capacidadeMaxima !== undefined && { capacidadeMaxima: params.input.capacidadeMaxima }),
        ...(params.input.ocupacaoAtual !== undefined && { ocupacaoAtual: params.input.ocupacaoAtual }),
        ...(params.input.responsavelNome !== undefined && { responsavelNome: params.input.responsavelNome }),
        ...(params.input.responsavelContacto !== undefined && { responsavelContacto: params.input.responsavelContacto }),
        ...(params.input.estado !== undefined && { estado: params.input.estado }),
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
      },
    });
  });
}

export async function listarCentros(params: { municipioId: string; query: ListarCentrosQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.CentroAcolhimentoWhereInput = {
      ...(params.query.departamentoId !== undefined && { departamentoId: params.query.departamentoId }),
      ...(params.query.tipo !== undefined && { tipo: params.query.tipo }),
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
    };
    const [items, total] = await Promise.all([
      tx.centroAcolhimento.findMany({
        where,
        orderBy: { nome: "asc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.centroAcolhimento.count({ where }),
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