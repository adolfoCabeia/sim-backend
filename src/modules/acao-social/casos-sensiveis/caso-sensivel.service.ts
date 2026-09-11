import type { Prisma } from "../../../generated/prisma/client.js";
import { withTenantTransaction } from "../../../config/prisma.js";
import { cifrar, decifrar, cifrarOpcional, decifrarOpcional } from "../seguranca/campo-cifrado.js";
import type {
  CriarCasoSensivelInput,
  AtualizarCasoSensivelInput,
  EliminarCasoSensivelInput,
  ListarCasosSensiveisQuery,
} from "./caso-sensivel.schema.js";

/**
 * DESENHO DELIBERADO: este ficheiro é o ÚNICO ponto de acesso a dados de
 * CasoSensivel em todo o backend. Não existe (e não deve passar a existir)
 * nenhuma função aqui — exportada ou não — que devolva um caso sensível
 * sem, na mesma transacção, escrever uma linha em AcessoCasoSensivel.
 *
 * Cifra: `descricao` e `encaminhadoPara` nunca tocam a base de dados em
 * texto simples — são cifrados (AES-256-GCM) antes de qualquer `create`/
 * `update`, e decifrados só depois de lidos, já dentro deste ficheiro.
 * A API (schema/controller/docs) continua a falar em texto simples — a
 * cifra é um detalhe de armazenamento, não do contrato HTTP.
 *
 * Soft delete: eliminar nunca apaga a linha. Marca `eliminadoEm` +
 * `eliminadoPorId` + `motivoEliminacao`, e fica de fora das listagens e
 * leituras normais. Para ver casos eliminados, há uma função à parte
 * (`listarCasosSensiveisEliminados`), pensada para ficar atrás de uma
 * permissão ainda mais restrita do que a de gerir casos activos.
 */

export class CasoSensivelNaoEncontradoError extends Error {}
export class CasoSensivelJaEliminadoError extends Error {}

// --- Mapeamento entre a forma "de fora" (plaintext) e a forma "de dentro" (cifrada) ---

type CasoSensivelDb = {
  id: string;
  municipioId: string;
  beneficiarioId: string | null;
  tipo: string;
  descricaoCifrada: string;
  encaminhadoParaCifrado: string | null;
  estado: string;
  dataDeteccao: Date;
  registadoPorId: string;
  eliminadoEm: Date | null;
  eliminadoPorId: string | null;
  motivoEliminacao: string | null;
  criadoEm: Date;
  alteradoEm: Date;
};

function paraApi(caso: CasoSensivelDb) {
  const { descricaoCifrada, encaminhadoParaCifrado, ...resto } = caso;
  return {
    ...resto,
    descricao: decifrar(descricaoCifrada),
    encaminhadoPara: decifrarOpcional(encaminhadoParaCifrado),
  };
}

async function registarAcesso(
  tx: Prisma.TransactionClient,
  casoSensivelId: string,
  utilizadorId: string,
  acao: "VISUALIZACAO" | "CRIACAO" | "EDICAO" | "ELIMINACAO" | "RESTAURACAO"
) {
  await tx.acessoCasoSensivel.create({ data: { casoSensivelId, utilizadorId, acao } });
}

/** Por omissão exclui eliminados — é o que a maioria das funções deste ficheiro quer. */
async function obterCasoOuFalhar(tx: Prisma.TransactionClient, id: string, incluirEliminados = false) {
  const caso = await tx.casoSensivel.findUnique({ where: { id } });
  if (!caso || (!incluirEliminados && caso.eliminadoEm)) {
    throw new CasoSensivelNaoEncontradoError("Caso não encontrado.");
  }
  return caso;
}

export async function criarCasoSensivel(params: { municipioId: string; utilizadorId: string; input: CriarCasoSensivelInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const caso = await tx.casoSensivel.create({
      data: {
        municipioId: params.municipioId,
        tipo: params.input.tipo,
        descricaoCifrada: cifrar(params.input.descricao),
        encaminhadoParaCifrado: cifrarOpcional(params.input.encaminhadoPara),
        dataDeteccao: new Date(params.input.dataDeteccao),
        registadoPorId: params.utilizadorId,
        ...(params.input.beneficiarioId !== undefined && { beneficiarioId: params.input.beneficiarioId }),
      },
    });
    await registarAcesso(tx, caso.id, params.utilizadorId, "CRIACAO");
    return paraApi(caso);
  });
}

export async function obterCasoSensivel(params: { municipioId: string; id: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const caso = await obterCasoOuFalhar(tx, params.id);
    await registarAcesso(tx, caso.id, params.utilizadorId, "VISUALIZACAO");
    return paraApi(caso);
  });
}

export async function atualizarCasoSensivel(params: {
  municipioId: string;
  id: string;
  utilizadorId: string;
  input: AtualizarCasoSensivelInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterCasoOuFalhar(tx, params.id);
    const atualizado = await tx.casoSensivel.update({
      where: { id: params.id },
      data: {
        ...(params.input.estado !== undefined && { estado: params.input.estado }),
        ...(params.input.descricao !== undefined && { descricaoCifrada: cifrar(params.input.descricao) }),
        ...(params.input.encaminhadoPara !== undefined && { encaminhadoParaCifrado: cifrarOpcional(params.input.encaminhadoPara) }),
      },
    });
    await registarAcesso(tx, params.id, params.utilizadorId, "EDICAO");
    return paraApi(atualizado);
  });
}

export async function eliminarCasoSensivel(params: {
  municipioId: string;
  id: string;
  utilizadorId: string;
  input: EliminarCasoSensivelInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const caso = await obterCasoOuFalhar(tx, params.id);
    if (caso.eliminadoEm) throw new CasoSensivelJaEliminadoError("Este caso já está eliminado.");

    const atualizado = await tx.casoSensivel.update({
      where: { id: params.id },
      data: { eliminadoEm: new Date(), eliminadoPorId: params.utilizadorId, motivoEliminacao: params.input.motivo },
    });
    await registarAcesso(tx, params.id, params.utilizadorId, "ELIMINACAO");
    return paraApi(atualizado);
  });
}

/** Desfaz uma eliminação — pensado para engano ou decisão revista, não para uso rotineiro. */
export async function restaurarCasoSensivel(params: { municipioId: string; id: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const caso = await obterCasoOuFalhar(tx, params.id, true);
    if (!caso.eliminadoEm) throw new CasoSensivelNaoEncontradoError("Este caso não está eliminado.");

    const atualizado = await tx.casoSensivel.update({
      where: { id: params.id },
      data: { eliminadoEm: null, eliminadoPorId: null, motivoEliminacao: null },
    });
    await registarAcesso(tx, params.id, params.utilizadorId, "RESTAURACAO");
    return paraApi(atualizado);
  });
}

export async function listarCasosSensiveis(params: {
  municipioId: string;
  utilizadorId: string;
  query: ListarCasosSensiveisQuery;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where: Prisma.CasoSensivelWhereInput = {
      eliminadoEm: null,
      ...(params.query.tipo !== undefined && { tipo: params.query.tipo }),
      ...(params.query.estado !== undefined && { estado: params.query.estado }),
      ...(params.query.beneficiarioId !== undefined && { beneficiarioId: params.query.beneficiarioId }),
    };
    const [items, total] = await Promise.all([
      tx.casoSensivel.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.casoSensivel.count({ where }),
    ]);

    // Cada caso devolvido conta como uma visualização — uma linha de
    // auditoria por item, não uma só para a "listagem" como um todo.
    if (items.length > 0) {
      await tx.acessoCasoSensivel.createMany({
        data: items.map((item) => ({
          casoSensivelId: item.id,
          utilizadorId: params.utilizadorId,
          acao: "VISUALIZACAO" as const,
        })),
      });
    }

    return {
      items: items.map(paraApi),
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

/** Ver casos eliminados — permissão própria e mais restrita ainda (ver README). */
export async function listarCasosSensiveisEliminados(params: { municipioId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const items = await tx.casoSensivel.findMany({
      where: { eliminadoEm: { not: null } },
      orderBy: { eliminadoEm: "desc" },
    });
    if (items.length > 0) {
      await tx.acessoCasoSensivel.createMany({
        data: items.map((item) => ({ casoSensivelId: item.id, utilizadorId: params.utilizadorId, acao: "VISUALIZACAO" as const })),
      });
    }
    return items.map(paraApi);
  });
}

/**
 * Trilho de auditoria de UM caso: quem acedeu, quando, que acção. Sem
 * relation formal para Utilizador (ver nota no schema Prisma), por isso
 * os nomes são resolvidos aqui, com uma segunda query, em vez de um
 * `include`.
 */
export async function listarAcessosDoCaso(params: { municipioId: string; casoSensivelId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    await obterCasoOuFalhar(tx, params.casoSensivelId, true); // garante que o caso pertence a este município

    const acessos = await tx.acessoCasoSensivel.findMany({
      where: { casoSensivelId: params.casoSensivelId },
      orderBy: { criadoEm: "desc" },
    });

    const idsUtilizadores = [...new Set(acessos.map((a) => a.utilizadorId))];
    const utilizadores = await tx.utilizador.findMany({
      where: { id: { in: idsUtilizadores } },
      select: { id: true, nomeCompleto: true, email: true },
    });
    const utilizadorPorId = new Map(utilizadores.map((u) => [u.id, u]));

    return acessos.map((acesso) => ({
      ...acesso,
      utilizador: utilizadorPorId.get(acesso.utilizadorId) ?? null,
    }));
  });
}