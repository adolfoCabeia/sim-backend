import type { OrigemProcessoGenerico, TipoProcessoGenerico, EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import { criarProcesso } from "../../core/process-engine/process-engine.service.js";
import { gerarUrlVisualizacao } from "../storage/storage.service.js";
import { filtrarServicosCatalogo } from "../servicos/servico.service.js";
import type { CriarPedidoPortalInput, ListarMeusProcessosQuery, ListarServicosPortalQuery } from "./portal.schema.js";

export class ProcessoNaoEncontradoError extends Error {}
export class DocumentoNaoDisponivelError extends Error {}
export class OrigemNaoPermitidaError extends Error {}

const TIPO_CONTA_PARA_ORIGEM: Record<string, OrigemProcessoGenerico> = {
  CIDADAO: "CIDADAO",
  EMPRESA: "EMPRESA",
  INSTITUICAO: "INSTITUICAO",
  COMISSAO_MORADORES: "COMISSAO_MORADORES",
};

export function origemParaTipoConta(tipoConta: string): OrigemProcessoGenerico {
  const origem = TIPO_CONTA_PARA_ORIGEM[tipoConta];
  if (!origem) {
    throw new OrigemNaoPermitidaError(
      `O tipo de conta "${tipoConta}" não corresponde a nenhum dos portais externos (Munícipe/Empresarial/Institucional/Comissão de Moradores).`
    );
  }
  return origem;
}


export async function listarServicosDisponiveis(params: { municipioId: string; tipoConta: string; query?: ListarServicosPortalQuery }) {
  const origem = origemParaTipoConta(params.tipoConta);
  return filtrarServicosCatalogo({
    municipioId: params.municipioId,
    origem,
    ...(params.query?.tipo !== undefined && { tipoProcesso: params.query.tipo }),
    ...(params.query?.direcaoSigla !== undefined && { direcaoResponsavelSigla: params.query.direcaoSigla }),
    ...(params.query?.pago !== undefined && { pago: params.query.pago }),
  });
}

const NOME_PORTAL_PARA_TIPO_CONTA: Record<string, string> = {
  CIDADAO: "Portal Munícipe",
  EMPRESA: "Portal Empresarial",
  INSTITUICAO: "Portal Institucional",
  COMISSAO_MORADORES: "Painel Comissão de Moradores",
};


export async function obterCapacidadesPortal(params: { municipioId: string; tipoConta: string }) {
  const origem = origemParaTipoConta(params.tipoConta);
  const servicos = await filtrarServicosCatalogo({ municipioId: params.municipioId, origem });

  return {
    portal: NOME_PORTAL_PARA_TIPO_CONTA[params.tipoConta] ?? params.tipoConta,
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
      solicitarServicosDocumentos: "POST /portal/processos (servicoCodigo do catálogo acima)",
      acompanharProcessos: "GET /portal/processos e GET /portal/processos/:id — estado + timeline",
      obterDocumentoFinal: "GET /portal/processos/:id/documento",
      pagarTaxas: "GET /pagamentos/meus — referência RUPE dos serviços pagos",
      marcarAudiencia: "POST /agendamentos (tipo ADMINISTRADOR ou ASSISTENTE_SOCIAL)",
      reclamacoesEDenuncias: "POST /portal/processos (tipo RECLAMACAO ou DENUNCIA)",
      ...(params.tipoConta === "EMPRESA" && {
        sugestoes: "POST /portal/processos (tipo SUGESTAO)",
        doacoes: "POST /portal/processos (tipo DOACAO)",
      }),
      ...(params.tipoConta === "INSTITUICAO" && {
        intercambioDeDocumentos: "POST /intercambios e GET /intercambios",
        solicitacaoDeCredenciais: "POST /validacao-identidade/documentos (dupla aprovação, secção 10.5)",
        directorioInstitucional: "GET /contactos-institucionais",
      }),
      ...(params.tipoConta === "COMISSAO_MORADORES" && {
        registoDeOcorrencias: "POST /portal/processos (servicoCodigo REGISTO_OCORRENCIA_BAIRRO)",
        comunicacaoDirectaComAdministracao: "POST /portal/processos (tipo RECLAMACAO/EXPEDIENTE) + GET /portal/processos/:id/timeline",
      }),
    },
  };
}

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
    ...(params.input.servicoCodigo !== undefined && { servicoCodigo: params.input.servicoCodigo }),
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
      ...(params.query.tipo !== undefined && { tipo: params.query.tipo as TipoProcessoGenerico }),
      ...(params.query.estado !== undefined && { estado: params.query.estado as EstadoProcessoGenerico }),
    };
    const [items, total] = await Promise.all([
      tx.processoGenerico.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        skip: (params.query.page - 1) * params.query.pageSize,
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
      tx.processoGenerico.count({ where }),
    ]);
    return {
      items,
      page: params.query.page,
      pageSize: params.query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
    };
  });
}

export async function obterMeuProcesso(params: { municipioId: string; utilizadorId: string; processoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: {
        id: true,
        numero: true,
        tipo: true,
        assunto: true,
        estado: true,
        resultado: true,
        aguardaPagamento: true,
        servicoCodigo: true,
        requerenteUtilizadorId: true,
        responsavelActualId: true, // ← novo
        criadoEm: true,
        alteradoEm: true,
        transicoes: {
          where: { visivelAoCidadao: true },
          orderBy: { criadoEm: "asc" },
          select: { id: true, estadoAnterior: true, estadoNovo: true, observacao: true, criadoEm: true },
        },
        anexos: {
          orderBy: { criadoEm: "asc" },
          select: { id: true, nomeFicheiro: true, versao: true, tipoDocumentoCodigo: true, criadoEm: true, utilizadorUploadId: true },
        },
        pagamentos: {
          orderBy: { criadoEm: "desc" },
          select: { id: true, referencia: true, entidade: true, valor: true, estado: true, expiraEm: true, pagoEm: true },
        },
      },
    });
    if (!processo || processo.requerenteUtilizadorId !== params.utilizadorId) {
      throw new ProcessoNaoEncontradoError("Processo não encontrado."); // não revelar existência a terceiros
    }
    return processo; // já não esconde requerenteUtilizadorId nem responsavelActualId
  });
}

export async function obterResumoMeusProcessos(params: { municipioId: string; utilizadorId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const where = { requerenteUtilizadorId: params.utilizadorId };
    const gruposPorEstado = await tx.processoGenerico.groupBy({ by: ["estado"], where, _count: { _all: true } });
    const gruposPorTipo = await tx.processoGenerico.groupBy({ by: ["tipo"], where, _count: { _all: true } });
    const total = gruposPorEstado.reduce((soma, g) => soma + g._count._all, 0);

    return {
      porEstado: Object.fromEntries(gruposPorEstado.map((g) => [g.estado, g._count._all])),
      porTipo: Object.fromEntries(gruposPorTipo.map((g) => [g.tipo, g._count._all])),
      total,
    };
  });
}


export async function obterDocumentoFinal(params: { municipioId: string; utilizadorId: string; processoId: string }) {
  return withTenantTransaction(params.municipioId, async (tx) => {
    const processo = await tx.processoGenerico.findUnique({
      where: { id: params.processoId },
      select: { id: true, numero: true, estado: true, requerenteUtilizadorId: true },
    });
    if (!processo || processo.requerenteUtilizadorId !== params.utilizadorId) {
      throw new ProcessoNaoEncontradoError("Processo não encontrado.");
    }
    if (!["DEFERIDO", "CONCLUIDO"].includes(processo.estado)) {
      throw new DocumentoNaoDisponivelError(
        `O documento ainda não está disponível — o processo ${processo.numero} está no estado "${processo.estado}".`
      );
    }

    const anexoFinal = await tx.processoGenericoAnexo.findFirst({
      where: { processoId: processo.id, utilizadorUploadId: { not: params.utilizadorId } },
      orderBy: { criadoEm: "desc" },
    });
    if (!anexoFinal) {
      throw new DocumentoNaoDisponivelError(
        `O processo ${processo.numero} foi concluído mas ainda não tem nenhum documento final anexado pela Administração.`
      );
    }

    const url = await gerarUrlVisualizacao(anexoFinal.storageKey, 300);
    return { nomeFicheiro: anexoFinal.nomeFicheiro, url, expiraEmSegundos: 300 };
  });
}