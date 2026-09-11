import { prismaAuthBypass, withTenantTransaction } from "../../config/prisma.js";
import { getPerfisDoUtilizador } from "../auth/rbac/rbac.service.js";

const SELECT_FUNCIONARIO = {
  id: true,
  nomeCompleto: true,
  email: true,
  tipoConta: true,
  estado: true,
} as const;


export async function listarFuncionariosPorDepartamento(params: { executorId: string; executorMunicipioId: string }) {
  const perfis = await getPerfisDoUtilizador(params.executorId, params.executorMunicipioId);
  const ehSuperAdmin = perfis.some((p) => p.nome === "SUPER_ADMIN");

  if (ehSuperAdmin) {
    const departamentos = await prismaAuthBypass.departamento.findMany({
      select: {
        id: true,
        nome: true,
        direcao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            municipio: { select: { id: true, nome: true, codigo: true } },
          },
        },
        utilizadores: { select: SELECT_FUNCIONARIO },
      },
      orderBy: [{ direcao: { municipio: { nome: "asc" } } }, { direcao: { nome: "asc" } }, { nome: "asc" }],
    });
    return departamentos;
  }

  return withTenantTransaction(params.executorMunicipioId, async (tx) => {
    return tx.departamento.findMany({
      where: { direcao: { municipioId: params.executorMunicipioId } },
      select: {
        id: true,
        nome: true,
        direcao: { select: { id: true, nome: true, sigla: true } },
        utilizadores: { select: SELECT_FUNCIONARIO },
      },
      orderBy: [{ direcao: { nome: "asc" } }, { nome: "asc" }],
    });
  });
}