import { withTenantTransaction } from "../../config/prisma.js";
import type { TipoProcessoGenerico, OrigemProcessoGenerico, EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import * as ProcessEngine from "../../core/process-engine/process-engine.service.js";
import type { CriarProcessoInput, TransicionarProcessoInput, ListarProcessosGenericosQuery } from "./processos-genericos.schema.js";
import { AreaForaDaDelegacaoError, ProcessoGenericoNaoEncontradoError } from "../../core/process-engine/process-engine.service.js";
import { revogarSalaProcesso } from "../../core/process-engine/process-engine.chat.realtime.js";

export class DirecaoNaoEncontradaError extends Error { }

/*
 * As notificações (quem tem a vez, envolvidos, cidadão) são todas enviadas pelo
 * motor (`notificarAposMovimento`, em process-engine.service.ts). Este módulo já
 * não duplica avisos: só valida o contrato HTTP e delega.
 */

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

async function lerResponsavelActual(municipioId: string, processoId: string): Promise<string | null> {
  return withTenantTransaction(municipioId, async (tx) => {
    const p = await tx.processoGenerico.findUnique({
      where: { id: processoId },
      select: { responsavelActualId: true },
    });
    return p?.responsavelActualId ?? null;
  });
}

/**
 * Algumas acções do circuito (despacho para a SG, expedição, parecer jurídico) mudam ou limpam
 * o responsável do processo. Quando isso acontece, o antigo responsável é expulso da sala
 * em tempo real, tal como já acontece na reatribuição manual.
 */
async function executarRevogandoSalaSeMudouResponsavel<T>(
  municipioId: string,
  processoId: string,
  accao: () => Promise<T>
): Promise<T> {
  const antes = await lerResponsavelActual(municipioId, processoId);
  const resultado = await accao();
  if (antes) {
    const depois = await lerResponsavelActual(municipioId, processoId);
    if (depois !== antes) {
      revogarSalaProcesso(processoId, antes);
    }
  }
  return resultado;
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
  // O motor já avisa quem tem a vez, os envolvidos e o cidadão.
  return ProcessEngine.transicionar({
    municipioId: params.municipioId,
    processoId: params.processoId,
    novoEstado: params.input.novoEstado as EstadoProcessoGenerico,
    executorId: params.executorId,
    ...(params.input.observacao !== undefined && { observacao: params.input.observacao }),
    ...(params.input.visivelAoCidadao !== undefined && { visivelAoCidadao: params.input.visivelAoCidadao }),
  });
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
  const antigoResponsavelId = await lerResponsavelActual(params.municipioId, params.processoId);
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

/**
 * Quem apresenta ao Administrador é a Secretaria Geral. A regra ("é a tua vez?") é validada
 * no motor, e o motor é quem avisa o Administrador.
 */
export async function apresentarAoAdministrador(params: {
  municipioId: string; processoId: string; executorId: string; observacao?: string;
}) {
  return ProcessEngine.apresentarAoAdministrador(params);
}

export async function despacharParaDireccao(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  direcaoDespachadaSigla: string;
  observacao?: string;
}) {
  // Despachar para a SG limpa o responsável anterior (se houver).
  return executarRevogandoSalaSeMudouResponsavel(params.municipioId, params.processoId, () =>
    ProcessEngine.despacharParaDireccao(params)
  );
}

export async function despacharParaAssessorJuridico(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  assessorUtilizadorId: string;
  observacao?: string;
}) {
  // O Assessor passa a ser o responsável, o anterior perde o acesso à sala.
  return executarRevogandoSalaSeMudouResponsavel(params.municipioId, params.processoId, () =>
    ProcessEngine.despacharParaAssessorJuridico(params)
  );
}

export async function expedirParaDireccao(params: { municipioId: string; processoId: string; executorId: string; observacao?: string }) {
  // Ao mudar de direcção, o responsável é limpo.
  return executarRevogandoSalaSeMudouResponsavel(params.municipioId, params.processoId, () =>
    ProcessEngine.expedirParaDireccao(params)
  );
}

/**
 * `viaExpediente`: true = a resposta sobe pela Secretaria Geral, false = directamente ao Gabinete.
 * Só o director da direcção (ou a Administração, ou o Assessor Jurídico) sobe directo;
 * um funcionário deixa a resposta pronta para a chefia a subir.
 */
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

/**
 * A Secretaria Geral entrega ao Gabinete a resposta que o director subiu por ela.
 */
export async function receberRespostaSubida(params: {
  municipioId: string;
  processoId: string;
  executorId: string;
  observacao?: string;
}) {
  const resultado = await ProcessEngine.receberRespostaSubida(params);
  return resultado;
}

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