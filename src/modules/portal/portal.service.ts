import type {
  OrigemProcessoGenerico,
  TipoProcessoGenerico,
  EstadoProcessoGenerico,
} from "../../generated/prisma/client.js";

import { withTenantTransaction } from "../../config/prisma.js";
import { criarProcesso } from "../../core/process-engine/process-engine.service.js";
import { gerarUrlVisualizacao } from "../storage/storage.service.js";
import { filtrarServicosCatalogo } from "../servicos/servico.service.js";

import type {
  CriarPedidoPortalInput,
  ListarMeusProcessosQuery,
  ListarServicosPortalQuery,
} from "./portal.schema.js";

export class ProcessoNaoEncontradoError extends Error {}

export class DocumentoNaoDisponivelError extends Error {}

export class OrigemNaoPermitidaError extends Error {}

export type MotivoConversaIndisponivel =
  | "SEM_RESPONSAVEL"
  | "SEM_REQUERENTE"
  | "SEM_ACESSO";

export type ConversaPortal =
  | { disponivel: true; motivo: null }
  | { disponivel: false; motivo: MotivoConversaIndisponivel };

/**
 * Calcula se a conversa do processo está disponível para o requerente,
 * sem expor ao portal o ID do responsável.
 *
 * Espelha `garantirParticipante` em core/process-engine/process-engine.chat.ts
 * (mesma ordem de verificações). Qualquer alteração à regra lá tem de ser
 * replicada aqui.
 */
function calcularConversaPortal(
  processo: {
    requerenteUtilizadorId: string | null;
    responsavelActualId: string | null;
  },
  utilizadorId: string
): ConversaPortal {
  if (!processo.responsavelActualId) {
    return { disponivel: false, motivo: "SEM_RESPONSAVEL" };
  }

  if (!processo.requerenteUtilizadorId) {
    return { disponivel: false, motivo: "SEM_REQUERENTE" };
  }

  const ehRequerente = processo.requerenteUtilizadorId === utilizadorId;
  const ehResponsavelAtual = processo.responsavelActualId === utilizadorId;

  if (!ehRequerente && !ehResponsavelAtual) {
    return { disponivel: false, motivo: "SEM_ACESSO" };
  }

  return { disponivel: true, motivo: null };
}

const TIPO_CONTA_PARA_ORIGEM: Record<string, OrigemProcessoGenerico> = {
  CIDADAO: "CIDADAO",
  EMPRESA: "EMPRESA",
  INSTITUICAO: "INSTITUICAO",
  COMISSAO_MORADORES: "COMISSAO_MORADORES",
};

const NOME_PORTAL_PARA_TIPO_CONTA: Record<string, string> = {
  CIDADAO: "Portal Munícipe",
  EMPRESA: "Portal Empresarial",
  INSTITUICAO: "Portal Institucional",
  COMISSAO_MORADORES: "Painel Comissão de Moradores",
};

export function origemParaTipoConta(
  tipoConta: string
): OrigemProcessoGenerico {
  const origem = TIPO_CONTA_PARA_ORIGEM[tipoConta];

  if (!origem) {
    throw new OrigemNaoPermitidaError(
      `O tipo de conta "${tipoConta}" não corresponde a nenhum dos portais externos (Munícipe/Empresarial/Institucional/Comissão de Moradores).`
    );
  }

  return origem;
}

export async function listarServicosDisponiveis(params: {
  municipioId: string;
  tipoConta: string;
  query?: ListarServicosPortalQuery;
}) {
  const origem = origemParaTipoConta(params.tipoConta);

  return filtrarServicosCatalogo({
    municipioId: params.municipioId,
    origem,
    ...(params.query?.tipo !== undefined && {
      tipoProcesso: params.query.tipo,
    }),
    ...(params.query?.direcaoSigla !== undefined && {
      direcaoResponsavelSigla: params.query.direcaoSigla,
    }),
    ...(params.query?.pago !== undefined && {
      pago: params.query.pago,
    }),
  });
}

export async function obterCapacidadesPortal(params: {
  municipioId: string;
  tipoConta: string;
}) {
  const origem = origemParaTipoConta(params.tipoConta);

  const servicos = await filtrarServicosCatalogo({
    municipioId: params.municipioId,
    origem,
  });

  return {
    portal:
      NOME_PORTAL_PARA_TIPO_CONTA[params.tipoConta] ??
      params.tipoConta,

    origem,

    autenticacao:
      params.tipoConta === "CIDADAO"
        ? "Número do Bilhete de Identidade + senha"
        : params.tipoConta === "EMPRESA"
          ? "Número de Identificação Fiscal (NIF) da empresa + senha"
          : params.tipoConta === "INSTITUICAO"
            ? "E-mail institucional + senha"
            : "Credenciais próprias, atribuídas após certificação da Comissão de Moradores (secção 10.5)",

    servicosDisponiveis: servicos.map((s) => ({
      codigo: s.codigo,
      nome: s.nome,
      tipoProcesso: s.tipoProcesso,
      pago: s.pago,
      valorReferenciaKz: s.valorReferenciaKz,
    })),

    modulosTransversais: {
      solicitarServicosDocumentos:
        "POST /portal/processos (servicoCodigo do catálogo acima)",

      acompanharProcessos:
        "GET /portal/processos e GET /portal/processos/:id — estado + timeline",

      obterDocumentoFinal:
        "GET /portal/processos/:id/documento",

      pagarTaxas:
        "GET /pagamentos/meus — referência RUPE dos serviços pagos",

      marcarAudiencia:
        "POST /agendamentos (tipo ADMINISTRADOR ou ASSISTENTE_SOCIAL)",

      reclamacoesEDenuncias:
        "POST /portal/processos (tipo RECLAMACAO ou DENUNCIA)",

      ...(params.tipoConta === "EMPRESA" && {
        sugestoes:
          "POST /portal/processos (tipo SUGESTAO)",

        doacoes:
          "POST /portal/processos (tipo DOACAO)",
      }),

      ...(params.tipoConta === "INSTITUICAO" && {
        intercambioDeDocumentos:
          "POST /intercambios e GET /intercambios",

        solicitacaoDeCredenciais:
          "POST /validacao-identidade/documentos (dupla aprovação, secção 10.5)",

        directorioInstitucional:
          "GET /contactos-institucionais",
      }),

      ...(params.tipoConta === "COMISSAO_MORADORES" && {
        registoDeOcorrencias:
          "POST /portal/processos (servicoCodigo REGISTO_OCORRENCIA_BAIRRO)",

        comunicacaoDirectaComAdministracao:
          "POST /portal/processos (tipo RECLAMACAO/EXPEDIENTE) + GET /portal/processos/:id/timeline",
      }),
    },
  };
}

/**
 * Criação de processo pelo portal externo.
 *
 * A atomicidade, geração do número, validação do serviço,
 * estado inicial e auditoria devem permanecer no process-engine.
 */
export async function criarPedidoPortal(params: {
  municipioId: string;
  utilizadorId: string;
  tipoConta: string;
  input: CriarPedidoPortalInput;
}) {
  const origem = origemParaTipoConta(params.tipoConta);

  return criarProcesso({
    municipioId: params.municipioId,
    tipo: params.input.tipo as TipoProcessoGenerico,
    origem,
    assunto: params.input.assunto,
    requerenteUtilizadorId: params.utilizadorId,

    ...(params.input.servicoCodigo !== undefined && {
      servicoCodigo: params.input.servicoCodigo,
    }),
  });
}

export async function listarMeusProcessos(params: {
  municipioId: string;
  utilizadorId: string;
  query: ListarMeusProcessosQuery;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where = {
      requerenteUtilizadorId: params.utilizadorId,

      ...(params.query.tipo !== undefined && {
        tipo: params.query.tipo as TipoProcessoGenerico,
      }),

      ...(params.query.estado !== undefined && {
        estado: params.query.estado as EstadoProcessoGenerico,
      }),
    };

    const skip =
      (params.query.page - 1) * params.query.pageSize;

    const [items, total] = await Promise.all([
      tx.processoGenerico.findMany({
        where,
        orderBy: {
          criadoEm: "desc",
        },
        skip,
        take: params.query.pageSize,

        select: {
          id: true,
          numero: true,
          tipo: true,
          assunto: true,
          estado: true,
          resultado: true,
          aguardaPagamento: true,
          servicoCodigo: true,
          criadoEm: true,
          alteradoEm: true,
        },
      }),

      tx.processoGenerico.count({
        where,
      }),
    ]);

    return {
      items,
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / params.query.pageSize)
      ),
    };
  });
}

export async function obterMeuProcesso(params: {
  municipioId: string;
  utilizadorId: string;
  processoId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: {
        id: params.processoId,
      },

      select: {
        id: true,
        numero: true,
        tipo: true,
        assunto: true,
        estado: true,
        resultado: true,
        aguardaPagamento: true,
        servicoCodigo: true,

        // Mantidos apenas para validação interna e para calcular
        // `conversa`. Nunca saem da API pública.
        requerenteUtilizadorId: true,
        responsavelActualId: true,

        criadoEm: true,
        alteradoEm: true,

        transicoes: {
          where: {
            visivelAoCidadao: true,
          },

          orderBy: {
            criadoEm: "asc",
          },

          select: {
            id: true,
            estadoAnterior: true,
            estadoNovo: true,
            observacao: true,
            criadoEm: true,
          },
        },

        anexos: {
          orderBy: {
            criadoEm: "asc",
          },

          select: {
            id: true,
            nomeFicheiro: true,
            versao: true,
            tipoDocumentoCodigo: true,
            criadoEm: true,
            utilizadorUploadId: true,
          },
        },

        pagamentos: {
          orderBy: {
            criadoEm: "desc",
          },

          select: {
            id: true,
            referencia: true,
            entidade: true,
            valor: true,
            estado: true,
            expiraEm: true,
            pagoEm: true,
          },
        },
      },
    });

    /*
     * Não revelar a existência do processo a outro utilizador.
     */
    if (
      !processo ||
      processo.requerenteUtilizadorId !== params.utilizadorId
    ) {
      throw new ProcessoNaoEncontradoError(
        "Processo não encontrado."
      );
    }

    /*
     * Os IDs internos (requerente e responsável) não saem da API
     * pública. O portal recebe apenas o resultado calculado.
     */
    const {
      requerenteUtilizadorId,
      responsavelActualId,
      ...processoPublico
    } = processo;

    return {
      ...processoPublico,
      conversa: calcularConversaPortal(
        { requerenteUtilizadorId, responsavelActualId },
        params.utilizadorId
      ),
    };
  });
}

export async function obterResumoMeusProcessos(params: {
  municipioId: string;
  utilizadorId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where = {
      requerenteUtilizadorId: params.utilizadorId,
    };

    const [gruposPorEstado, gruposPorTipo] = await Promise.all([
      tx.processoGenerico.groupBy({
        by: ["estado"],
        where,
        _count: {
          _all: true,
        },
      }),

      tx.processoGenerico.groupBy({
        by: ["tipo"],
        where,
        _count: {
          _all: true,
        },
      }),
    ]);

    const total = gruposPorEstado.reduce(
      (soma, grupo) => soma + grupo._count._all,
      0
    );

    return {
      porEstado: Object.fromEntries(
        gruposPorEstado.map((grupo) => [
          grupo.estado,
          grupo._count._all,
        ])
      ),

      porTipo: Object.fromEntries(
        gruposPorTipo.map((grupo) => [
          grupo.tipo,
          grupo._count._all,
        ])
      ),

      total,
    };
  });
}

export async function obterDocumentoFinal(params: {
  municipioId: string;
  utilizadorId: string;
  processoId: string;
}) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: {
        id: params.processoId,
      },

      select: {
        id: true,
        numero: true,
        estado: true,
        requerenteUtilizadorId: true,
      },
    });

    /*
     * Mesmo comportamento de segurança:
     * não revelar se o processo existe para outro utilizador.
     */
    if (
      !processo ||
      processo.requerenteUtilizadorId !== params.utilizadorId
    ) {
      throw new ProcessoNaoEncontradoError(
        "Processo não encontrado."
      );
    }

    if (!["DEFERIDO", "CONCLUIDO"].includes(processo.estado)) {
      throw new DocumentoNaoDisponivelError(
        `O documento ainda não está disponível — o processo ${processo.numero} está no estado "${processo.estado}".`
      );
    }

    /*
     * ATENÇÃO:
     *
     * Não devemos assumir que "qualquer anexo enviado por
     * outra pessoa" é o documento final.
     *
     * A query abaixo mantém a lógica existente por compatibilidade
     * com o teu schema atual, mas esta é a parte que deves ligar
     * ao mecanismo oficial de documento final do process-engine.
     */
    const anexoFinal = await tx.processoGenericoAnexo.findFirst({
      where: {
        processoId: processo.id,
        utilizadorUploadId: {
          not: params.utilizadorId,
        },
      },

      orderBy: {
        criadoEm: "desc",
      },
    });

    if (!anexoFinal) {
      throw new DocumentoNaoDisponivelError(
        `O processo ${processo.numero} foi concluído mas ainda não tem nenhum documento final anexado pela Administração.`
      );
    }

    const url = await gerarUrlVisualizacao(
      anexoFinal.storageKey,
      300
    );

    return {
      nomeFicheiro: anexoFinal.nomeFicheiro,
      url,
      expiraEmSegundos: 300,
    };
  });
}