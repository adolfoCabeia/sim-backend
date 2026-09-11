import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { CriarDepartamentoInput, AtualizarDepartamentoInput } from "./departamentos.schema.js";
import {
  DepartamentoNaoEncontradoError,
  DepartamentoDuplicadoError,
  DepartamentoComDependenciasError,
  DirecaoNaoEncontradaError,
} from "./departamentos.errors.js";

function traduzirErroDuplicado(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new DepartamentoDuplicadoError("Já existe um departamento com este nome nesta direção.");
  }
  throw error;
}

async function garantirDirecaoDoMunicipio(direcaoId: string, municipioId: string): Promise<void> {
  const direcao = await prisma.direcao.findFirst({ where: { id: direcaoId, municipioId }, select: { id: true } });
  if (!direcao) throw new DirecaoNaoEncontradaError("Direção não encontrada neste município.");
}

export async function criarDepartamento(params: { input: CriarDepartamentoInput; municipioId: string }) {
  await garantirDirecaoDoMunicipio(params.input.direcaoId, params.municipioId);

  try {
    return await prisma.departamento.create({
      data: {
        direcaoId: params.input.direcaoId,
        nome: params.input.nome,
        ...(params.input.descricao !== undefined && { descricao: params.input.descricao }),
      },
    });
  } catch (error) {
    traduzirErroDuplicado(error);
  }
}

export async function listarDepartamentos(params: {
  municipioId: string;
  page: number;
  pageSize: number;
  direcaoId?: string;
  search?: string;
}) {
  const where: Prisma.DepartamentoWhereInput = {
    direcao: { municipioId: params.municipioId },
    ...(params.direcaoId && { direcaoId: params.direcaoId }),
    ...(params.search && { nome: { contains: params.search, mode: "insensitive" } }),
  };

  const [items, total] = await Promise.all([
    prisma.departamento.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { _count: { select: { utilizadores: true } } },
    }),
    prisma.departamento.count({ where }),
  ]);

  return {
    items: items.map(({ _count, ...departamento }) => ({
      ...departamento,
      totalUtilizadores: _count.utilizadores,
    })),
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize) || 1,
  };
}

export async function listarDepartamentosDaDirecao(params: {
  direcaoId: string;
  municipioId: string;
  page: number;
  pageSize: number;
}) {
  await garantirDirecaoDoMunicipio(params.direcaoId, params.municipioId);
  return listarDepartamentos({
    municipioId: params.municipioId,
    page: params.page,
    pageSize: params.pageSize,
    direcaoId: params.direcaoId,
  });
}

export async function obterDepartamento(id: string, municipioId: string) {
  const departamento = await prisma.departamento.findFirst({
    where: { id, direcao: { municipioId } },
    include: {
      direcao: { select: { id: true, nome: true, sigla: true } },
      _count: { select: { utilizadores: true } },
    },
  });

  if (!departamento) throw new DepartamentoNaoEncontradoError("Departamento não encontrado.");
  return departamento;
}

export async function atualizarDepartamento(params: {
  id: string;
  municipioId: string;
  input: AtualizarDepartamentoInput;
}) {
  const existente = await prisma.departamento.findFirst({
    where: { id: params.id, direcao: { municipioId: params.municipioId } },
  });
  if (!existente) throw new DepartamentoNaoEncontradoError("Departamento não encontrado.");

  if (params.input.direcaoId && params.input.direcaoId !== existente.direcaoId) {
    await garantirDirecaoDoMunicipio(params.input.direcaoId, params.municipioId);
  }

  try {
    return await prisma.departamento.update({
      where: { id: params.id },
      data: {
        ...(params.input.nome !== undefined ? { nome: params.input.nome } : {}),
        ...(params.input.descricao !== undefined ? { descricao: params.input.descricao } : {}),
        ...(params.input.direcaoId !== undefined ? { direcaoId: params.input.direcaoId } : {}),
      },
    });
  } catch (error) {
    traduzirErroDuplicado(error);
  }
}

export async function eliminarDepartamento(id: string, municipioId: string) {
  const departamento = await prisma.departamento.findFirst({
    where: { id, direcao: { municipioId } },
    include: { _count: { select: { utilizadores: true } } },
  });

  if (!departamento) throw new DepartamentoNaoEncontradoError("Departamento não encontrado.");

  if (departamento._count.utilizadores > 0) {
    throw new DepartamentoComDependenciasError(
      `Não é possível eliminar: existem ${departamento._count.utilizadores} utilizador(es) associados. Reatribui-os antes de eliminar.`
    );
  }

  await prisma.departamento.delete({ where: { id } });
}

export async function listarUtilizadoresDoDepartamento(params: {
  departamentoId: string;
  municipioId: string;
  page: number;
  pageSize: number;
}) {
  const departamento = await prisma.departamento.findFirst({
    where: { id: params.departamentoId, direcao: { municipioId: params.municipioId } },
    select: { id: true },
  });
  if (!departamento) throw new DepartamentoNaoEncontradoError("Departamento não encontrado.");

  const where = { departamentoId: params.departamentoId };

  const [items, total] = await Promise.all([
    prisma.utilizador.findMany({
      where,
      orderBy: { nomeCompleto: "asc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        tipoConta: true,
        funcao: true,
        estado: true,
        ativo: true,
      },
    }),
    prisma.utilizador.count({ where }),
  ]);

  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize) || 1,
  };
}

export async function contarUtilizadoresDoDepartamento(departamentoId: string, municipioId: string) {
  const departamento = await prisma.departamento.findFirst({
    where: { id: departamentoId, direcao: { municipioId } },
    select: { id: true },
  });
  if (!departamento) throw new DepartamentoNaoEncontradoError("Departamento não encontrado.");

  const total = await prisma.utilizador.count({ where: { departamentoId } });
  return { departamentoId, total };
}

export async function listarDepartamentosComContagemUtilizadores(params: {
  municipioId: string;
  direcaoId?: string;
}) {
  const departamentos = await prisma.departamento.findMany({
    where: {
      direcao: { municipioId: params.municipioId },
      ...(params.direcaoId && { direcaoId: params.direcaoId }),
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      direcaoId: true,
      direcao: { select: { nome: true } },
      _count: { select: { utilizadores: true } },
    },
  });

  return departamentos.map((d) => ({
    id: d.id,
    nome: d.nome,
    direcaoId: d.direcaoId,
    direcaoNome: d.direcao.nome,
    totalUtilizadores: d._count.utilizadores,
  }));
}