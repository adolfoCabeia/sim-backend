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
import {
  notificarCidadaoSubmissao,
  notificarCidadaoTransicao,
  notificarAtribuicao,
  notificarAcaoProcesso,
} from "./process-engine.notifications.js";
import { dispararEnviosPendentes, type EnviosPendentes } from "../notifications/notification.service.js";
import { hasPermission } from "../../modules/auth/rbac/rbac.service.js";
import { obterServicoPorCodigoTx } from "../../modules/servicos/servico.service.js";
import type { ServicoFormatado } from "../../modules/servicos/servico.service.js";
import { LocalizacaoProcesso } from "../../generated/prisma/client.js";
import { circuitoTransicaoEhValida, LOCALIZACOES_DOC_SAIDA_AUTORIZADO } from "./process-engine.circuito.js";
import { criarPagamentoParaProcessoTx } from "../../modules/pagamentos/pagamento.internal.js";
import {
  SIGLA_GABINETE_ADMINISTRADOR,
  SIGLA_SECRETARIA_GERAL,
  carregarContextoExecutor,
  descreverVez,
  determinarVez,
  ehChefiaDaDireccao,
  executorTemAVez,
  mensagemDaVez,
  podeSubirDirecto,
  resolverDestinatariosDaVez,
  type ProcessoParaVez,
} from "./process-engine.vez.js";

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
  LocalizacaoProcesso.EXPEDIENTE,
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
 *
 * Quem avisa quem depois de cada movimento do circuito está em
 * `notificarAposMovimento` (mais abaixo): quem tem a vez, os internos
 * envolvidos e, nos marcos que lhe interessam, o cidadão.
 */
export async function dispararNotificacaoComEnvio(
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

/**
 * As funções `notificarX(tx, ...)` podem devolver um único `EnviosPendentes`, uma lista deles
 * (um por destinatário) ou nada. Este helper junta qualquer uma dessas formas à lista final.
 */
export function juntarEnvios(
  destino: EnviosPendentes[],
  envio: EnviosPendentes | EnviosPendentes[] | void | null | undefined
): void {
  if (!envio) return;
  if (Array.isArray(envio)) {
    destino.push(...envio);
  } else {
    destino.push(envio);
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

/**
 * Enquanto o processo está atribuído a um funcionário, só ELE age sobre ele — nem a chefia da
 * direcção nem a Administração. A chefia volta a ter a vez quando o funcionário sobe a resposta.
 *
 * Excepções (não é trabalho "do funcionário", é um acto de outro papel na sequência do circuito):
 *  - processo sem responsável: a chefia/Administração age sem ficar com ele; qualquer outro
 *    funcionário fica com o processo ao agir (reclamação);
 *  - a vez é dele por outro papel (ex.: Administrador no despacho final, Gabinete, a chefia
 *    quando o funcionário já subiu a resposta).
 *
 * Deve ser chamada apenas depois de `obterProcessoParaEscrita` (linha do processo
 * bloqueada), para que `responsavelActualId` seja o valor real e dois funcionários
 * não consigam "reclamar" o mesmo processo em simultâneo.
 */
async function verificarAtribuicaoPessoal(
  tx: Prisma.TransactionClient,
  executorId: string,
  municipioId: string,
  processoId: string,
  responsavelActualId: string | null
): Promise<void> {
  if (responsavelActualId === executorId) return;

  const ctx = await carregarContextoExecutor(tx, municipioId, executorId);
  const processo = await tx.processoGenerico.findUniqueOrThrow({
    where: { id: processoId },
    select: {
      estado: true,
      localizacaoActual: true,
      responsavelActualId: true,
      direcaoAtualId: true,
      direcaoDespachadaId: true,
    },
  });

  if (responsavelActualId === null) {
    if (ctx.ehAdministracao || ehChefiaDaDireccao(ctx, processo.direcaoAtualId)) return;
    await tx.processoGenerico.update({
      where: { id: processoId },
      data: { responsavelActualId: executorId },
    });
    return;
  }

  // Processo atribuído a outra pessoa: só passa quem tem a vez POR OUTRO PAPEL (Administrador,
  // Gabinete, SG, ou a chefia quando o funcionário já subiu a resposta). Nunca por "sobrepor".
  const vez = determinarVez(processo);
  if (executorTemAVez(vez, ctx, processo)) return;

  throw new ProcessoNaoAtribuidoAoExecutorError(
    "Este processo está atribuído a outro colega, por isso só ele pode agir agora. " +
    "Voltará à chefia quando ele subir a resposta."
  );
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

/**
 * Gera o número do processo (NNN/ANO) por município + ano + tipo + direcção de origem.
 * Números iguais podem existir entre tipos/direcções diferentes (não há unicidade por município).
 *
 * O advisory lock de transacção serializa a geração para a mesma combinação
 * (município, ano, tipo, direcção): a segunda transacção só faz o `count` depois
 * de a primeira ter feito commit, por isso não há números repetidos dentro do
 * mesmo grupo. O lock é libertado automaticamente no commit/rollback.
 */
async function gerarNumeroProcessoGenerico(
  tx: Prisma.TransactionClient,
  params: {
    municipioId: string;
    tipo: TipoProcessoGenerico;
    direcaoOrigemId: string | null;
  }
): Promise<string> {
  const ano = new Date().getFullYear();

  const inicioAno = new Date(`${ano}-01-01T00:00:00.000Z`);
  const inicioProximoAno = new Date(
    `${ano + 1}-01-01T00:00:00.000Z`
  );

  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(
        concat(
          'processo-generico:',
          ${params.municipioId}::text,
          ':',
          ${String(ano)}::text,
          ':',
          ${String(params.tipo)}::text,
          ':',
          coalesce(${params.direcaoOrigemId}::text, 'NULL')
        )
      )
    )
  `;

  const contagem = await tx.processoGenerico.count({
    where: {
      municipioId: params.municipioId,
      tipo: params.tipo,
      direcaoOrigemId: params.direcaoOrigemId,
      criadoEm: {
        gte: inicioAno,
        lt: inicioProximoAno,
      },
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

/**
 * Bloqueia a linha do processo até ao fim da transacção (lock de linha do Postgres,
 * obtido através de um UPDATE). Qualquer outra transacção que tente escrever no mesmo
 * processo fica à espera do commit/rollback desta, e depois lê o estado já actualizado.
 *
 * Usa o Prisma em vez de SQL cru para não depender do nome da tabela (@@map) nem do
 * tipo do id.
 */
export async function bloquearProcessoGenerico(tx: Prisma.TransactionClient, processoId: string): Promise<void> {
  try {
    await tx.processoGenerico.update({
      where: { id: processoId },
      data: { alteradoEm: new Date() },
      select: { id: true },
    });
  } catch (err) {
    if ((err as { code?: string } | null)?.code === "P2025") {
      throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado.");
    }
    throw err;
  }
}

/**
 * Bloqueia a linha e só depois lê o processo. Usar em TODA a transacção que lê o
 * processo, valida e depois escreve (read-modify-write). Como a leitura acontece
 * depois do lock, vê sempre o estado mais recente.
 */
async function obterProcessoParaEscrita(tx: Prisma.TransactionClient, processoId: string) {
  await bloquearProcessoGenerico(tx, processoId);
  return obterProcessoGenericoOuFalhar(tx, processoId);
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

      // Todo o processo novo entra pela Secretaria Geral, que o apresenta ao Administrador.
      const sg = await tx.direcao.findUnique({
        where: { municipioId_sigla: { municipioId: params.municipioId, sigla: SIGLA_SECRETARIA_GERAL } },
        select: { id: true },
      });
      if (!sg) {
        throw new DirecaoNaoEncontradaError(
          "A Secretaria Geral (SG) não está configurada para este município, verifica se o seed foi corrido."
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
          localizacaoActual: LocalizacaoProcesso.EXPEDIENTE,
          prazoLegalResposta,
          diasAlertaAntesPrazo,
          ...(params.requerenteUtilizadorId !== undefined && { requerenteUtilizadorId: params.requerenteUtilizadorId }),
          ...(direcaoOrigemId !== undefined && { direcaoOrigemId }),
          direcaoAtualId: sg.id,
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

  // Aviso à Secretaria Geral: é ela que apresenta o processo ao Administrador.
  await dispararNotificacaoComEnvio(params.municipioId, `criarProcesso:sg:${processo.id}`, async (tx) => {
    const destinatarios = await resolverDestinatariosDaVez(tx, params.municipioId, {
      papel: "SECRETARIA_GERAL",
      acaoEsperada: "",
      direcaoId: null,
      utilizadorId: null,
    });
    if (destinatarios.length === 0) return;

    const soUm = destinatarios.length === 1;
    return notificarAcaoProcesso(tx, {
      titulo: temPagamento
        ? `Novo processo ${processo.numero} — a aguardar pagamento`
        : soUm
          ? `Novo processo ${processo.numero} — a próxima acção é contigo`
          : `Novo processo ${processo.numero} — a próxima acção é da tua equipa`,
      mensagem: temPagamento
        ? `Foi submetido um pedido do tipo "${params.tipo}" que tem uma taxa associada. Só pode avançar depois de o pagamento ser confirmado.`
        : `Foi submetido um novo pedido do tipo "${params.tipo}". O que falta fazer: apresentá-lo ao Administrador para despacho.`,
      tipo: temPagamento ? "PROCESSO_ATUALIZADO" : "ACAO_REQUERIDA",
      processoId: processo.id,
      numeroProcesso: processo.numero,
      destinatarios,
    });
  });

  return processo;
}

/**
 * Pré-condição: o `processo` recebido deve ter sido obtido com `obterProcessoParaEscrita`
 * (linha bloqueada), para que a validação do circuito não corra sobre dados desactualizados.
 *
 * `mensagemCidadao`: a observação interna (por exemplo a do Administrador) nunca aparece ao
 * cidadão. Quando o movimento é um marco que lhe interessa, regista-se uma SEGUNDA transição,
 * visível, com um texto escrito para ele.
 */
async function avancarLocalizacao(
  tx: Prisma.TransactionClient,
  processo: { id: string; localizacaoActual: LocalizacaoProcesso; numero: string },
  novaLocalizacao: LocalizacaoProcesso,
  params: {
    executorId: string;
    observacao?: string;
    visivelAoCidadao?: boolean;
    mensagemCidadao?: string;
    dataExtra?: Prisma.ProcessoGenericoUncheckedUpdateInput;
  }
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

  if (params.mensagemCidadao) {
    await tx.processoGenericoTransicao.create({
      data: {
        processoId: processo.id,
        estadoAnterior: actualizado.estado,
        estadoNovo: actualizado.estado,
        utilizadorId: params.executorId,
        observacao: params.mensagemCidadao,
        visivelAoCidadao: true,
      },
    });
  }

  return actualizado;
}

/**
 * Garante no backend a mesma regra que os botões mostram: só age quem tem a vez.
 * Deve ser chamada depois de `obterProcessoParaEscrita`.
 */
async function exigirVez(
  tx: Prisma.TransactionClient,
  municipioId: string,
  executorId: string,
  processo: ProcessoParaVez
) {
  const ctx = await carregarContextoExecutor(tx, municipioId, executorId);
  const vez = determinarVez(processo);
  if (!executorTemAVez(vez, ctx, processo)) {
    throw new ProcessoNaoAtribuidoAoExecutorError(
      `Ainda não é a tua vez de agir neste processo. ${descreverVez(vez)}`
    );
  }
  return ctx;
}

/**
 * Avisa, depois do commit:
 *  1. quem tem a vez → "a próxima acção é contigo";
 *  2. os internos envolvidos (quem já mexeu no processo + responsável actual) → "o processo avançou";
 *  3. o cidadão, quando `avisarCidadao` é passado (marcos que lhe interessam).
 * Usar "{quem}" em `oQueAconteceu` para pôr o nome de quem fez a acção.
 * Nunca falha a acção principal: corre dentro de `dispararNotificacaoComEnvio`.
 */
export async function notificarAposMovimento(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  oQueAconteceu: string;
  incluirAdministrador?: boolean;
  ignorarUtilizadorIds?: string[];
  avisarCidadao?: { estado: string; mensagem: string };
}): Promise<void> {
  await dispararNotificacaoComEnvio(params.municipioId, `movimento:${params.processoId}`, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: {
        id: true,
        numero: true,
        estado: true,
        localizacaoActual: true,
        responsavelActualId: true,
        direcaoAtualId: true,
        direcaoDespachadaId: true,
        requerenteUtilizadorId: true,
      },
    });
    if (!processo) return;

    const executor = await tx.utilizador.findUnique({
      where: { id: params.executorId },
      select: { nomeCompleto: true },
    });
    const oQueAconteceu = params.oQueAconteceu.split("{quem}").join(executor?.nomeCompleto ?? "Um colega");

    const vez = determinarVez(processo);
    const excluidos = new Set([params.executorId, ...(params.ignorarUtilizadorIds ?? [])]);
    const envios: EnviosPendentes[] = [];

    // 1) Quem tem a vez
    const daVez = (await resolverDestinatariosDaVez(tx, params.municipioId, vez)).filter(
      (d) => !excluidos.has(d.utilizadorId)
    );
    if (daVez.length > 0) {
      let complemento: string | undefined;
      if (processo.localizacaoActual === LocalizacaoProcesso.EXPEDIENTE_A_ENVIAR && processo.direcaoDespachadaId) {
        const destino = await tx.direcao.findUnique({
          where: { id: processo.direcaoDespachadaId },
          select: { nome: true },
        });
        if (destino) complemento = `Direcção de destino: ${destino.nome}.`;
      }
      const { titulo, mensagem } = mensagemDaVez({
        numero: processo.numero,
        oQueAconteceu,
        vez,
        soUmDestinatario: daVez.length === 1,
        ...(complemento && { complemento }),
      });
      const envio = await notificarAcaoProcesso(tx, {
        titulo,
        mensagem,
        tipo: "ACAO_REQUERIDA",
        processoId: processo.id,
        numeroProcesso: processo.numero,
        destinatarios: daVez,
      });
      juntarEnvios(envios, envio);
    }

    // 2) Internos envolvidos (quem já actuou + responsável actual [+ Administrador])
    const jaAvisados = new Set(daVez.map((d) => d.utilizadorId));
    const idsEnvolvidos = new Set<string>();
    if (processo.responsavelActualId) idsEnvolvidos.add(processo.responsavelActualId);
    const actores = await tx.processoGenericoTransicao.findMany({
      where: { processoId: processo.id, utilizadorId: { not: null } },
      distinct: ["utilizadorId"],
      select: { utilizadorId: true },
    });
    for (const a of actores) if (a.utilizadorId) idsEnvolvidos.add(a.utilizadorId);

    const filtros: Prisma.UtilizadorWhereInput[] = [{ id: { in: [...idsEnvolvidos] } }];
    if (params.incluirAdministrador) {
      filtros.push({ perfis: { some: { perfil: { nome: "ADMINISTRADOR_MUNICIPAL" } } } });
    }
    // tipoConta INTERNO deixa o requerente (cidadão) de fora desta lista
    const envolvidos = (
      await tx.utilizador.findMany({
        where: { municipioId: params.municipioId, estado: "ACTIVA", tipoConta: "INTERNO", OR: filtros },
        select: { id: true, email: true, nomeCompleto: true },
      })
    ).filter((u) => !excluidos.has(u.id) && !jaAvisados.has(u.id));

    if (envolvidos.length > 0) {
      const [direcaoActual, responsavel] = await Promise.all([
        processo.direcaoAtualId
          ? tx.direcao.findUnique({ where: { id: processo.direcaoAtualId }, select: { nome: true } })
          : null,
        processo.responsavelActualId
          ? tx.utilizador.findUnique({ where: { id: processo.responsavelActualId }, select: { nomeCompleto: true } })
          : null,
      ]);
      const envio = await notificarAcaoProcesso(tx, {
        titulo: `Processo ${processo.numero} — novidade`,
        mensagem:
          `${oQueAconteceu} ` +
          descreverVez(vez, { direcao: direcaoActual?.nome ?? null, responsavel: responsavel?.nomeCompleto ?? null }),
        tipo: "PROCESSO_ATUALIZADO",
        processoId: processo.id,
        numeroProcesso: processo.numero,
        destinatarios: envolvidos.map((u) => ({ utilizadorId: u.id, email: u.email, nomeCompleto: u.nomeCompleto })),
      });
      juntarEnvios(envios, envio);
    }

    // 3) Cidadão (só nos marcos que lhe interessam)
    if (params.avisarCidadao && processo.requerenteUtilizadorId) {
      const r = await tx.utilizador.findUnique({
        where: { id: processo.requerenteUtilizadorId },
        select: { id: true, email: true, nomeCompleto: true, telefone: true },
      });
      if (r) {
        const envio = await notificarCidadaoTransicao(tx, {
          requerenteId: r.id,
          email: r.email,
          nomeCompleto: r.nomeCompleto,
          telefone: r.telefone,
          numeroProcesso: processo.numero,
          processoId: processo.id,
          estadoNovo: params.avisarCidadao.estado,
          observacao: params.avisarCidadao.mensagem,
        });
        juntarEnvios(envios, envio);
      }
    }

    return envios;
  });
}

/**
 * A Secretaria Geral apresenta o processo ao Administrador para despacho.
 */
export async function apresentarAoAdministrador(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  observacao?: string;
}) {
  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
    await exigirVez(tx, params.municipioId, params.executorId, processo);
    if (processo.localizacaoActual === LocalizacaoProcesso.EXPEDIENTE && processo.estado !== EstadoProcessoGenerico.RECEBIDO) {
      throw new CircuitoTransicaoInvalidaError(
        "Este processo já trouxe uma resposta da direcção. Entregue-a ao Gabinete do Administrador em vez de a apresentar para novo despacho."
      );
    }
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO, {
      ...params,
      observacao: params.observacao ?? "Processo apresentado ao Administrador para despacho.",
    });
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: "{quem} (Secretaria Geral) apresentou o processo ao Administrador para despacho.",
  });
  return actualizado;
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

  const { actualizado, paraSG, nomeDireccao } = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);

    const direcao = await tx.direcao.findUnique({
      where: { municipioId_sigla: { municipioId: params.municipioId, sigla: params.direcaoDespachadaSigla } },
      select: { id: true, nome: true, sigla: true },
    });
    if (!direcao) {
      throw new DirecaoNaoEncontradaError(`A direcção "${params.direcaoDespachadaSigla}" não existe neste município.`);
    }

    // Tudo o que o Administrador despacha passa pela SG. Se o destino É a SG,
    // não há nada para expedir: o processo fica logo lá.
    if (direcao.sigla === SIGLA_SECRETARIA_GERAL) {
      const mudaDeDireccao = processo.direcaoAtualId !== direcao.id;
      const actualizado = await avancarLocalizacao(tx, processo, LocalizacaoProcesso.DIRECCAO_COMPETENTE, {
        ...params,
        observacao:
          params.observacao ??
          `Despacho do Administrador: o processo ficou na ${direcao.nome}, que fica responsável por o tratar.`,
        mensagemCidadao: `O seu pedido foi encaminhado para a ${direcao.nome}, que vai analisá-lo. Avisamos assim que houver novidades.`,
        dataExtra: {
          direcaoDespachadaId: direcao.id,
          direcaoAtualId: direcao.id,
          ...(mudaDeDireccao && { responsavelActualId: null }),
        },
      });
      return { actualizado, paraSG: true, nomeDireccao: direcao.nome };
    }

    const actualizado = await avancarLocalizacao(tx, processo, LocalizacaoProcesso.EXPEDIENTE_A_ENVIAR, {
      ...params,
      observacao: params.observacao ?? `Despacho do Administrador: encaminhado para ${direcao.nome}.`,
      dataExtra: { direcaoDespachadaId: direcao.id },
    });
    return { actualizado, paraSG: false, nomeDireccao: direcao.nome };
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: paraSG
      ? "O Administrador despachou o processo para a Secretaria Geral."
      : `O Administrador despachou o processo para a ${nomeDireccao}; a Secretaria Geral vai enviá-lo.`,
    ...(paraSG && {
      avisarCidadao: {
        estado: `Em tratamento na ${nomeDireccao}`,
        mensagem: `O seu pedido foi encaminhado para a ${nomeDireccao}, que vai analisá-lo. Avisamos assim que houver novidades.`,
      },
    }),
  });
  return actualizado;
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

  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);

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

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: "O Administrador pediu o parecer jurídico sobre este processo.",
  });
  return actualizado;
}

export async function expedirParaDireccao(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  const { actualizado, nomeDireccao } = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
    await exigirVez(tx, params.municipioId, params.executorId, processo);
    if (!processo.direcaoDespachadaId) {
      throw new ExpedicaoNaoAutorizadaError("Este processo ainda não tem uma direcção despachada pelo Administrador, não há o que expedir.");
    }

    const direcao = await tx.direcao.findUnique({ where: { id: processo.direcaoDespachadaId }, select: { nome: true } });
    const nome = direcao?.nome ?? "direcção competente";
    const mudaDeDireccao = processo.direcaoAtualId !== processo.direcaoDespachadaId;

    const actualizado = await avancarLocalizacao(tx, processo, LocalizacaoProcesso.DIRECCAO_COMPETENTE, {
      ...params,
      observacao: params.observacao ?? `Expedido pela Secretaria Geral para a ${nome}.`,
      mensagemCidadao: `O seu pedido foi encaminhado para a ${nome}, que vai analisá-lo. Avisamos assim que houver novidades.`,
      dataExtra: {
        direcaoAtualId: processo.direcaoDespachadaId,
        ...(mudaDeDireccao && { responsavelActualId: null }),
      },
    });
    return { actualizado, nomeDireccao: nome };
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: `{quem} (Secretaria Geral) enviou o processo para a ${nomeDireccao}.`,
    avisarCidadao: {
      estado: `Em tratamento na ${nomeDireccao}`,
      mensagem: `O seu pedido foi encaminhado para a ${nomeDireccao}, que vai analisá-lo. Avisamos assim que houver novidades.`,
    },
  });
  return actualizado;
}

/**
 * Subida da resposta.
 *  - Director da direcção (ou Administração): sobe directo, sem passo de "receber resposta da
 *    direcção". `viaExpediente` mantém-se no contrato: true = à SG, false = ao GAM.
 *  - Funcionário: deixa a resposta pronta (RESPOSTA_A_SUBIR) e a chefia da direcção sobe-a.
 */
export async function subirResposta(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  viaExpediente: boolean;
  observacao?: string;
}) {
  const { actualizado, sobeDirecto, paraGabinete } = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
    const ctx = await exigirVez(tx, params.municipioId, params.executorId, processo);
    // Regra: não se sobe a resposta (por nenhuma via) sem o documento com a resposta anexado.
    await exigirAnexoSaida(tx, processo.id, "SUBIR_RESPOSTA");

    if (!podeSubirDirecto(ctx, processo)) {
      const actualizado = await avancarLocalizacao(tx, processo, LocalizacaoProcesso.RESPOSTA_A_SUBIR, {
        ...params,
        observacao: params.observacao ?? "Resposta preparada e enviada à chefia da direcção para ser subida.",
      });
      return { actualizado, sobeDirecto: false, paraGabinete: false };
    }

    const direcaoActual = processo.direcaoAtualId
      ? await tx.direcao.findUnique({ where: { id: processo.direcaoAtualId }, select: { sigla: true } })
      : null;
    // Não faz sentido "subir à SG" estando o processo já na SG.
    const jaEstaNaSG = direcaoActual?.sigla === SIGLA_SECRETARIA_GERAL;
    const paraGabinete = !params.viaExpediente || jaEstaNaSG;

    const actualizado = await avancarLocalizacao(
      tx,
      processo,
      paraGabinete ? LocalizacaoProcesso.GABINETE_ADMINISTRADOR : LocalizacaoProcesso.EXPEDIENTE,
      {
        ...params,
        observacao:
          params.observacao ??
          (paraGabinete
            ? "Resposta subida directamente ao Gabinete do Administrador."
            : "Resposta subida à Secretaria Geral, que a entrega ao Gabinete do Administrador."),
      }
    );
    return { actualizado, sobeDirecto: true, paraGabinete };
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: !sobeDirecto
      ? "{quem} deixou a resposta pronta e enviou-a à chefia da direcção."
      : paraGabinete
        ? "{quem} subiu a resposta ao Gabinete do Administrador."
        : "{quem} subiu a resposta à Secretaria Geral.",
  });
  return actualizado;
}

export async function prepararSaida(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
    await verificarAtribuicaoPessoal(tx, params.executorId, params.municipioId, processo.id, processo.responsavelActualId);
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.PREPARACAO_SAIDA, params);
  });
}

export async function submeterParaDespachoSaida(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
    await verificarAtribuicaoPessoal(tx, params.executorId, params.municipioId, processo.id, processo.responsavelActualId);
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.AGUARDA_DESPACHO_SAIDA, params);
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: "{quem} preparou o documento de saída e submeteu-o ao Administrador.",
  });
  return actualizado;
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

  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);

    if (params.autorizar) {
      await exigirAnexoSaida(tx, processo.id);
    }

    const destino = params.autorizar ? LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR : LocalizacaoProcesso.DIRECCAO_COMPETENTE;
    return avancarLocalizacao(tx, processo, destino, {
      ...params,
      observacao: params.observacao ?? (params.autorizar ? "Saída autorizada pelo Administrador." : "Saída recusada, devolvido à Direcção de origem."),
    });
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: params.autorizar
      ? "O Administrador autorizou a saída do documento."
      : "O Administrador recusou a saída do documento e devolveu o processo à direcção.",
  });
  return actualizado;
}

type ContextoAnexoSaida = "SUBIR_RESPOSTA" | "SAIDA";

async function exigirAnexoSaida(
  tx: Prisma.TransactionClient,
  processoId: string,
  contexto: ContextoAnexoSaida = "SAIDA"
): Promise<void> {
  const anexoSaida = await tx.processoGenericoAnexo.findFirst({
    where: { processoId, tipoAnexo: "SAIDA" },
    select: { id: true },
  });
  if (anexoSaida) return;

  throw new DocumentoSaidaObrigatorioError(
    contexto === "SUBIR_RESPOSTA"
      ? "Antes de subir a resposta, anexa o documento com a resposta ao pedido (tipo «Documento de saída»). " +
        "O cidadão só o vê quando o processo estiver concluído."
      : "Não há nenhum documento de saída (PDF) anexado a este processo. Anexe-o (tipo «Documento de saída») " +
        "antes de autorizar/formalizar a saída."
  );
}

export async function formalizarEnvioExterno(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  destinoExterno: string;
  observacao?: string;
}) {
  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
    await exigirVez(tx, params.municipioId, params.executorId, processo);
    await exigirAnexoSaida(tx, processo.id);
    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.EXPEDIDO_EXTERNO, {
      ...params,
      observacao: params.observacao ?? `Envio formalizado para: ${params.destinoExterno}.`,
    });
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: "{quem} (Secretaria Geral) formalizou o envio do documento.",
    avisarCidadao: {
      estado: "Resposta enviada",
      mensagem:
        "A resposta ao seu pedido foi emitida e enviada. Assim que estiver disponível, poderá consultá-la no acompanhamento do seu processo.",
    },
  });
  return actualizado;
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

  const { actualizado, notificacaoCidadao, estadoAnterior } = await withTenantTransaction(params.municipioId, async (tx) => {
    // Lock de linha: duas transições simultâneas sobre o mesmo processo ficam
    // serializadas, e a segunda valida contra o estado já actualizado pela primeira.
    const processo = await obterProcessoParaEscrita(tx, params.processoId);

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
          `Este processo ainda não percorreu o circuito administrativo (Secretaria Geral → Administrador → despacho → ` +
          `Direcção). Localização actual: ${processo.localizacaoActual}. ` +
          `Use apresentarAoAdministrador → despacharParaDireccao (→ expedirParaDireccao, se a direcção não for a SG) ` +
          `antes de transicionar o estado.`
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

    return { actualizado, notificacaoCidadao, estadoAnterior: processo.estado };
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

  // ── Notificação interna: quem tem a vez + envolvidos (+ Administrador) ──
  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu:
      `{quem} mudou o estado do processo de "${traduzirEstado(estadoAnterior)}" ` +
      `para "${traduzirEstado(params.novoEstado)}".` +
      (params.observacao ? ` Nota: ${params.observacao}` : ""),
    incluirAdministrador: true,
  });

  return actualizado;
}

export function traduzirEstado(estado: EstadoProcessoGenerico): string {
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
      const processo = await obterProcessoParaEscrita(tx, params.processoId);

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

  // O funcionário escolhido já foi avisado acima; os restantes envolvidos ficam a saber.
  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    ignorarUtilizadorIds: [funcionario.id],
    oQueAconteceu: `{quem} atribuiu o processo a ${funcionario.nomeCompleto}.`,
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
  // Durante o tratamento: o responsável anexa o documento com a resposta antes de a subir.
  LocalizacaoProcesso.DIRECCAO_COMPETENTE,
  LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO,
  // Fase de saída
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
    // O lock da linha do processo também serializa o cálculo da próxima versão do
    // anexo (findFirst max + create), evitando versões duplicadas.
    const processo = await obterProcessoParaEscrita(tx, params.processoId);

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
          `Só é possível anexar o documento de saída enquanto o processo está em tratamento na direcção, ` +
          `em parecer jurídico ou na fase de saída. Localização actual: ${processo.localizacaoActual}.`
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
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
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
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
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

/**
 * Filtro "Aguarda a minha acção": segue a mesma lógica de "de quem é a vez"
 * (process-engine.vez.ts), em vez de olhar para permissões soltas.
 */
async function construirRestricaoAguardaAccao(
  tx: Prisma.TransactionClient,
  municipioId: string,
  utilizadorAlvoId: string
): Promise<Prisma.ProcessoGenericoWhereInput> {
  const ctx = await carregarContextoExecutor(tx, municipioId, utilizadorAlvoId);
  const L = LocalizacaoProcesso;
  const locsDeTrabalho = [L.DIRECCAO_COMPETENTE, L.PARECER_ASSESSOR_JURIDICO, L.PREPARACAO_SAIDA];
  // Com o processo em "Aguardando despacho", a decisão final é do Administrador.
  const semDecisaoFinalPendente = { estado: { not: "AGUARDANDO_DESPACHO" as const } };

  const condicoes: Prisma.ProcessoGenericoWhereInput[] = [
    // Tenho o processo atribuído e a vez é de quem o trata
    { responsavelActualId: utilizadorAlvoId, localizacaoActual: { in: locsDeTrabalho }, ...semDecisaoFinalPendente },
  ];

  if (ctx.ehChefia && ctx.direcaoId) {
    condicoes.push(
      // Chefia: processos da minha direcção ainda sem responsável
      {
        direcaoAtualId: ctx.direcaoId,
        responsavelActualId: null,
        localizacaoActual: { in: locsDeTrabalho },
        ...semDecisaoFinalPendente,
      },
      // Chefia: respostas de funcionários à espera de serem subidas
      { direcaoAtualId: ctx.direcaoId, localizacaoActual: L.RESPOSTA_A_SUBIR }
    );
  }

  if (ctx.direcaoSigla === SIGLA_SECRETARIA_GERAL) {
    // SG: apresentar ao Administrador, expedir, entregar respostas ao Gabinete e formalizar saídas
    condicoes.push({
      localizacaoActual: { in: [L.EXPEDIENTE, L.EXPEDIENTE_A_ENVIAR, L.EXPEDIENTE_SAIDA_A_FORMALIZAR] },
    });
  }

  if (ctx.ehAdministracao || ctx.direcaoSigla === SIGLA_GABINETE_ADMINISTRADOR) {
    condicoes.push({ localizacaoActual: L.GABINETE_ADMINISTRADOR, ...semDecisaoFinalPendente });
  }

  if (ctx.ehAdministracao) {
    condicoes.push({ localizacaoActual: { in: [L.AGUARDA_DESPACHO_ROTEAMENTO, L.AGUARDA_DESPACHO_SAIDA] } });
    condicoes.push({
      estado: "AGUARDANDO_DESPACHO",
      localizacaoActual: { in: [L.DIRECCAO_COMPETENTE, L.PARECER_ASSESSOR_JURIDICO, L.GABINETE_ADMINISTRADOR] },
    });
  }

  return { OR: condicoes, estado: { not: "CONCLUIDO" } };
}


/**
 * A Secretaria Geral entrega ao Gabinete a resposta que o director subiu por ela.
 * (Nome mantido para não partir controllers/rotas.)
 */
export async function receberRespostaSubida(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  observacao?: string;
}) {
  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await obterProcessoParaEscrita(tx, params.processoId);
    await exigirVez(tx, params.municipioId, params.executorId, processo);

    if (processo.localizacaoActual !== LocalizacaoProcesso.EXPEDIENTE || processo.estado === EstadoProcessoGenerico.RECEBIDO) {
      throw new CircuitoTransicaoInvalidaError(
        `Só é possível entregar uma resposta ao Gabinete quando ela já chegou à Secretaria Geral. ` +
        `Localização actual: ${processo.localizacaoActual}.`
      );
    }

    return avancarLocalizacao(tx, processo, LocalizacaoProcesso.GABINETE_ADMINISTRADOR, {
      ...params,
      observacao: params.observacao ?? "Resposta recebida pela Secretaria Geral e entregue ao Gabinete do Administrador.",
    });
  });

  await notificarAposMovimento({
    municipioId: params.municipioId,
    processoId: params.processoId,
    executorId: params.executorId,
    oQueAconteceu: "{quem} (Secretaria Geral) entregou ao Gabinete a resposta da direcção.",
  });
  return actualizado;
}