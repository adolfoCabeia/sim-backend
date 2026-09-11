import type { Prisma } from "../../../generated/prisma/client.js";
import { withTenantTransaction } from "../../../config/prisma.js";
import type {
  CriarZonaSensivelInput,
  CriarBeneficiarioInput,
  AtualizarBeneficiarioInput,
  ListarBeneficiariosQuery,
} from "./beneficiario.schema.js";

export class BeneficiarioNaoEncontradoError extends Error {}
export class ZonaSensivelNaoEncontradaError extends Error {}

// --- Zonas sensíveis ---

export async function criarZonaSensivel(params: { municipioId: string; input: CriarZonaSensivelInput }) {
  return withTenantTransaction(params.municipioId, (tx) =>
    tx.zonaSensivel.create({
      data: {
        municipioId: params.municipioId,
        bairro: params.input.bairro,
        nivelRisco: params.input.nivelRisco,
        ...(params.input.latitude !== undefined && { latitude: params.input.latitude }),
        ...(params.input.longitude !== undefined && { longitude: params.input.longitude }),
        ...(params.input.descricao !== undefined && { descricao: params.input.descricao }),
      },
    })
  );
}

export async function listarZonasSensiveis(params: { municipioId: string }) {
  return withTenantTransaction(params.municipioId, (tx) =>
    tx.zonaSensivel.findMany({ orderBy: { bairro: "asc" } })
  );
}

// --- Beneficiários ---

export async function criarBeneficiario(params: { municipioId: string; input: CriarBeneficiarioInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    if (params.input.zonaSensivelId) {
      const zona = await tx.zonaSensivel.findUnique({ where: { id: params.input.zonaSensivelId } });
      if (!zona) throw new ZonaSensivelNaoEncontradaError("Zona sensível indicada não existe.");
    }

    return tx.beneficiario.create({
      data: {
        municipioId: params.municipioId,
        nome: params.input.nome,
        bairro: params.input.bairro,
        criancasSemRegistoCivil: params.input.criancasSemRegistoCivil,
        ...(params.input.contacto !== undefined && { contacto: params.input.contacto }),
        ...(params.input.numeroMembrosAgregado !== undefined && { numeroMembrosAgregado: params.input.numeroMembrosAgregado }),
        ...(params.input.zonaSensivelId !== undefined && { zonaSensivelId: params.input.zonaSensivelId }),
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
      },
    });
  });
}

async function obterBeneficiarioOuFalhar(tx: Prisma.TransactionClient, id: string) {
  const beneficiario = await tx.beneficiario.findUnique({ where: { id }, include: { zonaSensivel: true } });
  if (!beneficiario) throw new BeneficiarioNaoEncontradoError("Beneficiário não encontrado.");
  return beneficiario;
}

export async function obterBeneficiario(params: { municipioId: string; id: string }) {
  return withTenantTransaction(params.municipioId, (tx) => obterBeneficiarioOuFalhar(tx, params.id));
}

export async function atualizarBeneficiario(params: { municipioId: string; id: string; input: AtualizarBeneficiarioInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterBeneficiarioOuFalhar(tx, params.id);

    return tx.beneficiario.update({
      where: { id: params.id },
      data: {
        ...(params.input.nome !== undefined && { nome: params.input.nome }),
        ...(params.input.bairro !== undefined && { bairro: params.input.bairro }),
        ...(params.input.contacto !== undefined && { contacto: params.input.contacto }),
        ...(params.input.numeroMembrosAgregado !== undefined && { numeroMembrosAgregado: params.input.numeroMembrosAgregado }),
        ...(params.input.zonaSensivelId !== undefined && { zonaSensivelId: params.input.zonaSensivelId }),
        ...(params.input.criancasSemRegistoCivil !== undefined && { criancasSemRegistoCivil: params.input.criancasSemRegistoCivil }),
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
        ...(params.input.ativo !== undefined && { ativo: params.input.ativo }),
      },
    });
  });
}

export async function listarBeneficiarios(params: { municipioId: string; query: ListarBeneficiariosQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.BeneficiarioWhereInput = {
      ...(params.query.bairro !== undefined && { bairro: { contains: params.query.bairro, mode: "insensitive" } }),
      ...(params.query.zonaSensivelId !== undefined && { zonaSensivelId: params.query.zonaSensivelId }),
      ...(params.query.ativo !== undefined && { ativo: params.query.ativo }),
      ...(params.query.pesquisa !== undefined && {
        OR: [
          { nome: { contains: params.query.pesquisa, mode: "insensitive" } },
          { bairro: { contains: params.query.pesquisa, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      tx.beneficiario.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        include: { zonaSensivel: { select: { id: true, bairro: true, nivelRisco: true } } },
      }),
      tx.beneficiario.count({ where }),
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