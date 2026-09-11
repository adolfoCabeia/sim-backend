import type { Prisma, EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import { LocalizacaoProcesso } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { hasPermission } from "../../modules/auth/rbac/rbac.service.js";
import { transicaoEhValida, ESTADOS_DESPACHO_FINAL } from "./process-engine.states.js";
import { ProcessoGenericoNaoEncontradoError } from "./process-engine.service.js";

export type AcaoDisponivel = {
  id: string;
  disponivel: boolean;
  motivo?: string;
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
}): Promise<{ acoes: AcaoDisponivel[]; processo: { estado: EstadoProcessoGenerico; localizacaoActual: LocalizacaoProcesso } }> {
  return withTenantTransaction(params.municipioId, async (tx) => {
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
        servicoCodigo: true,
      },
    });
    if (!processo) {
      throw new ProcessoGenericoNaoEncontradoError("Processo não encontrado.");
    }

    const [
      temDespacharEncaminhamento,
      temTramitarGabinete,
      temExpedir,
      temAtribuirResponsavel,
      temTransicionar,
      temDespachoFinal,
      temArquivarDigital,
      temArquivoMorto,
    ] = await Promise.all([
      hasPermission(params.executorId, params.municipioId, "processos_genericos:despachar_encaminhamento"),
      hasPermission(params.executorId, params.municipioId, "processos_genericos:tramitar_gabinete"),
      hasPermission(params.executorId, params.municipioId, "processos_genericos:expedir"),
      hasPermission(params.executorId, params.municipioId, "processos_genericos:atribuir_responsavel"),
      hasPermission(params.executorId, params.municipioId, "processos_genericos:transicionar"),
      hasPermission(params.executorId, params.municipioId, "processos_genericos:despacho_final"),
      hasPermission(params.executorId, params.municipioId, "processos_genericos:arquivar_digital"),
      hasPermission(params.executorId, params.municipioId, "arquivo_morto:aceder"),
    ]);

    const podeAgirGabinete = temDespacharEncaminhamento || temTramitarGabinete;
    const ehResponsavelOuLivre =
      !processo.responsavelActualId || processo.responsavelActualId === params.executorId;
    const podeSobrepor = temDespacharEncaminhamento || temTramitarGabinete; // chefias

    const loc = processo.localizacaoActual;
    const est = processo.estado;

    function acao(id: string, disponivel: boolean, motivo?: string): AcaoDisponivel {
      return { id, disponivel, ...(motivo && { motivo }) };
    }

    const acoes: AcaoDisponivel[] = [
      acao(
        "receber-resposta-subida",
        loc === LocalizacaoProcesso.RESPOSTA_A_SUBIR && podeAgirGabinete
      ),
      acao(
        "apresentar-administrador",
        loc === LocalizacaoProcesso.EXPEDIENTE && temTramitarGabinete
      ),
      acao(
        "despachar-direccao",
        loc === LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO && temDespacharEncaminhamento
      ),
      acao(
        "despachar-assessor-juridico",
        loc === LocalizacaoProcesso.AGUARDA_DESPACHO_ROTEAMENTO && temDespacharEncaminhamento
      ),
      acao(
        "expedir-direccao",
        loc === LocalizacaoProcesso.EXPEDIENTE_A_ENVIAR && temExpedir
      ),
      acao(
        "auto-atribuir",
        (loc === LocalizacaoProcesso.DIRECCAO_COMPETENTE || loc === LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO) &&
          !processo.responsavelActualId &&
          temAtribuirResponsavel
      ),
      acao(
        "atribuir-funcionario",
        (loc === LocalizacaoProcesso.DIRECCAO_COMPETENTE || loc === LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO) &&
          !processo.responsavelActualId &&
          temAtribuirResponsavel
      ),
      acao(
        "subir-resposta",
        (loc === LocalizacaoProcesso.DIRECCAO_COMPETENTE || loc === LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO) &&
          (temExpedir || temTramitarGabinete) &&
          (ehResponsavelOuLivre || podeSobrepor)
      ),
      acao(
        "preparar-saida",
        loc === LocalizacaoProcesso.DIRECCAO_COMPETENTE &&
          ["DEFERIDO", "INDEFERIDO"].includes(est) &&
          temTransicionar &&
          (ehResponsavelOuLivre || podeSobrepor)
      ),
      acao(
        "submeter-despacho-saida",
        loc === LocalizacaoProcesso.PREPARACAO_SAIDA &&
          ["DEFERIDO", "INDEFERIDO"].includes(est) &&
          temTransicionar &&
          (ehResponsavelOuLivre || podeSobrepor)
      ),
      acao(
        "despachar-saida",
        loc === LocalizacaoProcesso.AGUARDA_DESPACHO_SAIDA &&
          ["DEFERIDO", "INDEFERIDO"].includes(est) &&
          temDespacharEncaminhamento
      ),
      acao(
        "formalizar-envio-externo",
        loc === LocalizacaoProcesso.EXPEDIENTE_SAIDA_A_FORMALIZAR &&
          ["DEFERIDO", "INDEFERIDO"].includes(est) &&
          temExpedir
      ),
    ];

    const opcoesDecisao = TRANSICOES_ESTADO[est] ?? [];
    const exigeDespachoFinal = opcoesDecisao.some((o) => ESTADOS_DESPACHO_FINAL.includes(o));
    const locsDecisaoValidas: Partial<Record<EstadoProcessoGenerico, LocalizacaoProcesso[]>> = {
      RECEBIDO: [LocalizacaoProcesso.DIRECCAO_COMPETENTE, LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO],
      EM_ANALISE: [
        LocalizacaoProcesso.DIRECCAO_COMPETENTE,
        LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO,
        LocalizacaoProcesso.GABINETE_ADMINISTRADOR,
      ],
      EM_PARECER: [
        LocalizacaoProcesso.DIRECCAO_COMPETENTE,
        LocalizacaoProcesso.PARECER_ASSESSOR_JURIDICO,
        LocalizacaoProcesso.GABINETE_ADMINISTRADOR,
      ],
      AGUARDANDO_DESPACHO: [LocalizacaoProcesso.DIRECCAO_COMPETENTE, LocalizacaoProcesso.GABINETE_ADMINISTRADOR],
      DEVOLVIDO: [LocalizacaoProcesso.DIRECCAO_COMPETENTE, LocalizacaoProcesso.GABINETE_ADMINISTRADOR],
    };
    const locsPermitidas = locsDecisaoValidas[est];
    const primeiroEstado = opcoesDecisao[0];
    const decidirDisponivel =
    opcoesDecisao.length > 0 &&
    primeiroEstado !== undefined &&
    transicaoEhValida(est, primeiroEstado) &&
      (!locsPermitidas || locsPermitidas.includes(loc)) &&
      !processo.arquivoMortoEm &&
      (exigeDespachoFinal ? temDespachoFinal : temTransicionar) &&
      (ehResponsavelOuLivre || podeSobrepor);
    acoes.push(acao("decidir", decidirDisponivel));

    acoes.push(acao("arquivar-digital", est === "CONCLUIDO" && !processo.arquivoDigitalEm && temArquivarDigital));
    acoes.push(
      acao(
        "arquivar-morto",
        est === "CONCLUIDO" && !!processo.arquivoDigitalEm && !processo.arquivoMortoEm && temArquivoMorto
      )
    );

    return { acoes: acoes.filter((a) => a.disponivel || a.motivo), processo: { estado: est, localizacaoActual: loc } };
  });
}