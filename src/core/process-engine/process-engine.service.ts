import type {
  Prisma,
  TipoProcessoGenerico,
  OrigemProcessoGenerico,
  AreaResponsabilidade,
} from "../../generated/prisma/client.js";
import { EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { calcularPrazoLegal, diasAlertaPara } from "./sla.config.js";
import {
  transicaoEhValida,
  ESTADOS_COM_OBSERVACAO_INTERNA,
  ESTADOS_FINAIS,
  ESTADOS_DESPACHO_FINAL,
} from "./process-engine.states.js";
import { notificarCidadaoSubmissao, notificarCidadaoTransicao, notificarAtribuicao, notificarGam } from "./process-engine.notifications.js";
import { dispararEnviosPendentes, type EnviosPendentes } from "../notifications/notification.service.js";
import { hasPermission } from "../../modules/auth/rbac/rbac.service.js";
import { obterServicoPorCodigoTx } from "../../modules/servicos/servico.service.js";
import type { ServicoFormatado } from "../../modules/servicos/servico.service.js";
import { LocalizacaoProcesso } from "../../generated/prisma/client.js";
import { circuitoTransicaoEhValida, LOCALIZACOES_DOC_SAIDA_AUTORIZADO } from "./process-engine.circuito.js";
import { criarPagamentoParaProcessoTx } from "../../modules/pagamentos/pagamento.internal.js";

export class ProcessoGenericoNaoEncontradoError extends Error { }
export class TransicaoGenericaInvalidaError extends Error { }
export class ProcessoJaArquivadoError extends Error { }
export class ProcessoNaoConcluidoError extends Error { }
export class DespachoFinalNaoAutorizadoError extends Error { }
export class AreaForaDaDelegacaoError extends Error { }
export class AtribuicaoInvalidaError extends Error { }
export class PagamentoPendenteError extends Error { }
export class ServicoNaoEncontradoError extends Error { }
export class ServicoIncompativelError extends Error { }
export class DocumentacaoIncompletaError extends Error { }
export class AnexoNaoAutorizadoError extends Error { }
export class CircuitoTransicaoInvalidaError extends Error { }
export class DespachoRoteamentoNaoAutorizadoError extends Error { }
export class ExpedicaoNaoAutorizadaError extends Error { }
export class DirecaoNaoEncontradaError extends Error { }
export class DocumentoSaidaForaDeContextoError extends Error { }
export class DocumentoSaidaObrigatorioError extends Error { }
export class AnexoNaoEncontradoError extends Error { }
export class ProcessoNaoAtribuidoAoExecutorError extends Error { }
export class AcaoRestritaAoGamError extends Error { }

const AREA_DO_PERFIL_ADJUNTO: Record<string, AreaResponsabilidade> = {
  ADMINISTRADOR_ADJUNTO_POLITICA: "POLITICA_SOCIAL_COMUNIDADE",
  ADMINISTRADOR_ADJUNTO_ECONOMICA: "ECONOMICA_FINANCEIRA",
  ADMINISTRADOR_ADJUNTO_TECNICA: "TECNICA_INFRAESTRUTURAS_SERVICOS",
};

const PERFIS_COM_VISAO_GLOBAL = ["SUPER_ADMIN", "ADMINISTRADOR_MUNICIPAL"];

const LOCALIZACOES_ADMINISTRATIVAS_GLOBAIS: LocalizacaoProcesso[] = [
  LocalizacaoProcesso.GABINETE_ADMINISTRADOR,
  LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO,
  LocalizacaoProcesso.AGUARDA_DESPACHO_SAIDA,
  LocalizacaoProcesso.EXPEDIENTE_A_ENVIAR,
  LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR,
  LocalizacaoProcesso.RESPOSTA_A_SUBIR,
];

/*
 * ── NOTA IMPORTANTE SOBRE NOTIFICAÇÕES ──────────────────────────────────
 * As funções `notificarX(tx, ...)` (em process-engine.notifications.js)
 * só fazem leituras/escritas de BD dentro da `tx` que recebem — a escrita
 * do registo "APP" e o emit do socket. Elas NÃO enviam email/SMS: devolvem
 * um objecto `EnviosPendentes` (ou uma lista) com o que falta enviar.
 *
 * Padrão adotado em todo este ficheiro:
 *   1. `withTenantTransaction` só faz leituras/escritas de negócio e a
 *      escrita "APP" da notificação, devolvendo os `EnviosPendentes`
 *      (nunca faz await de rede, nem devolve `tx`).
 *   2. Depois do commit, os `EnviosPendentes` são passados a
 *      `dispararEnviosPendentes`, que faz o envio real de email/SMS já
 *      fora de qualquer transacção da BD.
 *   3. Tudo isto acontece dentro de `dispararNotificacaoComEnvio`, que
 *      também apanha e loga qualquer falha — nunca reverte nem falha a
 *      ação de negócio já concluída.
 *
 * Porquê: enviar email/SMS dentro de uma transacção interactive do Prisma
 * é perigoso — se a rede demorar mais que o timeout da tx (tipicamente
 * 5-10s), o commit falha com P2028 ("Transaction not found"), mesmo que
 * as escritas na BD já estivessem prontas há muito tempo. Isolar o envio
 * de rede fora de qualquer tx elimina esse risco por completo.
 */
async function dispararNotificacaoComEnvio(
  municipioId: string,
  contexto: string,
  fn: (tx: Prisma.TransactionClient) => Promise<EnviosPendentes | EnviosPendentes[] | void>
): Promise<void> {
  try {
    const resultado = await withTenantTransaction(municipioId, fn);
    if (!resultado) return;
    const lista = Array.isArray(resultado) ? resultado : [resultado];
    await dispararEnviosPendentes(contexto, ...lista);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[notificacao] Falha ao notificar (${contexto}):`, err);
  }
}

async function verificarSegmentacaoPorArea(
  tx: Prisma.TransactionClient,
  executorId: string,
  direcaoAtualId: string | null
): Promise<void> {
  const perfis = await tx.utilizadorPerfil.findMany({
    where: { utilizadorId: executorId, perfil: { activo: true } },
    select: { perfil: { select: { nome: true } } },
  });
  const nomesPerfis = perfis.map((p) => p.perfil.nome);

  if (nomesPerfis.some((nome) => PERFIS_COM_VISAO_GLOBAL.includes(nome))) {
    return;
  }

  const perfilAdjunto = nomesPerfis.find((nome) => nome in AREA_DO_PERFIL_ADJUNTO);
  if (!perfilAdjunto) {
    return;
  }

  if (!direcaoAtualId) return;

  const direcao = await tx.direcao.findUnique({
    where: { id: direcaoAtualId },
    select: { areaResponsabilidade: true },
  });
  if (!direcao?.areaResponsabilidade) return;

  const areaDoExecutor = AREA_DO_PERFIL_ADJUNTO[perfilAdjunto];
  if (direcao.areaResponsabilidade !== areaDoExecutor) {
    throw new AreaForaDaDelegacaoError(
      `Este processo pertence a uma direcção da área "${direcao.areaResponsabilidade}", fora da sua ` +
      `delegação de competências ("${areaDoExecutor}"). Só o Administrador Municipal tem visão sobre ` +
      `todas as áreas.`
    );
  }
}
// Só permissões verdadeiramente administrativas dispensam a atribuição pessoal
// nas DECISÕES sobre o processo (transicionar). tramitar_gabinete/ver_todos_gabinete
// servem para o Administrador/GAM ver a fila toda, não para staff de direcção agir
// sobre trabalho alheio.
const PERMISSOES_QUE_DISPENSAM_ATRIBUICAO_PESSOAL = [
  "processos_genericos:despachar_encaminhamento",
  "processos_genericos:atribuir_responsavel",
] as const;

async function verificarAtribuicaoPessoal(
  tx: Prisma.TransactionClient,
  executorId: string,
  municipioId: string,
  processoId: string,
  responsavelActualId: string | null
): Promise<void> {
  for (const permissao of PERMISSOES_QUE_DISPENSAM_ATRIBUICAO_PESSOAL) {
    if (await hasPermission(executorId, municipioId, permissao)) return;
  }

  if (responsavelActualId === null) {
    await tx.processoGenerico.update({
      where: { id: processoId },
      data: { responsavelActualId: executorId },
    });
    return;
  }

  if (responsavelActualId !== executorId) {
    throw new ProcessoNaoAtribuidoAoExecutorError(
      "Este processo não te está atribuído, só podes consultá-lo. Pede a um responsável da tua direcção " +
      "para to atribuir antes de agires sobre ele."
    );
  }
}
const SELECT_PROCESSO_GENERICO = {
  id: true,
  numero: true,
  tipo: true,
  origem: true,
  assunto: true,
  estado: true,
  resultado: true,
  requerenteUtilizadorId: true,
  direcaoOrigemId: true,
  direcaoAtualId: true,
  responsavelActualId: true,
  prazoLegalResposta: true,
  diasAlertaAntesPrazo: true,
  alertaEnviadoEm: true,
  escaladoEm: true,
  arquivoDigitalEm: true,
  arquivoMortoEm: true,
  aguardaPagamento: true,
  servicoCodigo: true,
  localizacaoActual: true,
  direcaoDespachadaId: true,
  criadoEm: true,
  alteradoEm: true,
} satisfies Prisma.ProcessoGenericoSelect;

const SELECT_PROCESSO_GENERICO_PUBLICO = {
  id: true,
  numero: true,
  tipo: true,
  origem: true,
  assunto: true,
  estado: true,
  resultado: true,
  prazoLegalResposta: true,
  aguardaPagamento: true,
  servicoCodigo: true,
  criadoEm: true,
  alteradoEm: true,
} satisfies Prisma.ProcessoGenericoSelect;


async function gerarNumeroProcessoGenerico(
  tx: Prisma.TransactionClient,
  params: { municipioId: string; tipo: TipoProcessoGenerico; direcaoOrigemId: string | null }
): Promise<string> {
  const ano = new Date().getFullYear();
  const inicioAno = new Date(`${ano}-01-01T00:00:00.000Z`);
  const inicioProximoAno = new Date(`${ano + 1}-01-01T00:00:00.000Z`);
  const contagem = await tx.processoGenerico.count({
    where: {
      municipioId: params.municipioId,
      tipo: params.tipo,
      direcaoOrigemId: params.direcaoOrigemId,
      criadoEm: { gte: inicioAno, lt: inicioProximoAno },
    },
  });
  return `${String(contagem + 1).padStart(3, "0")}/${ano}`;
}

async function obterProcessoGenericoOuFalhar(tx: Prisma.TransactionClient, processoId: string) {
  const processo = await tx.processoGenerico.findUnique({ where: { id: processoId } });
  if (!processo) {
    throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado.");
  }
  return processo;
}

export async function documentosEmFalta(
  tx: Prisma.TransactionClient,
  processoId: string,
  servicoCodigo: string
): Promise<ServicoFormatado["documentosExigidos"]> {
  const servico = await obterServicoPorCodigoTx(tx, servicoCodigo);
  if (!servico) return [];

  const obrigatorios = servico.documentosExigidos.filter((d) => d.obrigatorio);
  if (obrigatorios.length === 0) return [];

  const anexos = await tx.processoGenericoAnexo.findMany({
    where: { processoId, tipoDocumentoCodigo: { not: null } },
    select: { tipoDocumentoCodigo: true },
  });
  const codigosPresentes = new Set(anexos.map((a: { tipoDocumentoCodigo: string | null }) => a.tipoDocumentoCodigo));

  return obrigatorios.filter((d) => !codigosPresentes.has(d.codigo));
}

export async function criarProcesso(params: {
  municipioId: string;
  tipo: TipoProcessoGenerico;
  origem: OrigemProcessoGenerico;
  assunto: string;
  requerenteUtilizadorId?: string;
  direcaoOrigemId?: string;
  responsavelActualId?: string;
  servicoCodigo?: string;
}) {
  const { processo, requerenteParaNotificar, servicoNome, temPagamento } = await withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const servico = params.servicoCodigo ? await obterServicoPorCodigoTx(tx, params.servicoCodigo) : undefined;
      if (params.servicoCodigo && !servico) {
        throw new ServicoNaoEncontradoError(`O serviço "${params.servicoCodigo}" não existe no catálogo.`);
      }
      if (servico) {
        if (servico.tipoProcesso !== params.tipo) {
          throw new ServicoIncompativelError(
            `O serviço "${servico.nome}" é do tipo ${servico.tipoProcesso}, mas foi pedido como ${params.tipo}.`
          );
        }
        if (!servico.origensPermitidas.includes(params.origem)) {
          throw new ServicoIncompativelError(
            `O serviço "${servico.nome}" não pode ser pedido pela origem ${params.origem} ` +
            `(permitido: ${servico.origensPermitidas.join(", ")}).`
          );
        }
      }

      let direcaoOrigemId = params.direcaoOrigemId;
      if (servico && !direcaoOrigemId) {
        direcaoOrigemId = servico.direcaoResponsavel.id;
      }

      const gam = await tx.direcao.findUnique({
        where: { municipioId_sigla: { municipioId: params.municipioId, sigla: "GAM" } },
        select: { id: true },
      });
      if (!gam) {
        throw new DirecaoNaoEncontradaError(
          "O Gabinete do Administrador Municipal (GAM) não está configurado para este município, verifica se o seed foi corrido."
        );
      }

      const numero = await gerarNumeroProcessoGenerico(tx, {
        municipioId: params.municipioId,
        tipo: params.tipo,
        direcaoOrigemId: direcaoOrigemId ?? null,
      });

      const criadoEm = new Date();
      const prazoLegalResposta = calcularPrazoLegal(params.tipo, criadoEm);
      const diasAlertaAntesPrazo = diasAlertaPara(params.tipo);

      const processo = await tx.processoGenerico.create({
        data: {
          municipioId: params.municipioId,
          numero,
          tipo: params.tipo,
          origem: params.origem,
          assunto: params.assunto,
          estado: EstadoProcessoGenerico.RECEBIDO,
          prazoLegalResposta,
          diasAlertaAntesPrazo,
          ...(params.requerenteUtilizadorId !== undefined && { requerenteUtilizadorId: params.requerenteUtilizadorId }),
          ...(direcaoOrigemId !== undefined && { direcaoOrigemId }),
          direcaoAtualId: gam.id,
          ...(params.responsavelActualId !== undefined && { responsavelActualId: params.responsavelActualId }),
          ...(params.servicoCodigo !== undefined && { servicoCodigo: params.servicoCodigo }),
        },
        select: SELECT_PROCESSO_GENERICO,
      });

      await tx.processoGenericoTransicao.create({
        data: {
          processoId: processo.id,
          estadoAnterior: null,
          estadoNovo: EstadoProcessoGenerico.RECEBIDO,
          ...(params.requerenteUtilizadorId !== undefined && { utilizadorId: params.requerenteUtilizadorId }),
          visivelAoCidadao: true,
          ...(servico && {
            observacao: `Solicitação do serviço "${servico.nome}". Documentos exigidos: ${servico.documentosExigidos
              .filter((d) => d.obrigatorio)
              .map((d) => d.nome)
              .join("; ")}.`,
          }),
        },
      });

      if (servico?.pago) {
        await criarPagamentoParaProcessoTx(tx, {
          municipioId: params.municipioId,
          processoId: processo.id,
          ...(servico.valorReferenciaKz !== undefined && { valorReferenciaKz: servico.valorReferenciaKz }),
          ...(params.requerenteUtilizadorId !== undefined && { criadoPorId: params.requerenteUtilizadorId }),
        });

        await tx.processoGenericoTransicao.create({
          data: {
            processoId: processo.id,
            estadoAnterior: EstadoProcessoGenerico.RECEBIDO,
            estadoNovo: EstadoProcessoGenerico.RECEBIDO,
            observacao:
              servico.valorReferenciaKz !== undefined
                ? `Este serviço tem uma taxa associada (${servico.valorReferenciaKz} Kz). Consulte pagamentos para obter a referência de pagamento.`
                : "Este serviço tem uma taxa associada, a confirmar pela Direcção responsável. Consulte pagamentos para obter a referência de pagamento.",
            visivelAoCidadao: true,
          },
        });

        const processoFinal = await tx.processoGenerico.findUniqueOrThrow({
          where: { id: processo.id },
          select: SELECT_PROCESSO_GENERICO,
        });

        // Quando há pagamento pendente, não se notifica já o cidadão da
        // submissão "normal" (fica a aguardar confirmação de pagamento).
        return { processo: processoFinal, requerenteParaNotificar: null, servicoNome: servico?.nome, temPagamento: true };
      }

      let requerenteParaNotificar: { id: string; email: string | null; nomeCompleto: string | null; telefone: string | null } | null = null;
      if (params.requerenteUtilizadorId) {
        const requerente = await tx.utilizador.findUnique({
          where: { id: params.requerenteUtilizadorId },
          select: { id: true, email: true, nomeCompleto: true, telefone: true },
        });
        if (requerente) requerenteParaNotificar = requerente;
      }

      return { processo, requerenteParaNotificar, servicoNome: servico?.nome, temPagamento: false };
    }
  );
  if (requerenteParaNotificar) {
    await dispararNotificacaoComEnvio(params.municipioId, `criarProcesso:cidadao:${processo.id}`, async (tx) => {
      return notificarCidadaoSubmissao(tx, {
        requerenteId: requerenteParaNotificar.id,
        email: requerenteParaNotificar.email,
        nomeCompleto: requerenteParaNotificar.nomeCompleto,
        telefone: requerenteParaNotificar.telefone,
        numeroProcesso: processo.numero,
        processoId: processo.id,
        servicoNome,
      });
    });
  }

  await dispararNotificacaoComEnvio(params.municipioId, `criarProcesso:gam:${processo.id}`, async (tx) => {
    return notificarGam(tx, {
      municipioId: params.municipioId,
      titulo: `Novo processo ${processo.numero}`,
      mensagem: temPagamento
        ? `Um novo processo do tipo "${params.tipo}" foi submetido e aguarda confirmação de pagamento.`
        : `Um novo processo do tipo "${params.tipo}" foi submetido pelo cidadão e aguarda apresentação ao Administrador.`,
      tipo: "PROCESSO_SUBMETIDO",
      processoId: processo.id,
      numeroProcesso: processo.numero,
    });
  });

  return processo;
}

async function avancarLocalizacao(
  tx: Prisma.TransactionClient,
  processo: { id: string; localizacaoActual: LocalizacaoProcesso; numero: string },
  novaLocalizacao: LocalizacaoProcesso,
  params: { executorId: string; observacao?: string; visivelAoCidadao?: boolean; dataExtra?: Prisma.ProcessoGenericoUncheckedUpdateInput }
) {
  if (!circuitoTransicaoEhValida(processo.localizacaoActual, novaLocalizacao)) {
    throw new CircuitoTransicaoInvalidaError(
      `Movimento inválido no circuito administrativo: ${processo.localizacaoActual} -> ${novaLocalizacao}. `
    );
  }

  const actualizado = await tx.processoGenerico.update({
    where: { id: processo.id },
    data: { localizacaoActual: novaLocalizacao, ...(params.dataExtra ?? {}) },
    select: SELECT_PROCESSO_GENERICO,
  });

  await tx.processoGenericoTransicao.create({
    data: {
      processoId: processo.id,
      estadoAnterior: actualizado.estado,
      estadoNovo: actualizado.estado,
      utilizadorId: params.executorId,
      observacao: params.observacao ?? `Movimento no circuito: ${processo.localizacaoActual} → ${novaLocalizacao}.`,
      visivelAoCidadao: params.visivelAoCidadao ?? false,
    },
  });

  return actualizado;
}

export async function apresentarAoAdministrador(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  observacao?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO, params);
  });
}

export async function despacharParaDireccao(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  direcaoDespachadaSigla: string;
  observacao?: string;
}) {
  const podeDespachar = await hasPermission(params.executorId, params.municipioId, "processos_genericos:despachar_encaminhamento");
  if (!podeDespachar) {
    throw new DespachoRoteamentoNaoAutorizadoError(
      "Só o Administrador Municipal (ou Administrador Adjunto/SUPER_ADMIN) pode emitir o despacho que indica a " +
      "Direcção competente."
    );
  }

  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);

    const direcao = await tx.direcao.findUnique({
      where: { municipioId_sigla: { municipioId: params.municipioId, sigla: params.direcaoDespachadaSigla } },
      select: { id: true, nome: true },
    });
    if (!direcao) {
      throw new DirecaoNaoEncontradaError(`A direcção "${params.direcaoDespachadaSigla}" não existe neste município.`);
    }

    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.EXPEDIENTE_A_ENVIAR, {
      ...params,
      observacao: params.observacao ?? `Despacho do Administrador: encaminhado para ${direcao.nome}.`,
      dataExtra: { direcaoDespachadaId: direcao.id },
    });
  });
}

export async function despacharParaAssessorJuridico(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  assessorUtilizadorId: string;
  observacao?: string;
}) {
  const podeDespachar = await hasPermission(params.executorId, params.municipioId, "processos_genericos:despachar_encaminhamento");
  if (!podeDespachar) {
    throw new DespachoRoteamentoNaoAutorizadoError(
      "Só o Administrador Municipal (ou Administrador Adjunto/SUPER_ADMIN) pode despachar para o Assessor Jurídico."
    );
  }

  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);

    const assessor = await tx.utilizador.findFirst({
      where: {
        id: params.assessorUtilizadorId,
        estado: "ACTIVA",
        perfis: { some: { perfil: { nome: "ASSESSOR_JURIDICO" } } },
      },
      select: { id: true, nomeCompleto: true },
    });
    if (!assessor) {
      throw new DespachoRoteamentoNaoAutorizadoError(
        "O utilizador indicado não existe, não está activo, ou não tem o perfil ASSESSOR_JURIDICO."
      );
    }

    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO, {
      ...params,
      observacao: params.observacao ?? `Despacho do Administrador: parecer solicitado ao Assessor Jurídico ${assessor.nomeCompleto}.`,
      dataExtra: { responsavelActualId: assessor.id },
    });
  });
}


export async function expedirParaDireccao(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    if (!processo.direcaoDespachadaId) {
      throw new ExpedicaoNaoAutorizadaError("Este processo ainda não tem uma direcção despachada pelo Administrador, não há o que expedir.");
    }

    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.DIRECCAO_COMPETENTE, {
      ...params,
      observacao: params.observacao ?? "Expedido formalmente pela Secretaria Geral/Secção de Expediente.",
      dataExtra: { direcaoAtualId: processo.direcaoDespachadaId },
    });
  });
}

export async function subirResposta(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  viaExpediente: boolean;
  observacao?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    const caminho = params.viaExpediente
      ? "Resultado a subir via Secretaria Geral/Expediente."
      : "Resultado a subir directamente ao Gabinete do Administrador.";
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.RESPOSTA_A_SUBIR, {
      ...params,
      observacao: params.observacao ?? caminho,
    });
  });
}

export async function prepararSaida(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    await verificarAtribuicaoPessoal(tx, params.executorId, params.municipioId, processo.id, processo.responsavelActualId);
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.PREPARACAO_SAIDA, params);
  });
}

export async function submeterParaDespachoSaida(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    await verificarAtribuicaoPessoal(tx, params.executorId, params.municipioId, processo.id, processo.responsavelActualId);
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.AGUARDA_DESPACHO_SAIDA, params);
  });
}


export async function despacharSaida(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  autorizar: boolean;
  observacao?: string;
}) {
  const podeDespachar = await hasPermission(params.executorId, params.municipioId, "processos_genericos:despachar_encaminhamento");
  if (!podeDespachar) {
    throw new DespachoRoteamentoNaoAutorizadoError("Só o Administrador Municipal (ou Adjunto/SUPER_ADMIN) pode despachar a saída de um processo.");
  }

  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);

    if (params.autorizar) {
      await exigirAnexoSaida(tx, processo.id);
    }

    const destino = params.autorizar ? LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR : LocalizacaoProcesso.DIRECCAO_COMPETENTE;
    return avancarLocalizacao(tx, processo, destino, {
      ...params,
      observacao: params.observacao ?? (params.autorizar ? "Saída autorizada pelo Administrador." : "Saída recusada, devolvido à Direcção de origem."),
    });
  });
}

async function exigirAnexoSaida(tx: Prisma.TransactionClient, processoId: string): Promise<void> {
  const anexoSaida = await tx.processoGenericoAnexo.findFirst({
    where: { processoId, tipoAnexo: "SAIDA" },
  });
  if (!anexoSaida) {
    throw new DocumentoSaidaObrigatorioError(
      "Não há nenhum documento de saída (PDF) anexado a este processo. Anexe-o via " +
      "no formulário (tipoAnexo=SAIDA) antes de autorizar/formalizar a saída."
    );
  }
}

export async function formalizarEnvioExterno(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  destinoExterno: string;
  observacao?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    await exigirAnexoSaida(tx, processo.id);
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.EXPEDIDO_EXTERNO, {
      ...params,
      observacao: params.observacao ?? `Envio formalizado para: ${params.destinoExterno}.`,
    });
  });
}

export async function transicionar(params: {
  municipioId: string;
  processoId: string;
  novoEstado: EstadoProcessoGenerico;
  executorId: string;
  observacao?: string;
  visivelAoCidadao?: boolean;
  novoResponsavelActualId?: string;
  novaDirecaoAtualId?: string;
}) {
  if (ESTADOS_DESPACHO_FINAL.includes(params.novoEstado)) {
    const podeDespacharFinal = await hasPermission(
      params.executorId,
      params.municipioId,
      "processos_genericos:despacho_final"
    );
    if (!podeDespacharFinal) {
      throw new DespachoFinalNaoAutorizadoError(
        `Só quem tem a permissão "processos_genericos:despacho_final" pode aplicar despacho final ` +
        `(Deferido/Indeferido). Este utilizador só pode instruir o processo.`
      );
    }
  }

  const { actualizado, notificacaoCidadao } = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);

    if (processo.arquivoMortoEm) {
      throw new ProcessoJaArquivadoError("Processo em Arquivo Morto, não pode ser transicionado sem desarquivar primeiro.");
    }
    if (processo.aguardaPagamento) {
      throw new PagamentoPendenteError(
        "Este processo tem um pagamento (RUPE) pendente de confirmação, não pode avançar até o pagamento ser " +
        "confirmado. Consulte pagamentos"
      );
    }
    if (processo.estado === EstadoProcessoGenerico.RECEBIDO && processo.servicoCodigo) {
      const emFalta = await documentosEmFalta(tx, processo.id, processo.servicoCodigo);
      if (emFalta.length > 0) {
        throw new DocumentacaoIncompletaError(
          `Faltam documentos obrigatórios para este serviço: ${emFalta.map((d) => d.nome).join("; ")}. ` +
          `Anexe-os via anexos antes de avançar.`
        );
      }
    }
    if (processo.estado === EstadoProcessoGenerico.RECEBIDO && params.novoEstado === EstadoProcessoGenerico.EM_ANALISE) {
      const noCircuitoCorrecto =
        processo.localizacaoActual === LocalizacaoProcesso.DIRECCAO_COMPETENTE ||
        processo.localizacaoActual === LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO;
      if (!noCircuitoCorrecto) {
        throw new CircuitoTransicaoInvalidaError(
          `Este processo ainda não percorreu o circuito administrativo (Gabinete do Administrador → despacho → ` +
          `Secretaria Geral/Expediente → Direcção). Localização actual: ${processo.localizacaoActual}. ` +
          `Use apresentarAoAdministrador → despacharParaDireccao → expedirParaDireccao antes de transicionar o estado.`
        );
      }
    }

    if (!transicaoEhValida(processo.estado, params.novoEstado)) {
      throw new TransicaoGenericaInvalidaError(
        `Transição inválida: ${processo.estado} → ${params.novoEstado}. ` +
        `Consulte process-engine.states.ts para as transições permitidas.`
      );
    }

    await verificarSegmentacaoPorArea(tx, params.executorId, processo.direcaoAtualId);
    await verificarAtribuicaoPessoal(tx, params.executorId, params.municipioId, processo.id, processo.responsavelActualId);

    const visivelAoCidadao =
      params.visivelAoCidadao ?? !ESTADOS_COM_OBSERVACAO_INTERNA.includes(params.novoEstado);

    const actualizado = await tx.processoGenerico.update({
      where: { id: processo.id },
      data: {
        estado: params.novoEstado,
        ...(params.novoResponsavelActualId !== undefined && { responsavelActualId: params.novoResponsavelActualId }),
        ...(params.novaDirecaoAtualId !== undefined && { direcaoAtualId: params.novaDirecaoAtualId }),
        ...(ESTADOS_DESPACHO_FINAL.includes(params.novoEstado) && {
          localizacaoActual: LocalizacaoProcesso.PREPARACAO_SAIDA,
        }),
        ...(params.novoEstado === EstadoProcessoGenerico.CONCLUIDO && {
          localizacaoActual: LocalizacaoProcesso.CONCLUIDO_NOTIFICADO,
        }),
      },
      select: SELECT_PROCESSO_GENERICO,
    });

    await tx.processoGenericoTransicao.create({
      data: {
        processoId: processo.id,
        estadoAnterior: processo.estado,
        estadoNovo: params.novoEstado,
        utilizadorId: params.executorId,
        ...(params.observacao !== undefined && { observacao: params.observacao }),
        visivelAoCidadao,
      },
    });

    let notificacaoCidadao: {
      requerenteId: string;
      email: string | null;
      nomeCompleto: string | null;
      telefone: string | null;
    } | null = null;

    if (processo.requerenteUtilizadorId && visivelAoCidadao) {
      const requerente = await tx.utilizador.findUnique({
        where: { id: processo.requerenteUtilizadorId },
        select: { email: true, nomeCompleto: true, telefone: true },
      });
      if (requerente) {
        notificacaoCidadao = { requerenteId: processo.requerenteUtilizadorId, ...requerente };
      }
    }

    return { actualizado, notificacaoCidadao };
  });

  // ── Notificação do cidadão: fora da transação de escrita ──
  if (notificacaoCidadao) {
    await dispararNotificacaoComEnvio(params.municipioId, `transicionar:cidadao:${params.processoId}`, async (tx) => {
      return notificarCidadaoTransicao(tx, {
        requerenteId: notificacaoCidadao.requerenteId,
        email: notificacaoCidadao.email,
        nomeCompleto: notificacaoCidadao.nomeCompleto,
        telefone: notificacaoCidadao.telefone,
        numeroProcesso: actualizado.numero,
        processoId: actualizado.id,
        estadoNovo: traduzirEstado(params.novoEstado),
        observacao: params.observacao,
      });
    });
  }

  return actualizado;
}

function traduzirEstado(estado: EstadoProcessoGenerico): string {
  const nomes: Record<EstadoProcessoGenerico, string> = {
    RECEBIDO: "Recebido",
    EM_ANALISE: "Em Análise",
    EM_PARECER: "Em Parecer",
    AGUARDANDO_DESPACHO: "Aguardando Despacho",
    DEFERIDO: "Deferido",
    INDEFERIDO: "Indeferido",
    CONCLUIDO: "Concluído",
    DEVOLVIDO: "Devolvido (falta de informação)",
  };
  return nomes[estado] ?? estado;
}

export async function atribuirResponsavel(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  novoResponsavelActualId: string;
}) {
  const { actualizado, funcionario, atribuidoPorNome, numeroProcesso } = await withTenantTransaction(
    params.municipioId,
    async (tx) => {
      const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);

      if (processo.arquivoMortoEm) {
        throw new ProcessoJaArquivadoError("Processo em Arquivo Morto, não pode ser reatribuído sem desarquivar primeiro.");
      }
      if (!processo.direcaoAtualId) {
        throw new AtribuicaoInvalidaError("Este processo ainda não tem uma direcção atribuída, atribua a direcção primeiro.");
      }

      const funcionario = await tx.utilizador.findUnique({
        where: { id: params.novoResponsavelActualId },
        select: { id: true, direcaoId: true, estado: true, nomeCompleto: true, email: true },
      });
      if (!funcionario || funcionario.estado !== "ACTIVA") {
        throw new AtribuicaoInvalidaError("O funcionário indicado não existe ou não está activo.");
      }
      if (funcionario.direcaoId !== processo.direcaoAtualId) {
        throw new AtribuicaoInvalidaError(
          "O funcionário indicado não pertence à direcção actual deste processo — só se pode indicar alguém do próprio gabinete."
        );
      }

      const executor = await tx.utilizador.findUnique({
        where: { id: params.executorId },
        select: { nomeCompleto: true },
      });

      const actualizado = await tx.processoGenerico.update({
        where: { id: processo.id },
        data: { responsavelActualId: params.novoResponsavelActualId },
        select: SELECT_PROCESSO_GENERICO,
      });

      await tx.processoGenericoTransicao.create({
        data: {
          processoId: processo.id,
          estadoAnterior: processo.estado,
          estadoNovo: processo.estado,
          utilizadorId: params.executorId,
          observacao: `Processo atribuído a ${funcionario.nomeCompleto} para tratamento.`,
          visivelAoCidadao: false,
        },
      });

      return {
        actualizado,
        funcionario,
        atribuidoPorNome: executor?.nomeCompleto ?? "Administração Municipal",
        numeroProcesso: processo.numero,
      };
    }
  );
  await dispararNotificacaoComEnvio(params.municipioId, `atribuirResponsavel:${params.processoId}`, async (tx) => {
    return notificarAtribuicao(tx, {
      funcionarioId: funcionario.id,
      email: funcionario.email,
      nomeCompleto: funcionario.nomeCompleto,
      numeroProcesso: numeroProcesso,
      processoId: params.processoId,
      atribuidoPorNome,
    });
  });

  return actualizado;
}

export async function listarFuncionariosParaAtribuicao(params: { municipioId: string; direcaoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const funcionarios = await tx.utilizador.findMany({
      where: { direcaoId: params.direcaoId, estado: "ACTIVA", tipoConta: "INTERNO" },
      select: { id: true, nomeCompleto: true, email: true },
      orderBy: { nomeCompleto: "asc" },
    });

    if (funcionarios.length === 0) return [];

    const contagens = await tx.processoGenerico.groupBy({
      by: ["responsavelActualId"],
      where: {
        municipioId: params.municipioId,
        arquivoMortoEm: null,
        responsavelActualId: { in: funcionarios.map((f) => f.id) },
      },
      _count: { _all: true },
    });
    const contagemPorId = new Map(contagens.map((c) => [c.responsavelActualId as string, c._count._all]));

    return funcionarios.map((f) => ({
      id: f.id,
      nomeCompleto: f.nomeCompleto,
      email: f.email,
      processosAtribuidos: contagemPorId.get(f.id) ?? 0,
    }));
  });
}

export async function obterTimelineCidadao(params: { municipioId: string; processoId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: SELECT_PROCESSO_GENERICO,
    });
    if (!processo) {
      throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado.");
    }
    if (processo.requerenteUtilizadorId !== params.utilizadorId) {
      throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado."); // não revelar existência a terceiros
    }

    const transicoes = await tx.processoGenericoTransicao.findMany({
      where: { processoId: processo.id, visivelAoCidadao: true },
      orderBy: { criadoEm: "asc" },
      select: { id: true, estadoAnterior: true, estadoNovo: true, observacao: true, criadoEm: true },
    });
    if (processo.estado !== EstadoProcessoGenerico.CONCLUIDO) {
      return { timeline: transicoes };
    }

    const processoPublico = await tx.processoGenerico.findUniqueOrThrow({
      where: { id: processo.id },
      select: SELECT_PROCESSO_GENERICO_PUBLICO,
    });

    const documentosSaida = await tx.processoGenericoAnexo.findMany({
      where: { processoId: processo.id, tipoAnexo: "SAIDA" },
      orderBy: { criadoEm: "asc" },
      select: { id: true, nomeFicheiro: true, versao: true, criadoEm: true },
    });

    return { ...processoPublico, timeline: transicoes, documentosSaida };
  });
}

export async function obterAnexoSaidaCidadao(params: {
  municipioId: string;
  processoId: string;
  anexoId: string;
  utilizadorId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { id: true, estado: true, requerenteUtilizadorId: true, localizacaoActual: true },
    });
    if (!processo || processo.requerenteUtilizadorId !== params.utilizadorId) {
      throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado."); // não revelar existência a terceiros
    }
    if (processo.estado !== EstadoProcessoGenerico.CONCLUIDO) {
      throw new AnexoNaoEncontradoError("Documento não encontrado.");
    }
    if (!LOCALIZACOES_DOC_SAIDA_AUTORIZADO.includes(processo.localizacaoActual)) {
      throw new AnexoNaoEncontradoError("Documento não encontrado.");
    }

    const anexo = await tx.processoGenericoAnexo.findUnique({
      where: { id: params.anexoId },
      select: {
        id: true,
        processoId: true,
        nomeFicheiro: true,
        storageKey: true,
        tipoAnexo: true,
        versao: true,
        criadoEm: true,
      },
    });

    if (!anexo || anexo.processoId !== processo.id || anexo.tipoAnexo !== "SAIDA") {
      throw new AnexoNaoEncontradoError("Documento não encontrado.");
    }

    return anexo;
  });
}

export async function obterProcessoInterno(params: { municipioId: string; processoId: string; executorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: {
        ...SELECT_PROCESSO_GENERICO,
       requerente: { select: { nomeCompleto: true } }, 
        direcaoAtual: { select: { id: true, nome: true, sigla: true } },
        direcaoDespachada: { select: { id: true, nome: true, sigla: true } },
        responsavelActual: { select: { id: true, nomeCompleto: true, email: true } },
        transicoes: {
          orderBy: { criadoEm: "asc" },
          select: {
            id: true,
            estadoAnterior: true,
            estadoNovo: true,
            observacao: true,
            visivelAoCidadao: true,
            criadoEm: true,
            utilizador: { select: { id: true, nomeCompleto: true } },
          },
        },
        anexos: {
          orderBy: { criadoEm: "asc" },
          select: {
            id: true,
            nomeFicheiro: true,
            versao: true,
            criadoEm: true,
            utilizadorUpload: { select: { id: true, nomeCompleto: true } },
          },
        },
      },
    });
    if (!processo) {
      throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado.");
    }
    await verificarSegmentacaoPorArea(tx, params.executorId, processo.direcaoAtualId);
    return processo;
  });
}

const LOCALIZACOES_VALIDAS_PARA_ANEXO_SAIDA: LocalizacaoProcesso[] = [
  LocalizacaoProcesso.PREPARACAO_SAIDA,
  LocalizacaoProcesso.AGUARDA_DESPACHO_SAIDA,
  LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR,
];

export async function adicionarAnexo(params: {
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
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);

    if (params.exigirRequerente && processo.requerenteUtilizadorId !== params.utilizadorUploadId) {
      throw new AnexoNaoAutorizadoError("Só o requerente deste processo pode anexar documentos a ele.");
    }

    if (params.origemInterna) {
      await verificarAtribuicaoPessoal(tx, params.utilizadorUploadId, params.municipioId, processo.id, processo.responsavelActualId);
    }

    const tipoAnexo = params.tipoAnexo ?? "ENTRADA";

    if (tipoAnexo === "SAIDA") {
      if (!params.origemInterna) {
        throw new AnexoNaoAutorizadoError(
          "Só uma conta INTERNO (funcionário) pode anexar o documento de saída — o requerente só pode anexar documentos de entrada."
        );
      }
      if (!LOCALIZACOES_VALIDAS_PARA_ANEXO_SAIDA.includes(processo.localizacaoActual)) {
        throw new DocumentoSaidaForaDeContextoError(
          `Só é possível anexar o documento de saída quando o processo está em preparação/despacho de saída. ` +
          `Localização actual: ${processo.localizacaoActual}. Use preparar-saida primeiro.`
        );
      }
    }

    if (params.tipoDocumentoCodigo && processo.servicoCodigo) {
      const servico = await obterServicoPorCodigoTx(tx, processo.servicoCodigo);
      const valido = servico?.documentosExigidos.some((d) => d.codigo === params.tipoDocumentoCodigo);
      if (servico && !valido) {
        throw new ServicoIncompativelError(
          `"${params.tipoDocumentoCodigo}" não é um documento previsto para o serviço "${servico.nome}".`
        );
      }
    }

    const ultimaVersao = await tx.processoGenericoAnexo.findFirst({
      where: { processoId: processo.id, nomeFicheiro: params.nomeFicheiro },
      orderBy: { versao: "desc" },
      select: { versao: true },
    });
    return tx.processoGenericoAnexo.create({
      data: {
        processoId: processo.id,
        nomeFicheiro: params.nomeFicheiro,
        storageKey: params.storageKey,
        versao: (ultimaVersao?.versao ?? 0) + 1,
        utilizadorUploadId: params.utilizadorUploadId,
        tipoAnexo,
        ...(params.tipoDocumentoCodigo !== undefined && { tipoDocumentoCodigo: params.tipoDocumentoCodigo }),
      },
    });
  });
}

export async function obterAnexoProcesso(params: {
  municipioId: string;
  processoId: string;
  anexoId: string;
  executorId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {

    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    await verificarSegmentacaoPorArea(tx, params.executorId, processo.direcaoAtualId);

    const anexo = await tx.processoGenericoAnexo.findUnique({
      where: { id: params.anexoId },
      select: {
        id: true,
        processoId: true,
        nomeFicheiro: true,
        storageKey: true,
        tipoAnexo: true,
        tipoDocumentoCodigo: true,
        versao: true,
        criadoEm: true,
        utilizadorUpload: { select: { id: true, nomeCompleto: true } },
      },
    });

    if (!anexo) {
      throw new AnexoNaoEncontradoError("Documento não encontrado.");
    }

    if (anexo.processoId !== params.processoId) {
      throw new AnexoNaoEncontradoError("Este documento não pertence a este processo.");
    }

    return anexo;
  });
}

export async function moverParaArquivoDigital(params: { municipioId: string; processoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    if (!ESTADOS_FINAIS.includes(processo.estado)) {
      throw new ProcessoNaoConcluidoError("Só processos Concluídos podem ir para Arquivo Digital.");
    }
    return tx.processoGenerico.update({
      where: { id: processo.id },
      data: { arquivoDigitalEm: new Date() },
      select: SELECT_PROCESSO_GENERICO,
    });
  });
}

export async function moverParaArquivoMorto(params: { municipioId: string; processoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    if (!processo.arquivoDigitalEm) {
      throw new ProcessoNaoConcluidoError("Um processo só pode ir para Arquivo Morto depois de passar por Arquivo Digital.");
    }
    return tx.processoGenerico.update({
      where: { id: processo.id },
      data: { arquivoMortoEm: new Date() },
      select: SELECT_PROCESSO_GENERICO,
    });
  });
}

async function obterAreaRestritaParaExecutor(
  tx: Prisma.TransactionClient,
  executorId: string
): Promise<AreaResponsabilidade | undefined> {
  const perfis = await tx.utilizadorPerfil.findMany({
    where: { utilizadorId: executorId, perfil: { activo: true } },
    select: { perfil: { select: { nome: true } } },
  });
  const nomesPerfis = perfis.map((p) => p.perfil.nome);

  if (nomesPerfis.some((nome) => PERFIS_COM_VISAO_GLOBAL.includes(nome))) {
    return undefined;
  }
  const perfilAdjunto = nomesPerfis.find((nome) => nome in AREA_DO_PERFIL_ADJUNTO);
  return perfilAdjunto ? AREA_DO_PERFIL_ADJUNTO[perfilAdjunto] : undefined;
}

export async function listarDocumentosEmFalta(params: { municipioId: string; processoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);
    if (!processo.servicoCodigo) return [];
    return documentosEmFalta(tx, processo.id, processo.servicoCodigo);
  });
}

export async function listarProcessos(params: {
  municipioId: string;
  executorId: string;
  tipo?: TipoProcessoGenerico;
  estado?: EstadoProcessoGenerico;
  origem?: OrigemProcessoGenerico;
  departamentoId?: string;
  direcaoId?: string;
  atribuidosAMim?: boolean;
  aguardaAccaoDe?: string;
  arquivo?: "ACTIVOS" | "DIGITAL" | "MORTO" | "TODOS";
  page: number;
  pageSize: number;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const areaRestrita = await obterAreaRestritaParaExecutor(tx, params.executorId);

    const podeVerTodoGabinete = await hasPermission(
      params.executorId,
      params.municipioId,
      "processos_genericos:ver_todos_gabinete"
    );

    let restricaoVisibilidade: Prisma.ProcessoGenericoWhereInput | undefined;
    if (params.atribuidosAMim || !podeVerTodoGabinete) {
      if (params.atribuidosAMim) {
        restricaoVisibilidade = { responsavelActualId: params.executorId };
      } else {
        const executor = await tx.utilizador.findUnique({
          where: { id: params.executorId },
          select: { direcaoId: true },
        });
        restricaoVisibilidade = {
          OR: [
            { responsavelActualId: params.executorId },
            ...(executor?.direcaoId
              ? [{ responsavelActualId: null, direcaoAtualId: executor.direcaoId } as Prisma.ProcessoGenericoWhereInput]
              : []),
            { localizacaoActual: { in: LOCALIZACOES_ADMINISTRATIVAS_GLOBAIS } },
          ],
        };
      }
    }

    const restricaoDepartamento: Prisma.ProcessoGenericoWhereInput | undefined = params.departamentoId
      ? { responsavelActual: { departamentoId: params.departamentoId } }
      : undefined;
    const restricaoDirecao: Prisma.ProcessoGenericoWhereInput | undefined = params.direcaoId
      ? { direcaoAtualId: params.direcaoId }
      : undefined;

    const restricaoAguardaAccao = params.aguardaAccaoDe
      ? await construirRestricaoAguardaAccao(tx, params.municipioId, params.aguardaAccaoDe)
      : undefined;

    const restricaoArquivo: Prisma.ProcessoGenericoWhereInput =
      params.arquivo === "DIGITAL"
        ? { arquivoDigitalEm: { not: null }, arquivoMortoEm: null }
        : params.arquivo === "MORTO"
          ? { arquivoMortoEm: { not: null } }
          : params.arquivo === "TODOS"
            ? {}
            : { arquivoDigitalEm: null, arquivoMortoEm: null };

    const where: Prisma.ProcessoGenericoWhereInput = {
      municipioId: params.municipioId,
      ...(params.tipo !== undefined && { tipo: params.tipo }),
      ...(params.estado !== undefined && { estado: params.estado }),
      ...(params.origem !== undefined && { origem: params.origem }),
      ...(areaRestrita !== undefined && { direcaoAtual: { areaResponsabilidade: areaRestrita } }),
      ...(restricaoVisibilidade ?? {}),
      ...(restricaoDepartamento ?? {}),
      ...(restricaoDirecao ?? {}),
      ...(restricaoAguardaAccao ?? {}),
      ...restricaoArquivo,
    };
    const [items, total] = await Promise.all([
      tx.processoGenerico.findMany({
        where,
        select: SELECT_PROCESSO_GENERICO,
        orderBy: { criadoEm: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      tx.processoGenerico.count({ where }),
    ]);
    return { items, page: params.page, pageSize: params.pageSize, total, totalPages: Math.ceil(total / params.pageSize) };
  });
}

async function construirRestricaoAguardaAccao(
  tx: Prisma.TransactionClient,
  municipioId: string,
  utilizadorAlvoId: string
): Promise<Prisma.ProcessoGenericoWhereInput> {
  const [executorAlvo, temDespacharEncaminhamento, temTramitarGabinete, temAtribuirResponsavel] = await Promise.all([
    tx.utilizador.findUnique({ where: { id: utilizadorAlvoId }, select: { direcaoId: true } }),
    hasPermission(utilizadorAlvoId, municipioId, "processos_genericos:despachar_encaminhamento"),
    hasPermission(utilizadorAlvoId, municipioId, "processos_genericos:tramitar_gabinete"),
    hasPermission(utilizadorAlvoId, municipioId, "processos_genericos:atribuir_responsavel"),
  ]);

  const podeAgirNoGabinete = temDespacharEncaminhamento || temTramitarGabinete;

  const condicoes: Prisma.ProcessoGenericoWhereInput[] = [
    { responsavelActualId: utilizadorAlvoId },
    ...(podeAgirNoGabinete
      ? [{ localizacaoActual: { in: LOCALIZACOES_ADMINISTRATIVAS_GLOBAIS } } as Prisma.ProcessoGenericoWhereInput]
      : []),
    ...(executorAlvo?.direcaoId && temAtribuirResponsavel
      ? [
        {
          responsavelActualId: null,
          direcaoAtualId: executorAlvo.direcaoId,
        } as Prisma.ProcessoGenericoWhereInput,
      ]
      : []),
  ];

  return { OR: condicoes, estado: { not: "CONCLUIDO" } };
}


export async function receberRespostaSubida(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  observacao?: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoGenericoOuFalhar(tx, params.processoId);

    if (processo.localizacaoActual !== LocalizacaoProcesso.RESPOSTA_A_SUBIR) {
      throw new CircuitoTransicaoInvalidaError(
        `Só é possível receber uma resposta subida quando o processo está em "Resposta a subir". ` +
        `Localização actual: ${processo.localizacaoActual}.`
      );
    }

    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.GABINETE_ADMINISTRADOR, {
      ...params,
      observacao: params.observacao ?? "Resposta da direcção recebida no Gabinete do Administrador.",
    });
  });
}