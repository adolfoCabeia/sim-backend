import type { Prisma, EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import { LocalizacaoProcesso } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { hasPermission } from "../../modules/auth/rbac/rbac.service.js";
import { transicaoEhValida, ESTADOS_DESPACHO_FINAL } from "./process-engine.states.js";
import { ProcessoGenericoNaoEncontradoError } from "./process-engine.service.js";
import {
  SIGLA_SECRETARIA_GERAL,
  carregarContextoExecutor,
  descreverVez,
  determinarVez,
  estaEmDireccao,
  executorTemAVez,
  podeSubirDirecto,
  type PapelDaVez,
} from "./process-engine.vez.js";

const L = LocalizacaoProcesso;

export type AcaoDisponivel = {
  id: string;
  disponivel: boolean;
  motivo?: string;
  /** Frase amigável para mostrar junto ao botão. */
  descricao?: string;
  /** Só em "subir-resposta": para onde a resposta pode subir directamente. */
  destinosPossiveis?: Array<"SG" | "GAM">;
};

export type ResumoDaVez = {
  papel: PapelDaVez;
  /** true → mostrar "A próxima acção é contigo". */
  eTuaVez: boolean;
  /** Texto pronto a mostrar ao utilizador, seja ou não a vez dele. */
  descricao: string;
  acaoEsperada: string;
};

const TRANSICOES_ESTADO: Record<EstadoProcessoGenerico, EstadoProcessoGenerico[]> = {
  RECEBIDO: ["EM_ANALISE"] as EstadoProcessoGenerico[],
  EM_ANALISE: ["EM_PARECER", "DEVOLVIDO"] as EstadoProcessoGenerico[],
  EM_PARECER: ["AGUARDANDO_DESPACHO"] as EstadoProcessoGenerico[],
  AGUARDANDO_DESPACHO: ["DEFERIDO", "INDEFERIDO"] as EstadoProcessoGenerico[],
  DEVOLVIDO: ["EM_ANALISE"] as EstadoProcessoGenerico[],
  DEFERIDO: ["CONCLUIDO"] as EstadoProcessoGenerico[],
  INDEFERIDO: ["CONCLUIDO"] as EstadoProcessoGenerico[],
  CONCLUIDO: [] as EstadoProcessoGenerico[],
};

export async function listarAcoesDisponiveis(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
}): Promise<{
  acoes: AcaoDisponivel[];
  processo: { estado: EstadoProcessoGenerico; localizacaoActual: LocalizacaoProcesso; direcaoAtualId: string | null };
  vez: ResumoDaVez;
}> {
  return withTenantTransaction(params.municipioId, async (tx: Prisma.TransactionClient) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: {
        estado: true,
        localizacaoActual: true,
        responsavelActualId: true,
        direcaoAtualId: true,
        direcaoDespachadaId: true,
        arquivoDigitalEm: true,
        arquivoMortoEm: true,
      },
    });
    if (!processo) {
      throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado.");
    }

    const [ctx, temArquivarDigital, temArquivoMorto] = await Promise.all([
      carregarContextoExecutor(tx, params.municipioId, params.executorId),
      hasPermission(params.executorId, params.municipioId, "processos_genericos:arquivar_digital"),
      hasPermission(params.executorId, params.municipioId, "arquivo_morto:aceder"),
    ]);

    const loc = processo.localizacaoActual;
    const est = processo.estado;

    // ── De quem é a vez? ──────────────────────────────────────────────
    const vez = determinarVez(processo);
    const eTuaVez = executorTemAVez(vez, ctx, processo);
    const daVez = (papel: PapelDaVez) => eTuaVez && vez.papel === papel;
    const daVezDeQuemTrata = eTuaVez && (vez.papel === "RESPONSAVEL" || vez.papel === "CHEFIA_DIRECCAO");

    const emDireccao = estaEmDireccao(loc);
    const semResponsavel = !processo.responsavelActualId;
    const decisaoFinalTomada = est === "DEFERIDO" || est === "INDEFERIDO";
    const sobeDirecto = podeSubirDirecto(ctx, processo);

    // Nomes só para o texto amigável de quem não tem a vez
    const [direcaoAtual, responsavel] = await Promise.all([
      processo.direcaoAtualId
        ? tx.direcao.findUnique({ where: { id: processo.direcaoAtualId }, select: { nome: true, sigla: true } })
        : null,
      processo.responsavelActualId
        ? tx.utilizador.findUnique({ where: { id: processo.responsavelActualId }, select: { nomeCompleto: true } })
        : null,
    ]);

    function acao(id: string, disponivel: boolean, descricao?: string, extra: Partial<AcaoDisponivel> = {}): AcaoDisponivel {
      return { id, disponivel, ...(descricao && { descricao }), ...extra };
    }

    // Se a resposta já está na SG, a única opção de destino é o Gabinete.
    const destinosPossiveis: Array<"SG" | "GAM"> =
      direcaoAtual?.sigla === SIGLA_SECRETARIA_GERAL ? ["GAM"] : ["SG", "GAM"];

    // Regra: antes de subir a resposta (qualquer via) é preciso ter anexado o documento com a resposta.
    const podeSubir = daVezDeQuemTrata && (emDireccao || loc === L.RESPOSTA_A_SUBIR);
    const temDocumentoDeResposta = podeSubir
      ? (await tx.processoGenericoAnexo.count({ where: { processoId: params.processoId, tipoAnexo: "SAIDA" } })) > 0
      : true;

    const acoes: AcaoDisponivel[] = [
      acao(
        "apresentar-administrador",
        loc === L.EXPEDIENTE && est === "RECEBIDO" && daVez("SECRETARIA_GERAL"),
        "Apresentar o processo ao Administrador para ele dar o despacho."
      ),
      acao(
        "receber-resposta-subida",
        loc === L.EXPEDIENTE && est !== "RECEBIDO" && daVez("SECRETARIA_GERAL"),
        "Confirmar que a resposta chegou à Secretaria Geral e entregá-la ao Gabinete do Administrador."
      ),
      acao(
        "despachar-direccao",
        loc === L.AGUARDA_DESPACHO_ROTEAMENTO && daVez("ADMINISTRADOR"),
        "Indicar a direcção que vai tratar o processo. Se for a Secretaria Geral, o processo fica logo lá, sem passo de expedição."
      ),
      acao(
        "despachar-assessor-juridico",
        loc === L.AGUARDA_DESPACHO_ROTEAMENTO && daVez("ADMINISTRADOR"),
        "Pedir parecer ao Assessor Jurídico."
      ),
      acao(
        "expedir-direccao",
        loc === L.EXPEDIENTE_A_ENVIAR && daVez("SECRETARIA_GERAL"),
        "Enviar formalmente o processo para a direcção indicada pelo Administrador."
      ),
      acao(
        "auto-atribuir",
        emDireccao && semResponsavel && daVez("CHEFIA_DIRECCAO"),
        "Ficar tu com este processo."
      ),
      acao(
        "atribuir-funcionario",
        emDireccao && semResponsavel && daVez("CHEFIA_DIRECCAO"),
        "Distribuir o processo a um funcionário da direcção."
      ),
      acao(
        "subir-resposta",
        podeSubir && temDocumentoDeResposta,
        sobeDirecto
          ? "Subir a resposta directamente, à Secretaria Geral ou ao Gabinete do Administrador (tu escolhes)."
          : "Enviar a resposta à chefia da direcção, que a sobe.",
        {
          ...(sobeDirecto && temDocumentoDeResposta && { destinosPossiveis }),
          ...(podeSubir &&
            !temDocumentoDeResposta && {
              motivo:
                "Antes de subir a resposta, anexa o documento com a resposta ao pedido (tipo «Documento de saída»). " +
                "O cidadão só o vê quando o processo estiver concluído.",
            }),
        }
      ),
      acao(
        "preparar-saida",
        loc === L.DIRECCAO_COMPETENTE && decisaoFinalTomada && daVezDeQuemTrata,
        "Começar a preparar o documento de saída."
      ),
      acao(
        "submeter-despacho-saida",
        loc === L.PREPARACAO_SAIDA && decisaoFinalTomada && daVezDeQuemTrata,
        "Enviar o documento de saída ao Administrador para autorização."
      ),
      acao(
        "despachar-saida",
        loc === L.AGUARDA_DESPACHO_SAIDA && decisaoFinalTomada && daVez("ADMINISTRADOR"),
        "Autorizar ou recusar a saída do documento."
      ),
      acao(
        "formalizar-envio-externo",
        loc === L.EXPEDIENTE_SAIDA_A_FORMALIZAR && decisaoFinalTomada && daVez("SECRETARIA_GERAL"),
        "Registar o envio formal do documento ao exterior."
      ),
    ];

    // ── Decidir ───────────────────────────────────────────────────────
    const opcoesDecisao = TRANSICOES_ESTADO[est] ?? [];
    const exigeDespachoFinal = opcoesDecisao.some((o) => ESTADOS_DESPACHO_FINAL.includes(o));
    const locsDecisaoValidas: Partial<Record<EstadoProcessoGenerico, LocalizacaoProcesso[]>> = {
      RECEBIDO: [L.DIRECCAO_COMPETENTE, L.PARECER_ASSESSOR_JURIDICO],
      EM_ANALISE: [L.DIRECCAO_COMPETENTE, L.PARECER_ASSESSOR_JURIDICO, L.GABINETE_ADMINISTRADOR],
      EM_PARECER: [L.DIRECCAO_COMPETENTE, L.PARECER_ASSESSOR_JURIDICO, L.GABINETE_ADMINISTRADOR],
      AGUARDANDO_DESPACHO: [L.DIRECCAO_COMPETENTE, L.GABINETE_ADMINISTRADOR],
      DEVOLVIDO: [L.DIRECCAO_COMPETENTE, L.GABINETE_ADMINISTRADOR],
    };
    const locsPermitidas = locsDecisaoValidas[est];
    const primeiroEstado = opcoesDecisao[0];

    // A decisão final (Deferido/Indeferido) é um acto legal: continua a exigir a permissão.
    // Todas as outras decisões seguem a vez.
    const decidirNaVez = exigeDespachoFinal ? daVez("ADMINISTRADOR") && ctx.podeDespachoFinal : eTuaVez;

    const decidirDisponivel =
      opcoesDecisao.length > 0 &&
      primeiroEstado !== undefined &&
      transicaoEhValida(est, primeiroEstado) &&
      (!locsPermitidas || locsPermitidas.includes(loc)) &&
      !processo.arquivoMortoEm &&
      decidirNaVez;
    acoes.push(
      acao(
        "decidir",
        decidirDisponivel,
        exigeDespachoFinal ? "Dar o despacho final: deferir ou indeferir." : "Registar a decisão / o próximo estado do processo."
      )
    );

    // ── Arquivo (continua por permissão: é tarefa administrativa, não faz parte do circuito) ──
    acoes.push(acao("arquivar-digital", est === "CONCLUIDO" && !processo.arquivoDigitalEm && temArquivarDigital));
    acoes.push(
      acao(
        "arquivar-morto",
        est === "CONCLUIDO" && !!processo.arquivoDigitalEm && !processo.arquivoMortoEm && temArquivoMorto
      )
    );

    return {
      acoes: acoes.filter((a) => a.disponivel || a.motivo),
      processo: { estado: est, localizacaoActual: loc, direcaoAtualId: processo.direcaoAtualId },
      vez: {
        papel: vez.papel,
        eTuaVez,
        acaoEsperada: vez.acaoEsperada,
        descricao: eTuaVez
          ? `A próxima acção é contigo: ${vez.acaoEsperada}`
          : descreverVez(vez, { direcao: direcaoAtual?.nome ?? null, responsavel: responsavel?.nomeCompleto ?? null }),
      },
    };
  });
}