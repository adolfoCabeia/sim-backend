import { withTenantTransaction } from "../../../config/prisma.js";
import { storageService } from "../../storage/storage.service.js";
import type {
  CriarFuncionarioInput,
  AtualizarFuncionarioInput,
  ListarFuncionariosQuery,
  AdicionarHabilitacaoInput,
} from "./funcionario.schema.js";

export class FuncionarioNaoEncontradoError extends Error {}
export class FuncionarioJaExisteError extends Error {}
export class HabilitacaoNaoEncontradaError extends Error {}
export class EstadoInvalidoError extends Error {}

// Dados do Utilizador que interessam mostrar junto com a ficha de RH — cargo,
// contactos de trabalho, etc. continuam no Funcionario; departamento e
// direcção vêm sempre daqui, para não haver dois sítios com a mesma info.
const UTILIZADOR_SELECT = {
  id: true,
  nomeCompleto: true,
  email: true,
  telefone: true,
  direcaoId: true,
  departamentoId: true,
  funcao: true,
  direcao: { select: { id: true, nome: true, sigla: true } },
  // Departamento não tem "sigla" (só Direcao tem) — usa "descricao".
  departamento: { select: { id: true, nome: true, descricao: true } },
} as const;

export async function criarFuncionario(params: {
  municipioId: string;
  input: CriarFuncionarioInput;
  fotografiaKey?: string;
  cvKey?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const jaExiste = await tx.funcionario.findUnique({ where: { utilizadorId: params.input.utilizadorId } });
    if (jaExiste) {
      throw new FuncionarioJaExisteError("Este utilizador já tem uma ficha de funcionário.");
    }

    return tx.funcionario.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.input.utilizadorId,
        cargo: params.input.cargo,
        contactoTelefone: params.input.contactoTelefone ?? null,
        contactoEmail: params.input.contactoEmail ?? null,
        fotografiaUrl: params.fotografiaKey ?? null,
        cvUrl: params.cvKey ?? null,
        tipoVinculo: params.input.tipoVinculo,
        dataInicioVinculo: new Date(params.input.dataInicioVinculo),
        dataFimVinculo: params.input.dataFimVinculo ? new Date(params.input.dataFimVinculo) : null,
        observacoes: params.input.observacoes ?? null,
        estado: "ATIVO",
      },
      include: { utilizador: { select: UTILIZADOR_SELECT } },
    });
  });
}

export async function atualizarFuncionario(params: {
  municipioId: string;
  id: string;
  input: AtualizarFuncionarioInput;
  fotografiaKey?: string;
  cvKey?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const atual = await obterFuncionarioOuFalhar(tx, params.municipioId, params.id);

    if (params.fotografiaKey && atual.fotografiaUrl) {
      await storageService.eliminarDocumento(atual.fotografiaUrl).catch(() => undefined);
    }
    if (params.cvKey && atual.cvUrl) {
      await storageService.eliminarDocumento(atual.cvUrl).catch(() => undefined);
    }

    return tx.funcionario.update({
      where: { id: params.id },
      data: {
        ...(params.input.cargo !== undefined && { cargo: params.input.cargo }),
        ...(params.input.contactoTelefone !== undefined && { contactoTelefone: params.input.contactoTelefone }),
        ...(params.input.contactoEmail !== undefined && { contactoEmail: params.input.contactoEmail }),
        ...(params.input.tipoVinculo !== undefined && { tipoVinculo: params.input.tipoVinculo }),
        ...(params.input.dataInicioVinculo !== undefined && {
          dataInicioVinculo: new Date(params.input.dataInicioVinculo),
        }),
        ...(params.input.dataFimVinculo !== undefined && {
          dataFimVinculo: params.input.dataFimVinculo ? new Date(params.input.dataFimVinculo) : null,
        }),
        ...(params.input.observacoes !== undefined && { observacoes: params.input.observacoes }),
        ...(params.input.estado !== undefined && { estado: params.input.estado }),
        ...(params.fotografiaKey !== undefined && { fotografiaUrl: params.fotografiaKey }),
        ...(params.cvKey !== undefined && { cvUrl: params.cvKey }),
      },
      include: { utilizador: { select: UTILIZADOR_SELECT } },
    });
  });
}

// Isolamento entre municípios: verificação explícita, feita aqui e não só
// confiada ao scoping da tx — um ID de outro município nunca deve ser
// devolvido, mesmo que alguém o adivinhe ou o receba por engano.
async function obterFuncionarioOuFalhar(
  tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0],
  municipioId: string,
  id: string
) {
  const funcionario = await tx.funcionario.findUnique({
    where: { id },
    include: { habilitacoes: true, utilizador: { select: UTILIZADOR_SELECT } },
  });
  if (!funcionario || funcionario.municipioId !== municipioId) {
    throw new FuncionarioNaoEncontradoError("Funcionário não encontrado.");
  }
  return funcionario;
}

export async function obterFuncionario(params: { municipioId: string; id: string }) {
  return withTenantTransaction(params.municipioId, (tx) => obterFuncionarioOuFalhar(tx, params.municipioId, params.id));
}

export async function obterFuncionarioPorUtilizador(params: { municipioId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const funcionario = await tx.funcionario.findUnique({
      where: { utilizadorId: params.utilizadorId },
      include: { habilitacoes: true, utilizador: { select: UTILIZADOR_SELECT } },
    });
    if (!funcionario || funcionario.municipioId !== params.municipioId) return null;
    return funcionario;
  });
}

export async function listarFuncionarios(params: { municipioId: string; query: ListarFuncionariosQuery }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where = {
      // Explícito, mesmo dentro da transacção com scope de tenant — a mesma
      // lógica de defesa em profundidade usada em obterFuncionarioOuFalhar.
      municipioId: params.municipioId,
      // departamentoId já não existe no Funcionario — filtra-se através da
      // relação com o Utilizador dono da ficha.
      ...(params.query.departamentoId !== undefined && {
        utilizador: { departamentoId: params.query.departamentoId },
      }),
      ...(params.query.tipoVinculo !== undefined && { tipoVinculo: params.query.tipoVinculo }),
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
    };
    const [items, total] = await Promise.all([
      tx.funcionario.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
        include: { utilizador: { select: UTILIZADOR_SELECT } },
      }),
      tx.funcionario.count({ where }),
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

export async function adicionarHabilitacao(params: {
  municipioId: string;
  funcionarioId: string;
  input: AdicionarHabilitacaoInput;
  comprovativoKey?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterFuncionarioOuFalhar(tx, params.municipioId, params.funcionarioId);
    return tx.habilitacao.create({
      data: {
        municipioId: params.municipioId,
        funcionarioId: params.funcionarioId,
        nivel: params.input.nivel,
        curso: params.input.curso,
        instituicao: params.input.instituicao,
        anoConclusao: params.input.anoConclusao ?? null,
        comprovativoUrl: params.comprovativoKey ?? null,
      },
    });
  });
}

export async function removerHabilitacao(params: { municipioId: string; funcionarioId: string; habilitacaoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const habilitacao = await tx.habilitacao.findUnique({ where: { id: params.habilitacaoId } });
    if (
      !habilitacao ||
      habilitacao.funcionarioId !== params.funcionarioId ||
      habilitacao.municipioId !== params.municipioId
    ) {
      throw new HabilitacaoNaoEncontradaError("Habilitação não encontrada para este funcionário.");
    }

    if (habilitacao.comprovativoUrl) {
      await storageService.eliminarDocumento(habilitacao.comprovativoUrl).catch(() => undefined);
    }

    await tx.habilitacao.delete({ where: { id: params.habilitacaoId } });
  });
}