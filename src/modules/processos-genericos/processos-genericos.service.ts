import { withTenantTransaction } from "../../config/prisma.js";
import type { TipoProcessoGenerico, OrigemProcessoGenerico, EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import * as ProcessEngine from "../../core/process-engine/process-engine.service.js";
import type { CriarProcessoInput, TransicionarProcessoInput, ListarProcessosGenericosQuery } from "./processos-genericos.schema.js";
import { AreaForaDaDelegacaoError, ProcessoGenericoNaoEncontradoError } from "../../core/process-engine/process-engine.service.js";
import { hasPermission } from "../../modules/auth/rbac/rbac.service.js";
import { revogarSalaProcesso } from "../../core/process-engine/process-engine.chat.realtime.js";

import {
  notificarCidadaoSubmissao,
  notificarCidadaoTransicao,
  notificarAtribuicao,
  notificarGam,
  notificarAcaoProcesso,
} from "../../core/process-engine/process-engine.notifications.js";
export class DirecaoNaoEncontradaError extends Error { }

async function resolverDirecaoOrigemId(municipioId: string, sigla?: string): Promise<string | undefined> {
  if (!sigla) return undefined;
  return withTenantTransaction(municipioId, async (tx) => {
    const direcao = await tx.direcao.findUnique({
      where: { municipioId_sigla: { municipioId, sigla } },
      select: { id: true },
    });
    if (!direcao) {
      throw new DirecaoNaoEncontradaError(`A direcção "${sigla}" não existe neste município.`);
    }
    return direcao.id;
  });
}

/* ── Helper: notifica o novo responsável ── */
async function notificarNovoResponsavel(
  municipioId: string,
  processoId: string,
  novoResponsavelId: string,
  atribuidoPorNome: string
): Promise<void> {
  return withTenantTransaction(municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: processoId },
      select: { numero: true },
    });
    const funcionario = await tx.utilizador.findUnique({
      where: { id: novoResponsavelId },
      select: { id: true, email: true, nomeCompleto: true },
    });
    if (!processo || !funcionario) return;

    await notificarAtribuicao(tx, {
      funcionarioId: funcionario.id,
      email: funcionario.email,
      nomeCompleto: funcionario.nomeCompleto,
      numeroProcesso: processo.numero,
      processoId,
      atribuidoPorNome,
    });
  });
}
async function notificarFuncionariosEnvolvidosTransicao(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  estadoAnterior: EstadoProcessoGenerico;
  estadoNovo: EstadoProcessoGenerico;
  observacao?: string;
}): Promise<void> {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { numero: true, responsavelActualId: true },
    });
    if (!processo) return;

    const condicoesEnvolvidos: object[] = [
      { perfis: { some: { perfil: { nome: { in: ["SUPER_ADMIN", "ADMINISTRADOR_MUNICIPAL"] } } } } },
    ];
    if (processo.responsavelActualId) {
      condicoesEnvolvidos.push({ id: processo.responsavelActualId });
    }

    const envolvidos = await tx.utilizador.findMany({
      where: {
        municipioId: params.municipioId,
        estado: "ACTIVA",
        tipoConta: "INTERNO",
        NOT: { id: params.executorId }, // o executor já sabe o que fez
        OR: condicoesEnvolvidos,
      },
      select: { id: true, email: true, nomeCompleto: true },
    });

    if (envolvidos.length === 0) return;

    // deduplicar (o responsável pode também ter perfil global)
    const unicos = new Map(envolvidos.map((u) => [u.id, u]));

    await notificarAcaoProcesso(tx, {
      titulo: `Processo ${processo.numero} — ${params.estadoNovo}`,
      mensagem:
        `O processo ${processo.numero} transitou de "${params.estadoAnterior}" para ` +
        `"${params.estadoNovo}".` +
        (params.observacao ? ` ${params.observacao}` : ""),
      tipo: "PROCESSO_ATUALIZADO",
      processoId: params.processoId,
      numeroProcesso: processo.numero,
      destinatarios: [...unicos.values()].map((u) => ({
        utilizadorId: u.id,
        email: u.email,
        nomeCompleto: u.nomeCompleto,
      })),
    });
  });
}

export async function criarProcessoGenerico(params: {
  municipioId: string;
  requerenteUtilizadorId: string;
  input: CriarProcessoInput;
}) {
  const direcaoOrigemId = await resolverDirecaoOrigemId(params.municipioId, params.input.direcaoOrigemSigla);

  const processo = await ProcessEngine.criarProcesso({
    municipioId: params.municipioId,
    tipo: params.input.tipo as TipoProcessoGenerico,
    origem: params.input.origem as OrigemProcessoGenerico,
    assunto: params.input.assunto,
    requerenteUtilizadorId: params.requerenteUtilizadorId,
    ...(direcaoOrigemId !== undefined && { direcaoOrigemId }),
    ...(params.input.servicoCodigo !== undefined && { servicoCodigo: params.input.servicoCodigo }),
  });

  /* Notificar cidadão na submissão — 3 vias */
  await withTenantTransaction(params.municipioId, async (tx) => {
    const requerente = await tx.utilizador.findUnique({
      where: { id: params.requerenteUtilizadorId },
      select: { id: true, email: true, nomeCompleto: true, telefone: true },
    });
    if (requerente && processo.numero) {
      await notificarCidadaoSubmissao(tx, {
        requerenteId: requerente.id,
        email: requerente.email ?? "",
        nomeCompleto: requerente.nomeCompleto ?? "",
        telefone: requerente.telefone,
        numeroProcesso: processo.numero,
        processoId: processo.id,
        servicoNome: params.input.servicoCodigo,
      });
    }
  });

  return processo;
}

export async function obterAnexoProcesso(params: {
  municipioId: string;
  processoId: string;
  anexoId: string;
  executorId: string;
}) {
  return ProcessEngine.obterAnexoProcesso(params);
}

export async function obterAnexoSaidaCidadao(params: {
  municipioId: string;
  processoId: string;
  anexoId: string;
  utilizadorId: string;
}) {
  return ProcessEngine.obterAnexoSaidaCidadao(params);
}

export async function adicionarAnexoProcesso(params: {
  municipioId: string;
  processoId: string;
  nomeFicheiro: string;
  storageKey: string;
  utilizadorUploadId: string;
  tipoDocumentoCodigo?: string;
  exigirRequerente?: boolean;
  tipoAnexo?: "ENTRADA" | "SAIDA";
  origemInterna?: boolean;
}) {
  return ProcessEngine.adicionarAnexo(params);
}

export async function listarDocumentosEmFaltaProcesso(params: { municipioId: string; processoId: string }) {
  return ProcessEngine.listarDocumentosEmFalta(params);
}

export async function transicionarProcessoGenerico(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  input: TransicionarProcessoInput;
}) {
  // Guardar o estado anterior para a notificação interna (o motor não o devolve)
  const estadoAnterior = await withTenantTransaction(params.municipioId, async (tx) => {
    const p = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { estado: true },
    });
    return p?.estado;
  });

  const resultado = await ProcessEngine.transicionar({
    municipioId: params.municipioId,
    processoId: params.processoId,
    novoEstado: params.input.novoEstado as EstadoProcessoGenerico,
    executorId: params.executorId,
    ...(params.input.observacao !== undefined && { observacao: params.input.observacao }),
    ...(params.input.visivelAoCidadao !== undefined && { visivelAoCidadao: params.input.visivelAoCidadao }),
  });
  if (estadoAnterior) {
    await notificarFuncionariosEnvolvidosTransicao({
      municipioId: params.municipioId,
      processoId: params.processoId,
      executorId: params.executorId,
      estadoAnterior,
      estadoNovo: params.input.novoEstado as EstadoProcessoGenerico,
      ...(params.input.observacao !== undefined && { observacao: params.input.observacao }),
    });
  }

  return resultado;
}

export async function listarProcessosGenericos(params: { municipioId: string; executorId: string; query: ListarProcessosGenericosQuery }) {
  return ProcessEngine.listarProcessos({
    municipioId: params.municipioId,
    executorId: params.executorId,
    page: params.query.page,
    pageSize: params.query.pageSize,
    arquivo: params.query.arquivo,
    ...(params.query.tipo !== undefined && { tipo: params.query.tipo as TipoProcessoGenerico }),
    ...(params.query.estado !== undefined && { estado: params.query.estado as EstadoProcessoGenerico }),
    ...(params.query.origem !== undefined && { origem: params.query.origem as OrigemProcessoGenerico }),
    ...(params.query.departamentoId !== undefined && { departamentoId: params.query.departamentoId }),
    ...(params.query.direcaoId !== undefined && { direcaoId: params.query.direcaoId }),
    ...(params.query.atribuidosAMim !== undefined && { atribuidosAMim: params.query.atribuidosAMim }),
    ...(params.query.aguardaAccaoDeMim && { aguardaAccaoDe: params.executorId }),
  });
}

export async function obterProcessoGenericoInterno(params: { municipioId: string; processoId: string; executorId: string }) {
  return ProcessEngine.obterProcessoInterno(params);
}

export async function obterTimelineCidadao(params: { municipioId: string; processoId: string; utilizadorId: string }) {
  return ProcessEngine.obterTimelineCidadao(params);
}

export async function arquivarDigital(params: { municipioId: string; processoId: string }) {
  const resultado = await ProcessEngine.moverParaArquivoDigital(params);
  return resultado;
}

export async function arquivarMorto(params: { municipioId: string; processoId: string }) {
  const resultado = await ProcessEngine.moverParaArquivoMorto(params);
  return resultado;
}


export async function atribuirResponsavelProcesso(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  novoResponsavelActualId: string;
}) {
  // captura o responsável ANTES da reatribuição
  const antigoResponsavelId = await withTenantTransaction(params.municipioId, async (tx) => {
    const p = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { responsavelActualId: true },
    });
    return p?.responsavelActualId ?? null;
  });

  const resultado = await ProcessEngine.atribuirResponsavel(params);

  // se mudou de facto de pessoa, expulsa o antigo responsável da sala em tempo real
  if (antigoResponsavelId && antigoResponsavelId !== params.novoResponsavelActualId) {
    revogarSalaProcesso(params.processoId, antigoResponsavelId);
  }

  const executor = await withTenantTransaction(params.municipioId, async (tx) =>
    tx.utilizador.findUnique({ where: { id: params.executorId }, select: { nomeCompleto: true } })
  );

  await notificarNovoResponsavel(
    params.municipioId,
    params.processoId,
    params.novoResponsavelActualId,
    executor?.nomeCompleto ?? "Sistema"
  );

  return resultado;
}
export async function listarFuncionariosParaAtribuicao(params: { municipioId: string; direcaoId: string }) {
  return ProcessEngine.listarFuncionariosParaAtribuicao(params);
}

export async function apresentarAoAdministrador(params: {
  municipioId: string; processoId: string; executorId: string; observacao?: string;
}) {
  const podeApresentar = await hasPermission(params.executorId, params.municipioId, "processos_genericos:apresentar_administrador");
  if (!podeApresentar) throw new Error("Não tem permissão para apresentar processos ao Administrador.");

  const resultado = await ProcessEngine.apresentarAoAdministrador(params);

  // Movimento interno de circuito — o cidadão não é notificado aqui.
  // Só é notificado quando o ESTADO muda de facto (ver transicionarProcessoGenerico).
  await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { id: true, numero: true },
    });
    if (!processo) return;

    await notificarGam(tx, {
      municipioId: params.municipioId,
      titulo: `Processo ${processo.numero} — Apresentado ao Administrador`,
      mensagem: `O processo ${processo.numero} foi apresentado ao Administrador${params.observacao ? ": " + params.observacao : "."}`,
      tipo: "ACAO_REQUERIDA",
      processoId: processo.id,
      numeroProcesso: processo.numero,
    });
  });

  return resultado;
}

export async function despacharParaDireccao(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  direcaoDespachadaSigla: string;
  observacao?: string;
}) {
  const resultado = await ProcessEngine.despacharParaDireccao(params);
  return resultado;
}

export async function despacharParaAssessorJuridico(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  assessorUtilizadorId: string;
  observacao?: string;
}) {
  const resultado = await ProcessEngine.despacharParaAssessorJuridico(params);
  return resultado;
}

export async function expedirParaDireccao(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  const resultado = await ProcessEngine.expedirParaDireccao(params);
  return resultado;
}

export async function subirResposta(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  viaExpediente: boolean;
  observacao?: string;
}) {
  const resultado = await ProcessEngine.subirResposta(params);
}

export async function prepararSaida(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  const resultado = await ProcessEngine.prepararSaida(params);
  return resultado;
}

export async function submeterParaDespachoSaida(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  const resultado = await ProcessEngine.submeterParaDespachoSaida(params);
  return resultado;
}

export async function despacharSaida(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  autorizar: boolean;
  observacao?: string;
}) {
  const resultado = await ProcessEngine.despacharSaida(params);
  const descricao = params.autorizar ? "Saída autorizada" : "Saída não autorizada";
  return resultado;
}

export async function formalizarEnvioExterno(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  destinoExterno: string;
  observacao?: string;
}) {
  const resultado = await ProcessEngine.formalizarEnvioExterno(params);
  return resultado;
}

export async function receberRespostaSubida(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  observacao?: string;
}) {
  const resultado = await ProcessEngine.receberRespostaSubida(params);
  return resultado;
}