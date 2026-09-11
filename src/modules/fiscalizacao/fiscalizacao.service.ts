/**
 * Direcção Municipal de Fiscalização (secção 13 do documento técnico).
 *
 * ANTES DESTA ALTERAÇÃO: a Fiscalização só existia como perfil de
 * utilizador (`DIRECTOR_FISCALIZACAO`) com permissões genéricas de
 * `PROCESSOS_GENERICOS_*` — não havia nenhum tipo de processo nem campo
 * de domínio próprio (estabelecimento, tipo de infracção, valor da
 * coima), pelo que "histórico de estabelecimentos" (secção 13) era
 * impossível de consultar.
 *
 * Este módulo NÃO duplica o motor de processos — reaproveita
 * `criarProcesso` do `process-engine.service.ts` (que já trata número
 * sequencial, prazo legal, notificação ao GAM, etc.) e só acrescenta o
 * `FiscalizacaoDetalhe` ligado ao processo criado. O ciclo de
 * vida/tramitação continua inteiramente a cargo do motor de processos
 * existente — usa `POST /processos-genericos/:id/transicionar` como
 * qualquer outro processo.
 */

import type { Prisma, TipoProcessoGenerico } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { criarProcesso } from "../../core/process-engine/process-engine.service.js";
import type { CriarAccaoFiscalizacaoInput, RegistarCoimaInput } from "./fiscalizacao.schema.js";

export class FiscalizacaoDetalheNaoEncontradoError extends Error {}

/** `TipoAccaoFiscalizacao` (domínio) mapeia 1:1 para `TipoProcessoGenerico` (motor). */
function paraTipoProcessoGenerico(tipoAccao: CriarAccaoFiscalizacaoInput["tipoAccao"]): TipoProcessoGenerico {
  return tipoAccao as unknown as TipoProcessoGenerico;
}

export async function criarAccaoFiscalizacao(params: {
  municipioId: string;
  executorId: string;
  dados: CriarAccaoFiscalizacaoInput;
}) {
  // Reaproveita o motor de processos existente — cria o ProcessoGenerico
  // com número sequencial, prazo legal e notificação ao GAM já incluídos.
  const processo = await criarProcesso({
    municipioId: params.municipioId,
    tipo: paraTipoProcessoGenerico(params.dados.tipoAccao),
    origem: "INTERNO",
    assunto: params.dados.assunto,
    requerenteUtilizadorId: params.executorId,
  });

  return withTenantTransaction(params.municipioId, async (tx) => {
    const detalhe = await tx.fiscalizacaoDetalhe.create({
      data: {
        processoId: processo.id,
        municipioId: params.municipioId,
        tipoAccao: params.dados.tipoAccao,
        ...(params.dados.estabelecimentoNome !== undefined && { estabelecimentoNome: params.dados.estabelecimentoNome }),
        ...(params.dados.estabelecimentoEndereco !== undefined && { estabelecimentoEndereco: params.dados.estabelecimentoEndereco }),
        ...(params.dados.tipoInfraccao !== undefined && { tipoInfraccao: params.dados.tipoInfraccao }),
        ...(params.dados.descricaoInfraccao !== undefined && { descricaoInfraccao: params.dados.descricaoInfraccao }),
        ...(params.dados.dataVistoria !== undefined && params.dados.dataVistoria !== null && { dataVistoria: new Date(params.dados.dataVistoria) }),
        ...(params.dados.fiscalResponsavelId !== undefined && { fiscalResponsavelId: params.dados.fiscalResponsavelId }),
      },
    });

    return { processo, detalhe };
  });
}

export async function obterAccaoFiscalizacao(processoId: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const detalhe = await tx.fiscalizacaoDetalhe.findUnique({
      where: { processoId },
      include: { processo: true },
    });
    return detalhe;
  });
}

export async function listarAccoesFiscalizacao(
  filtros: {
    municipioId: string;
    tipoAccao?: "AUTO_NOTICIA" | "CONTRA_ORDENACAO" | "VISTORIA" | undefined;
    estabelecimentoNome?: string | undefined;
  },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.FiscalizacaoDetalheWhereInput = {
    ...(filtros.tipoAccao && { tipoAccao: filtros.tipoAccao }),
    ...(filtros.estabelecimentoNome && {
      estabelecimentoNome: { contains: filtros.estabelecimentoNome, mode: "insensitive" },
    }),
  };

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.fiscalizacaoDetalhe.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { criadoEm: "desc" },
        include: { processo: { select: { id: true, numero: true, estado: true, assunto: true } } },
      }),
      tx.fiscalizacaoDetalhe.count({ where }),
    ]);
    return { data, total };
  });
}

/**
 * "Histórico de estabelecimentos" (secção 13) — vista consolidada de
 * todas as acções de fiscalização já feitas a um dado estabelecimento.
 */
export async function historicoDoEstabelecimento(estabelecimentoNome: string, municipioId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    return tx.fiscalizacaoDetalhe.findMany({
      where: { estabelecimentoNome: { equals: estabelecimentoNome, mode: "insensitive" } },
      orderBy: { criadoEm: "desc" },
      include: { processo: { select: { id: true, numero: true, estado: true, criadoEm: true } } },
    });
  });
}

/**
 * PRINCÍPIO (secção 13): "Aplicação de coimas — Sujeita a despacho do
 * Administrador". Esta função só regista o valor/data — quem a chama
 * (rota) exige a permissão reservada ao Administrador; o fiscal nunca a
 * invoca directamente.
 */
export async function registarCoima(processoId: string, municipioId: string, dados: RegistarCoimaInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const detalhe = await tx.fiscalizacaoDetalhe.findUnique({ where: { processoId } });
    if (!detalhe) throw new FiscalizacaoDetalheNaoEncontradoError("Acção de fiscalização não encontrada.");

    return tx.fiscalizacaoDetalhe.update({
      where: { processoId },
      data: { valorCoima: dados.valorCoima, coimaAplicadaEm: new Date() },
    });
  });
}