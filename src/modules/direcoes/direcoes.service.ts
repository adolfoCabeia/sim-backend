import { prisma } from "../../config/prisma.js";
import { Prisma, TipoOrgao } from "../../generated/prisma/client.js";
import type { CriarDirecaoInput, AtualizarDirecaoInput } from "./direcoes.schema.js";
import {
  DirecaoNaoEncontradaError,
  DirecaoDuplicadaError,
  DirecaoComDependenciasError,
} from "./direcoes.errors.js";

function traduzirErroDuplicado(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new DirecaoDuplicadaError("Já existe uma direção com este nome ou sigla neste município.");
  }
  throw error;
}

export async function criarDirecao(params: { input: CriarDirecaoInput; municipioId: string }) {
  try {
    return await prisma.direcao.create({
      data: {
        municipioId: params.municipioId,
        nome: params.input.nome,
        sigla: params.input.sigla,
        ...(params.input.descricao !== undefined ? { descricao: params.input.descricao } : {}),
        ...(params.input.tipo !== undefined ? { tipo: params.input.tipo } : {}),
        ...(params.input.areaResponsabilidade !== undefined
          ? { areaResponsabilidade: params.input.areaResponsabilidade }
          : {}),
        ...(params.input.responsavel !== undefined ? { responsavel: params.input.responsavel } : {}),
        ...(params.input.contacto !== undefined ? { contacto: params.input.contacto } : {}),
        ...(params.input.permiteIntercambioInterMunicipal !== undefined
          ? { permiteIntercambioInterMunicipal: params.input.permiteIntercambioInterMunicipal }
          : {}),
      },
    });
  } catch (error) {
    traduzirErroDuplicado(error);
  }
}

export async function listarDirecoes(params: {
  municipioId: string;
  page: number;
  pageSize: number;
  search?: string;
  tipo?: string;
}) {
  const where: Prisma.DirecaoWhereInput = {
    municipioId: params.municipioId,
    ...(params.tipo ? { tipo: params.tipo as TipoOrgao } : {}),
    ...(params.search
      ? {
          OR: [
            { nome: { contains: params.search, mode: "insensitive" } },
            { sigla: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.direcao.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { _count: { select: { utilizadores: true } } },
    }),
    prisma.direcao.count({ where }),
  ]);

  return {
    items: items.map(({ _count, ...direcao }) => ({
      ...direcao,
      totalUtilizadores: _count.utilizadores,
    })),
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize) || 1,
  };
}

export async function obterDirecao(id: string, municipioId: string) {
  const direcao = await prisma.direcao.findFirst({
    where: { id, municipioId },
    include: {
      _count: { select: { departamentos: true, funcionarios: true, utilizadores: true } },
    },
  });

  if (!direcao) throw new DirecaoNaoEncontradaError("Direção não encontrada.");
  return direcao;
}

export async function atualizarDirecao(params: {
  id: string;
  municipioId: string;
  input: AtualizarDirecaoInput;
}) {
  const existente = await prisma.direcao.findFirst({ where: { id: params.id, municipioId: params.municipioId } });
  if (!existente) throw new DirecaoNaoEncontradaError("Direção não encontrada.");

  try {
    return await prisma.direcao.update({
      where: { id: params.id },
      data: {
        ...(params.input.nome !== undefined ? { nome: params.input.nome } : {}),
        ...(params.input.sigla !== undefined ? { sigla: params.input.sigla } : {}),
        ...(params.input.descricao !== undefined ? { descricao: params.input.descricao } : {}),
        ...(params.input.tipo !== undefined ? { tipo: params.input.tipo } : {}),
        ...(params.input.areaResponsabilidade !== undefined ? { areaResponsabilidade: params.input.areaResponsabilidade } : {}),
        ...(params.input.responsavel !== undefined ? { responsavel: params.input.responsavel } : {}),
        ...(params.input.contacto !== undefined ? { contacto: params.input.contacto } : {}),
        ...(params.input.permiteIntercambioInterMunicipal !== undefined
          ? { permiteIntercambioInterMunicipal: params.input.permiteIntercambioInterMunicipal }
          : {}),
      },
    });
  } catch (error) {
    traduzirErroDuplicado(error);
  }
}

export async function eliminarDirecao(id: string, municipioId: string) {
  const direcao = await prisma.direcao.findFirst({
    where: { id, municipioId },
    include: { _count: { select: { departamentos: true, funcionarios: true, utilizadores: true } } },
  });

  if (!direcao) throw new DirecaoNaoEncontradaError("Direção não encontrada.");

  const { departamentos, funcionarios, utilizadores } = direcao._count;
  if (departamentos + funcionarios + utilizadores > 0) {
    throw new DirecaoComDependenciasError(
      `Não é possível eliminar: existem ${utilizadores} utilizador(es), ${funcionarios} funcionário(s) e ${departamentos} departamento(s) associados. Reatribui-os antes de eliminar.`
    );
  }

  await prisma.direcao.delete({ where: { id } });
}

export async function listarUtilizadoresDaDirecao(params: {
  direcaoId: string;
  municipioId: string;
  page: number;
  pageSize: number;
}) {
  const direcao = await prisma.direcao.findFirst({
    where: { id: params.direcaoId, municipioId: params.municipioId },
  });
  if (!direcao) throw new DirecaoNaoEncontradaError("Direção não encontrada.");

  const where = { direcaoId: params.direcaoId, municipioId: params.municipioId };

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

export async function contarUtilizadoresDaDirecao(direcaoId: string, municipioId: string) {
  const direcao = await prisma.direcao.findFirst({
    where: { id: direcaoId, municipioId },
    select: { id: true },
  });
  if (!direcao) throw new DirecaoNaoEncontradaError("Direção não encontrada.");

  const total = await prisma.utilizador.count({ where: { direcaoId, municipioId } });
  return { direcaoId, total };
}

export async function listarDirecoesComContagemUtilizadores(municipioId: string) {
  const direcoes = await prisma.direcao.findMany({
    where: { municipioId },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      sigla: true,
      _count: { select: { utilizadores: true } },
    },
  });

  return direcoes.map((d) => ({
    id: d.id,
    nome: d.nome,
    sigla: d.sigla,
    totalUtilizadores: d._count.utilizadores,
  }));
}