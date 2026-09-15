import { Prisma } from "../../generated/prisma/client.js";
import type { OrigemProcessoGenerico, TipoProcessoGenerico } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { undefinedToNull } from "../../utils/optional.js";
import type { CriarServicoInput, ActualizarServicoInput, ListarServicosQuery } from "./servico.schema.js";

export class ServicoNaoEncontradoError extends Error {}
export class ServicoCodigoDuplicadoError extends Error {}
export class DirecaoResponsavelInvalidaError extends Error {}
export class ServicoEmUsoError extends Error {}
export class SlaInvalidoError extends Error {}

type TransactionClient = Prisma.TransactionClient;

function paraNumero(valor: Prisma.Decimal | number | null | undefined): number | undefined {
  if (valor === null || valor === undefined) return undefined;
  return typeof valor === "number" ? valor : Number(valor);
}

function validarSla(prazoDiasCorridos: number | undefined, diasAlertaAntesPrazo: number | undefined) {
  if (prazoDiasCorridos !== undefined && prazoDiasCorridos < 1) {
    throw new SlaInvalidoError("O prazo em dias corridos tem de ser pelo menos 1.");
  }
  if (diasAlertaAntesPrazo !== undefined && diasAlertaAntesPrazo < 0) {
    throw new SlaInvalidoError("Os dias de alerta não podem ser negativos.");
  }
  if (
    prazoDiasCorridos !== undefined &&
    diasAlertaAntesPrazo !== undefined &&
    diasAlertaAntesPrazo >= prazoDiasCorridos
  ) {
    throw new SlaInvalidoError("Os dias de alerta têm de ser inferiores ao prazo total.");
  }
}

const SELECT_SERVICO = {
  id: true,
  codigo: true,
  nome: true,
  descricao: true,
  tipoProcesso: true,
  origensPermitidas: true,
  pago: true,
  valorReferenciaKz: true,
  fonte: true,
  prazoDiasCorridos: true,
  diasAlertaAntesPrazo: true,
  activo: true,
  criadoEm: true,
  alteradoEm: true,
  direcaoResponsavel: { select: { id: true, nome: true, sigla: true } },
  documentosExigidos: {
    select: { codigo: true, nome: true, obrigatorio: true },
    orderBy: { ordem: "asc" as const },
  },
} as const;

export interface DocumentoExigidoItem {
  codigo: string;
  nome: string;
  obrigatorio: boolean;
}

export interface ServicoFormatado {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  tipoProcesso: TipoProcessoGenerico;
  direcaoResponsavelSigla: string;
  direcaoResponsavel: { id: string; nome: string; sigla: string };
  origensPermitidas: OrigemProcessoGenerico[];
  documentosExigidos: DocumentoExigidoItem[];
  pago: boolean;
  valorReferenciaKz?: number | undefined;
  fonte?: string | null | undefined;
  prazoDiasCorridos: number;
  diasAlertaAntesPrazo: number;
  activo: boolean;
  criadoEm: Date;
  alteradoEm: Date;
}

/** Modelo público resumido — usado na listagem (GET /servicos/publico). Não expor campos
 * administrativos/internos aqui (diasAlertaAntesPrazo, fonte, activo, timestamps, etc). */
export interface ServicoPublicoResumo {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  tipoProcesso: TipoProcessoGenerico;
  direcaoResponsavel: { id: string; nome: string; sigla: string };
  pago: boolean;
  valorReferenciaKz: number | null;
  prazoDiasCorridos: number;
}

/** Modelo público detalhado — usado no detalhe (GET /servicos/publico/:codigo). */
export interface ServicoPublicoDetalhe {
  servico: { id: string; codigo: string; nome: string; descricao: string; tipoProcesso: TipoProcessoGenerico };
  direcaoResponsavel: { id: string; nome: string; sigla: string };
  documentosExigidos: DocumentoExigidoItem[];
  pago: boolean;
  valorReferenciaKz: number | null;
  prazoDiasCorridos: number;
}

function formatarServico(s: any): ServicoFormatado {
  return {
    id: s.id,
    codigo: s.codigo,
    nome: s.nome,
    descricao: s.descricao,
    tipoProcesso: s.tipoProcesso,
    direcaoResponsavelSigla: s.direcaoResponsavel?.sigla ?? s.direcaoResponsavelSigla,
    direcaoResponsavel: s.direcaoResponsavel,
    origensPermitidas: s.origensPermitidas,
    documentosExigidos: (s.documentosExigidos ?? []).map((d: any) => ({
      codigo: d.codigo,
      nome: d.nome,
      obrigatorio: Boolean(d.obrigatorio),
    })),
    pago: s.pago,
    valorReferenciaKz: paraNumero(s.valorReferenciaKz),
    fonte: s.fonte,
    prazoDiasCorridos: s.prazoDiasCorridos,
    diasAlertaAntesPrazo: s.diasAlertaAntesPrazo,
    activo: s.activo,
    criadoEm: s.criadoEm,
    alteradoEm: s.alteradoEm,
  };
}

/** Transformação explícita interno -> público (resumo). Nunca devolver ServicoFormatado
 * directamente num endpoint público. */
export function mapServicoParaPublicoResumo(servico: ServicoFormatado): ServicoPublicoResumo {
  return {
    id: servico.id,
    codigo: servico.codigo,
    nome: servico.nome,
    descricao: servico.descricao,
    tipoProcesso: servico.tipoProcesso,
    direcaoResponsavel: servico.direcaoResponsavel,
    pago: servico.pago,
    valorReferenciaKz: servico.valorReferenciaKz ?? null,
    prazoDiasCorridos: servico.prazoDiasCorridos,
  };
}

/** Transformação explícita interno -> público (detalhe). */
export function mapServicoParaPublicoDetalhe(servico: ServicoFormatado): ServicoPublicoDetalhe {
  return {
    servico: {
      id: servico.id,
      codigo: servico.codigo,
      nome: servico.nome,
      descricao: servico.descricao,
      tipoProcesso: servico.tipoProcesso,
    },
    direcaoResponsavel: servico.direcaoResponsavel,
    documentosExigidos: servico.documentosExigidos,
    pago: servico.pago,
    valorReferenciaKz: servico.valorReferenciaKz ?? null,
    prazoDiasCorridos: servico.prazoDiasCorridos,
  };
}

async function resolverDirecaoResponsavel(tx: TransactionClient, municipioId: string, sigla: string) {
  const direcao = await tx.direcao.findUnique({
    where: { municipioId_sigla: { municipioId, sigla } },
    select: { id: true },
  });
  if (!direcao) {
    throw new DirecaoResponsavelInvalidaError(`Não existe nenhuma direcção com a sigla "${sigla}" neste município.`);
  }
  return direcao.id;
}

export async function criarServico(params: { municipioId: string; utilizadorId: string; input: CriarServicoInput }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.servico.findUnique({
      where: { municipioId_codigo: { municipioId: params.municipioId, codigo: params.input.codigo } },
      select: { id: true },
    });
    if (existente) {
      throw new ServicoCodigoDuplicadoError(`Já existe um serviço com o código "${params.input.codigo}".`);
    }

    const direcaoResponsavelId = await resolverDirecaoResponsavel(tx, params.municipioId, params.input.direcaoResponsavelSigla);

    validarSla(params.input.prazoDiasCorridos, params.input.diasAlertaAntesPrazo);

    const servico = await tx.servico.create({
      data: {
        municipioId: params.municipioId,
        codigo: params.input.codigo,
        nome: params.input.nome,
        descricao: params.input.descricao,
        tipoProcesso: params.input.tipoProcesso,
        direcaoResponsavelId,
        origensPermitidas: params.input.origensPermitidas,
        pago: params.input.pago,
        valorReferenciaKz: undefinedToNull(params.input.valorReferenciaKz),
        fonte: undefinedToNull(params.input.fonte),
        prazoDiasCorridos: params.input.prazoDiasCorridos,
        diasAlertaAntesPrazo: params.input.diasAlertaAntesPrazo,
        criadoPorId: params.utilizadorId,
        documentosExigidos: {
          create: params.input.documentosExigidos.map((doc, indice) => ({ ...doc, ordem: indice })),
        },
      },
      select: SELECT_SERVICO,
    });

    return formatarServico(servico);
  });
}

export async function actualizarServico(params: {
  municipioId: string;
  utilizadorId: string;
  servicoId: string;
  input: ActualizarServicoInput;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.servico.findFirst({ where: { id: params.servicoId, municipioId: params.municipioId } });
    if (!existente) {
      throw new ServicoNaoEncontradoError("Serviço não encontrado.");
    }

    if (params.input.codigo && params.input.codigo !== existente.codigo) {
      const duplicado = await tx.servico.findUnique({
        where: { municipioId_codigo: { municipioId: params.municipioId, codigo: params.input.codigo } },
        select: { id: true },
      });
      if (duplicado) {
        throw new ServicoCodigoDuplicadoError(`Já existe um serviço com o código "${params.input.codigo}".`);
      }
    }

    const direcaoResponsavelId = params.input.direcaoResponsavelSigla
      ? await resolverDirecaoResponsavel(tx, params.municipioId, params.input.direcaoResponsavelSigla)
      : undefined;

    const { documentosExigidos, direcaoResponsavelSigla, ...resto } = params.input;

    validarSla(
      resto.prazoDiasCorridos ?? existente.prazoDiasCorridos,
      resto.diasAlertaAntesPrazo ?? existente.diasAlertaAntesPrazo
    );

    if (documentosExigidos) {
      await tx.servicoDocumentoExigido.deleteMany({ where: { servicoId: params.servicoId } });
    }

    const servico = await tx.servico.update({
      where: { id: params.servicoId },
      data: {
        ...(resto.codigo !== undefined ? { codigo: resto.codigo } : {}),
        ...(resto.nome !== undefined ? { nome: resto.nome } : {}),
        ...(resto.descricao !== undefined ? { descricao: resto.descricao } : {}),
        ...(resto.tipoProcesso !== undefined ? { tipoProcesso: resto.tipoProcesso } : {}),
        ...(resto.origensPermitidas !== undefined ? { origensPermitidas: resto.origensPermitidas } : {}),
        ...(resto.pago !== undefined ? { pago: resto.pago } : {}),
        ...(resto.valorReferenciaKz !== undefined ? { valorReferenciaKz: undefinedToNull(resto.valorReferenciaKz) } : {}),
        ...(resto.fonte !== undefined ? { fonte: undefinedToNull(resto.fonte) } : {}),
        ...(resto.prazoDiasCorridos !== undefined ? { prazoDiasCorridos: resto.prazoDiasCorridos } : {}),
        ...(resto.diasAlertaAntesPrazo !== undefined ? { diasAlertaAntesPrazo: resto.diasAlertaAntesPrazo } : {}),
        ...(direcaoResponsavelId ? { direcaoResponsavelId } : {}),
        alteradoPorId: params.utilizadorId,
        ...(documentosExigidos
          ? { documentosExigidos: { create: documentosExigidos.map((doc, indice) => ({ ...doc, ordem: indice })) } }
          : {}),
      },
      select: SELECT_SERVICO,
    });

    return formatarServico(servico);
  });
}

export async function definirActivoServico(params: { municipioId: string; utilizadorId: string; servicoId: string; activo: boolean }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.servico.findFirst({ where: { id: params.servicoId, municipioId: params.municipioId } });
    if (!existente) {
      throw new ServicoNaoEncontradoError("Serviço não encontrado.");
    }
    const servico = await tx.servico.update({
      where: { id: params.servicoId },
      data: { activo: params.activo, alteradoPorId: params.utilizadorId },
      select: SELECT_SERVICO,
    });
    return formatarServico(servico);
  });
}

export async function removerServico(params: { municipioId: string; servicoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const existente = await tx.servico.findFirst({ where: { id: params.servicoId, municipioId: params.municipioId } });
    if (!existente) {
      throw new ServicoNaoEncontradoError("Serviço não encontrado.");
    }

    const emUso = await tx.processoGenerico.count({
      where: { municipioId: params.municipioId, servicoCodigo: existente.codigo },
    });
    if (emUso > 0) {
      throw new ServicoEmUsoError(
        `Este serviço já foi usado em ${emUso} processo(s) — não pode ser eliminado. Desactive-o em vez de remover.`
      );
    }

    await tx.servico.delete({ where: { id: params.servicoId } });
    return { id: params.servicoId };
  });
}

export async function listarServicos(params: { municipioId: string; query: ListarServicosQuery }) {
  const where: Prisma.ServicoWhereInput = {
    municipioId: params.municipioId,
    ...(params.query.tipoProcesso ? { tipoProcesso: params.query.tipoProcesso } : {}),
    ...(params.query.pago !== undefined ? { pago: params.query.pago } : {}),
    ...(params.query.activo !== undefined ? { activo: params.query.activo } : {}),
    ...(params.query.origem ? { origensPermitidas: { has: params.query.origem } } : {}),
    ...(params.query.direcaoResponsavelSigla ? { direcaoResponsavel: { sigla: params.query.direcaoResponsavelSigla } } : {}),
    ...(params.query.pesquisa
      ? {
          OR: [
            { nome: { contains: params.query.pesquisa, mode: "insensitive" } },
            { codigo: { contains: params.query.pesquisa, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return withTenantTransaction(params.municipioId, async (tx) => {
    const [items, total] = await Promise.all([
      tx.servico.findMany({
        where,
        select: SELECT_SERVICO,
        orderBy: { nome: "asc" },
        skip: (params.query.page - 1) * params.query.pageSize,
        take: params.query.pageSize,
      }),
      tx.servico.count({ where }),
    ]);

    return {
      items: items.map(formatarServico),
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

export async function obterServico(params: { municipioId: string; servicoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const servico = await tx.servico.findFirst({ where: { id: params.servicoId, municipioId: params.municipioId }, select: SELECT_SERVICO });
    if (!servico) {
      throw new ServicoNaoEncontradoError("Serviço não encontrado.");
    }
    return formatarServico(servico);
  });
}

export async function obterServicoPorCodigoTx(tx: TransactionClient, codigo: string): Promise<ServicoFormatado | null> {
  const servico = await tx.servico.findFirst({ where: { codigo, activo: true }, select: SELECT_SERVICO });
  return servico ? formatarServico(servico) : null;
}

/** Usado pelo detalhe público: withTenantTransaction fixa a sessão RLS ao municipioId,
 * e o filtro aqui acrescenta codigo + activo — logo a query fica sempre restrita a
 * municipioId + codigo + activo em conjunto, nunca apenas por codigo. */
export async function obterServicoPorCodigo(municipioId: string, codigo: string): Promise<ServicoFormatado | null> {
  return withTenantTransaction(municipioId, (tx) => obterServicoPorCodigoTx(tx, codigo));
}

export async function filtrarServicosCatalogo(params: {
  municipioId: string;
  origem?: OrigemProcessoGenerico;
  tipoProcesso?: TipoProcessoGenerico;
  direcaoResponsavelSigla?: string;
  pago?: boolean;
  pesquisa?: string;
}): Promise<ServicoFormatado[]> {
  const where: Prisma.ServicoWhereInput = {
    municipioId: params.municipioId,
    activo: true,
    ...(params.tipoProcesso ? { tipoProcesso: params.tipoProcesso } : {}),
    ...(params.pago !== undefined ? { pago: params.pago } : {}),
    ...(params.origem ? { origensPermitidas: { has: params.origem } } : {}),
    ...(params.direcaoResponsavelSigla ? { direcaoResponsavel: { sigla: params.direcaoResponsavelSigla } } : {}),
    ...(params.pesquisa
      ? {
          OR: [
            { nome: { contains: params.pesquisa, mode: "insensitive" } },
            { codigo: { contains: params.pesquisa, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return withTenantTransaction(params.municipioId, async (tx) => {
    const servicos = await tx.servico.findMany({ where, select: SELECT_SERVICO, orderBy: { nome: "asc" } });
    return servicos.map(formatarServico);
  });
}