import type { Prisma } from "../../generated/prisma/client.js";
import { prisma, withTenantTransaction } from "../../config/prisma.js";
import { getPerfisDoUtilizador } from "../auth/rbac/rbac.service.js";
import { DIRECOES_TEMPLATE, DEPARTAMENTOS_POR_DIRECAO } from "../../config/organograma.js";
import type { CriarMunicipioInput } from "./municipios.schema.js";

export class CodigoMunicipioJaExisteError extends Error {}
export class ApenasSuperAdminError extends Error {}
export class MunicipioNaoEncontradoError extends Error {}


export async function provisionarUnidadesOrganicas(
  tx: Prisma.TransactionClient,
  municipioId: string
): Promise<{ direcoes: number; departamentos: number }> {
  let totalDepartamentos = 0;

  for (const direcaoTemplate of DIRECOES_TEMPLATE) {
    const { permiteIntercambioInterMunicipal, sigla, ...resto } = direcaoTemplate;

    const direcao = await tx.direcao.upsert({
      where: { municipioId_sigla: { municipioId, sigla } },
      update: { ...resto, sigla, permiteIntercambioInterMunicipal: permiteIntercambioInterMunicipal ?? false },
      create: {
        municipioId,
        sigla,
        ...resto,
        permiteIntercambioInterMunicipal: permiteIntercambioInterMunicipal ?? false,
      },
    });

    const departamentosPadrao = DEPARTAMENTOS_POR_DIRECAO[sigla];
    if (departamentosPadrao) {
      for (const nomeDepartamento of departamentosPadrao) {
        await tx.departamento.upsert({
          where: { direcaoId_nome: { direcaoId: direcao.id, nome: nomeDepartamento } },
          update: {},
          create: { direcaoId: direcao.id, nome: nomeDepartamento },
        });
        totalDepartamentos++;
      }
    }
  }

  return { direcoes: DIRECOES_TEMPLATE.length, departamentos: totalDepartamentos };
}

export async function criarMunicipio(params: { input: CriarMunicipioInput; executorId: string; executorMunicipioId: string }) {
  const perfisDoExecutor = await getPerfisDoUtilizador(params.executorId, params.executorMunicipioId);
  const executorEhSuperAdmin = perfisDoExecutor.some((p) => p.nome === "SUPER_ADMIN");

  if (!executorEhSuperAdmin) {
    throw new ApenasSuperAdminError("Só o SUPER_ADMIN pode criar um novo município.");
  }

  const existente = await prisma.municipio.findUnique({ where: { codigo: params.input.codigo } });
  if (existente) {
    throw new CodigoMunicipioJaExisteError(`Já existe um município com o código "${params.input.codigo}".`);
  }

  const municipio = await prisma.municipio.create({
    data: {
      nome: params.input.nome,
      codigo: params.input.codigo,
      ...(params.input.provincia !== undefined && { provincia: params.input.provincia }),
    },
  });
  const { direcoes, departamentos } = await withTenantTransaction(
    municipio.id,
    async (tx) => provisionarUnidadesOrganicas(tx, municipio.id),
    { timeout: 45_000, maxWait: 10_000 }
  );

  return { municipio, direcoesCriadas: direcoes, departamentosCriados: departamentos };
}

export async function listarMunicipios() {
  return prisma.municipio.findMany({
    where: { activo: true },
    select: { id: true, nome: true, codigo: true, provincia: true },
    orderBy: { nome: "asc" },
  });
}

export async function listarDirecoesDoMunicipio(municipioId: string) {
  return withTenantTransaction(municipioId, (tx) =>
    tx.direcao.findMany({
      where: { municipioId },
      select: { id: true, nome: true, sigla: true, tipo: true, areaResponsabilidade: true },
      orderBy: { nome: "asc" },
    })
  );
}

export async function obterMunicipioPorId(id: string) {
  const municipio = await prisma.municipio.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      codigo: true,
      provincia: true,
    },
  });

  if (!municipio) {
    throw new MunicipioNaoEncontradoError("Município não encontrado.");
  }

  return municipio;
}