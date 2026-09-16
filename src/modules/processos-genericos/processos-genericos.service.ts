import { withTenantTransaction } from "../../config/prisma.js";
import type { Prisma, TipoProcessoGenerico, OrigemProcessoGenerico, EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import * as ProcessEngine from "../../core/process-engine/process-engine.service.js";
import type { CriarProcessoInput, TransicionarProcessoInput, ListarProcessosGenericosQuery } from "./processos-genericos.schema.js";
import { AreaForaDaDelegacaoError, ProcessoGenericoNaoEncontradoError } from "../../core/process-engine/process-engine.service.js";
import { hasPermission } from "../../modules/auth/rbac/rbac.service.js";
import { revogarSalaProcesso } from "../../core/process-engine/process-engine.chat.realtime.js";

import {
  notificarAcaoProcesso,
  notificarGam,
} from "../../core/process-engine/process-engine.notifications.js";
export class DirecaoNaoEncontradaError extends Error { }

/*
 * ── NOTA SOBRE NOTIFICAÇÕES (ver também process-engine.service.ts) ──────
 * As chamadas a notificarX(tx, ...) fazem I/O de rede (email/SMS/push) e
 * NUNCA devem correr dentro da mesma transação de escrita do negócio nem
 * ser aguardadas antes do commit — se a rede demorar, a transação expira
 * (timeout curto) e o commit falha com P2028, mesmo tendo os dados já
 * prontos. Por isso:
 *   1. As transações abaixo só leem/escrevem na BD.
 *   2. As notificações são disparadas DEPOIS, em transações curtas e
 *      independentes, através de `dispararNotificacao`.
 *   3. Falhas de notificação são logadas, nunca revertem a ação principal.
 *
 * Nota adicional: a criação de processo e a atribuição de responsável já
 * notificam o cidadão/funcionário dentro de `ProcessEngine.criarProcesso`
 * e `ProcessEngine.atribuirResponsavel`, respetivamente. As chamadas que
 * existiam aqui a duplicar essas notificações foram removidas.
 */
async function dispararNotificacao(
  municipioId: string,
  contexto: string,
  fn: (tx: Prisma.TransactionClient) => Promise<void>
): Promise<void> {
  try {
    await withTenantTransaction(municipioId, fn);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[notificacao] Falha ao notificar (${contexto}):`, err);
  }
}

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

async function notificarFuncionariosEnvolvidosTransicao(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  estadoAnterior: EstadoProcessoGenerico;
  estadoNovo: EstadoProcessoGenerico;
  observacao?: string;
}): Promise<void> {
  // 1) Leitura pura: descobre quem tem de ser notificado (dentro da tx).
  const dados = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { numero: true, responsavelActualId: true },
    });
    if (!processo) return null;

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

    if (envolvidos.length === 0) return null;

    // deduplicar (o responsável pode também ter perfil global)
    const unicos = new Map(envolvidos.map((u) => [u.id, u]));

    return { numeroProcesso: processo.numero, destinatarios: [...unicos.values()] };
  });

  if (!dados) return;

  // 2) Notificação: fora da transação de leitura, em transação própria e curta.
  await dispararNotificacao(params.municipioId, `transicaoEnvolvidos:${params.processoId}`, async (tx) => {
    await notificarAcaoProcesso(tx, {
      titulo: `Processo ${dados.numeroProcesso} — ${params.estadoNovo}`,
      mensagem:
        `O processo ${dados.numeroProcesso} transitou de "${params.estadoAnterior}" para ` +
        `"${params.estadoNovo}".` +
        (params.observacao ? ` ${params.observacao}` : ""),
      tipo: "PROCESSO_ATUALIZADO",
      processoId: params.processoId,
      numeroProcesso: dados.numeroProcesso,
      destinatarios: dados.destinatarios.map((u) => ({
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

  // ProcessEngine.criarProcesso já trata da notificação ao cidadão e ao GAM
  // internamente (fora da sua transação de escrita) — não repetir aqui.
  const processo = await ProcessEngine.criarProcesso({
    municipioId: params.municipioId,
    tipo: params.input.tipo as TipoProcessoGenerico,
    origem: params.input.origem as OrigemProcessoGenerico,
    assunto: params.input.assunto,
    requerenteUtilizadorId: params.requerenteUtilizadorId,
    ...(direcaoOrigemId !== undefined && { direcaoOrigemId }),
    ...(params.input.servicoCodigo !== undefined && { servicoCodigo: params.input.servicoCodigo }),
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

  // ProcessEngine.transicionar já notifica o cidadão internamente (fora da
  // sua transação de escrita). Aqui só resta notificar internamente os
  // funcionários envolvidos, o que também já corre fora de qualquer
  // transação de escrita (ver notificarFuncionariosEnvolvidosTransicao).
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

  // ProcessEngine.atribuirResponsavel já notifica o novo responsável
  // internamente (fora da sua transação de escrita) — não repetir aqui.
  // (Removida a chamada duplicada a `notificarNovoResponsavel`, que causava
  // notificações repetidas e, mais grave, corria uma segunda operação de
  // rede logo a seguir a uma transação de escrita ainda em curso.)
  const resultado = await ProcessEngine.atribuirResponsavel(params);

  // se mudou de facto de pessoa, expulsa o antigo responsável da sala em tempo real
  if (antigoResponsavelId && antigoResponsavelId !== params.novoResponsavelActualId) {
    revogarSalaProcesso(params.processoId, antigoResponsavelId);
  }

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
  //
  // A leitura do processo (para obter o número) é feita numa transação
  // curta; a notificação ao GAM corre depois, fora dela.
  const processo = await withTenantTransaction(params.municipioId, async (tx) => {
    return tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { id: true, numero: true },
    });
  });

  if (processo) {
    await dispararNotificacao(params.municipioId, `apresentarAoAdministrador:${params.processoId}`, async (tx) => {
      await notificarGam(tx, {
        municipioId: params.municipioId,
        titulo: `Processo ${processo.numero} — Apresentado ao Administrador`,
        mensagem: `O processo ${processo.numero} foi apresentado ao Administrador${params.observacao ? ": " + params.observacao : "."}`,
        tipo: "ACAO_REQUERIDA",
        processoId: processo.id,
        numeroProcesso: processo.numero,
      });
    });
  }

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
  return resultado;
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

/**
 * Regista, no log de auditoria, cada consulta ao Arquivo Morto — exigido
 * pela especificação (secção 8.1): o acesso ao Arquivo Morto depende de
 * liberação explícita do Administrador Municipal e tem de ficar
 * registado. A permissão em si é validada no controller (requer
 * `arquivo_morto:aceder`); esta função só regista o acesso já autorizado.
 */
export async function registarAcessoArquivoMorto(params: {
  municipioId: string;
  utilizadorId: string;
  filtro: "MORTO" | "TODOS";
}) {
  await withTenantTransaction(params.municipioId, async (tx) => {
    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "CONSULTAR_ARQUIVO_MORTO",
        entidade: "ProcessoGenerico",
        detalhes: { filtro: params.filtro },
      },
    });
  });
}