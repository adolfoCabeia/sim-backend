/**
 * "De quem é a vez?"
 *
 * Fonte única de verdade para saber QUEM tem de agir a seguir num processo.
 * É usada em três sítios, para nunca ficarem desalinhados:
 *   1. process-engine.acoes.ts       → quais botões aparecem a cada utilizador;
 *   2. process-engine.service.ts     → quem pode executar cada acção;
 *   3. notificações e lembretes      → a quem dizer "a próxima acção é contigo".
 *
 * A vez depende do ESTADO + LOCALIZAÇÃO do processo, e não do que cada perfil
 * "tem permissão" para fazer. As permissões só continuam a ser exigidas nos
 * actos legais do Administrador (despacho de encaminhamento, despacho final).
 */
import type { Prisma, EstadoProcessoGenerico } from "../../generated/prisma/client.js";
import { LocalizacaoProcesso } from "../../generated/prisma/client.js";
import { hasPermission } from "../../modules/auth/rbac/rbac.service.js";

const L = LocalizacaoProcesso;

export const SIGLA_SECRETARIA_GERAL = "SG";
export const SIGLA_GABINETE_ADMINISTRADOR = "GAM";

const PERFIS_ADMINISTRACAO = [
  "SUPER_ADMIN",
  "ADMINISTRADOR_MUNICIPAL",
  "ADMINISTRADOR_ADJUNTO_POLITICA",
  "ADMINISTRADOR_ADJUNTO_ECONOMICA",
  "ADMINISTRADOR_ADJUNTO_TECNICA",
];

export type PapelDaVez =
  | "ADMINISTRADOR" // Administrador (ou adjunto): despachos e decisões finais
  | "GABINETE" // Administrador + pessoal do GAM
  | "SECRETARIA_GERAL" // pessoal da SG
  | "CHEFIA_DIRECCAO" // chefia da direcção que tem o processo
  | "RESPONSAVEL" // funcionário a quem o processo está atribuído
  | "NINGUEM";

export type Vez = {
  papel: PapelDaVez;
  /** Frase amigável: o que falta fazer. */
  acaoEsperada: string;
  /** Direcção cujo pessoal tem a vez (quando aplicável). */
  direcaoId: string | null;
  /** Pessoa concreta que tem a vez (quando já há responsável). */
  utilizadorId: string | null;
};

export type ProcessoParaVez = {
  estado: EstadoProcessoGenerico;
  localizacaoActual: LocalizacaoProcesso;
  responsavelActualId: string | null;
  direcaoAtualId: string | null;
  direcaoDespachadaId: string | null;
};

const LOCALIZACOES_EM_DIRECCAO: LocalizacaoProcesso[] = [L.DIRECCAO_COMPETENTE, L.PARECER_ASSESSOR_JURIDICO];

export function estaEmDireccao(loc: LocalizacaoProcesso): boolean {
  return LOCALIZACOES_EM_DIRECCAO.includes(loc);
}

export function determinarVez(p: ProcessoParaVez): Vez {
  const loc = p.localizacaoActual;
  const est = p.estado;

  const vez = (
    papel: PapelDaVez,
    acaoEsperada: string,
    extra: Partial<Pick<Vez, "direcaoId" | "utilizadorId">> = {}
  ): Vez => ({ papel, acaoEsperada, direcaoId: null, utilizadorId: null, ...extra });

  // Quem trata o processo: o responsável, ou (se ainda não há) a chefia da direcção.
  const daDireccao = (comResponsavel: string, semResponsavel: string): Vez =>
    p.responsavelActualId
      ? vez("RESPONSAVEL", comResponsavel, { utilizadorId: p.responsavelActualId, direcaoId: p.direcaoAtualId })
      : vez("CHEFIA_DIRECCAO", semResponsavel, { direcaoId: p.direcaoAtualId });

  if (est === "CONCLUIDO") {
    return vez("NINGUEM", "O processo está concluído. Só falta arquivá-lo.");
  }

  // Decisão final (Deferido/Indeferido) é sempre do Administrador,
  // esteja o processo na direcção ou no Gabinete.
  if (est === "AGUARDANDO_DESPACHO" && (estaEmDireccao(loc) || loc === L.GABINETE_ADMINISTRADOR)) {
    return vez("ADMINISTRADOR", "Decidir o processo: deferir ou indeferir.");
  }

  switch (loc) {
    case L.EXPEDIENTE:
      // A SG é quem apresenta ao Administrador (processo novo) e quem entrega ao Gabinete (resposta subida).
      return est === "RECEBIDO"
        ? vez("SECRETARIA_GERAL", "Apresentar o processo ao Administrador para despacho.")
        : vez("SECRETARIA_GERAL", "Entregar a resposta da direcção ao Gabinete do Administrador.");

    case L.AGUARDA_DESPACHO_ROTEAMENTO:
      return vez("ADMINISTRADOR", "Despachar o processo para a direcção competente (ou pedir parecer ao Assessor Jurídico).");

    case L.EXPEDIENTE_A_ENVIAR:
      return vez("SECRETARIA_GERAL", "Expedir o processo para a direcção indicada pelo Administrador.", {
        direcaoId: p.direcaoDespachadaId,
      });

    case L.DIRECCAO_COMPETENTE:
    case L.PARECER_ASSESSOR_JURIDICO:
      return daDireccao(
        "Tratar o processo e decidir o próximo passo.",
        "Ficar com o processo, distribuí-lo a um funcionário da direcção ou decidir."
      );

    case L.RESPOSTA_A_SUBIR:
      return vez("CHEFIA_DIRECCAO", "Rever a resposta preparada e subi-la à Secretaria Geral ou ao Gabinete do Administrador.", {
        direcaoId: p.direcaoAtualId,
      });

    case L.GABINETE_ADMINISTRADOR:
      return vez("GABINETE", "Analisar a resposta recebida e decidir os próximos passos.");

    case L.PREPARACAO_SAIDA:
      return daDireccao(
        "Preparar o documento de saída (PDF) e submetê-lo ao despacho do Administrador.",
        "Ficar com o processo ou distribuí-lo a um funcionário para preparar o documento de saída."
      );

    case L.AGUARDA_DESPACHO_SAIDA:
      return vez("ADMINISTRADOR", "Autorizar ou recusar a saída do documento.");

    case L.EXPEDIENTE_SAIDA_A_FORMALIZAR:
      return vez("SECRETARIA_GERAL", "Formalizar o envio do documento ao exterior.");

    case L.EXPEDIDO_EXTERNO:
      return daDireccao("Concluir o processo.", "Concluir o processo.");

    default:
      return vez("NINGUEM", "Não há nenhuma acção pendente neste momento.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quem é o utilizador que está a agir
// ─────────────────────────────────────────────────────────────────────────────

export type ContextoExecutor = {
  utilizadorId: string;
  direcaoId: string | null;
  direcaoSigla: string | null;
  /** Administrador, adjunto, super-admin (ou quem tem o despacho de encaminhamento). */
  ehAdministracao: boolean;
  /** Chefia de direcção (quem distribui trabalho ao seu pessoal). */
  ehChefia: boolean;
  /** Acto legal: só quem tem esta permissão pode deferir/indeferir. */
  podeDespachoFinal: boolean;
};

export async function carregarContextoExecutor(
  tx: Prisma.TransactionClient,
  municipioId: string,
  utilizadorId: string
): Promise<ContextoExecutor> {
  const [utilizador, perfis, podeDespachar, ehChefiaPorPermissao, podeDespachoFinal] = await Promise.all([
    tx.utilizador.findUnique({ where: { id: utilizadorId }, select: { direcaoId: true } }),
    tx.utilizadorPerfil.findMany({
      where: { utilizadorId, perfil: { activo: true } },
      select: { perfil: { select: { nome: true } } },
    }),
    hasPermission(utilizadorId, municipioId, "processos_genericos:despachar_encaminhamento"),
    hasPermission(utilizadorId, municipioId, "processos_genericos:atribuir_responsavel"),
    hasPermission(utilizadorId, municipioId, "processos_genericos:despacho_final"),
  ]);

  const direcaoId = utilizador?.direcaoId ?? null;
  const direcao = direcaoId
    ? await tx.direcao.findUnique({ where: { id: direcaoId }, select: { sigla: true } })
    : null;

  const nomes = perfis.map((p) => p.perfil.nome);
  return {
    utilizadorId,
    direcaoId,
    direcaoSigla: direcao?.sigla ?? null,
    ehAdministracao: nomes.some((n) => PERFIS_ADMINISTRACAO.includes(n)) || podeDespachar,
    // "Chefia" = quem distribui trabalho na direcção (é assim que o sistema já a reconhece).
    ehChefia: ehChefiaPorPermissao,
    podeDespachoFinal,
  };
}

export function ehChefiaDaDireccao(ctx: ContextoExecutor, direcaoId: string | null): boolean {
  return ctx.ehChefia && ctx.direcaoId !== null && ctx.direcaoId === direcaoId;
}

/**
 * Sobe a resposta directamente, sem passo intermédio:
 *  - a Administração;
 *  - o director da direcção que tem o processo;
 *  - o Assessor Jurídico, que sobe o seu parecer sem passar pela chefia de outra direcção.
 */
export function podeSubirDirecto(
  ctx: ContextoExecutor,
  processo: { direcaoAtualId: string | null; localizacaoActual: LocalizacaoProcesso }
): boolean {
  return (
    ctx.ehAdministracao ||
    ehChefiaDaDireccao(ctx, processo.direcaoAtualId) ||
    processo.localizacaoActual === L.PARECER_ASSESSOR_JURIDICO
  );
}

export function executorTemAVez(
  vez: Vez,
  ctx: ContextoExecutor,
  processo: { direcaoAtualId: string | null }
): boolean {
  const chefia = ehChefiaDaDireccao(ctx, processo.direcaoAtualId);
  switch (vez.papel) {
    case "ADMINISTRADOR":
      return ctx.ehAdministracao;
    case "GABINETE":
      return ctx.ehAdministracao || ctx.direcaoSigla === SIGLA_GABINETE_ADMINISTRADOR;
    case "SECRETARIA_GERAL":
      return ctx.direcaoSigla === SIGLA_SECRETARIA_GERAL;
    case "CHEFIA_DIRECCAO":
      return ctx.ehAdministracao || chefia;
    case "RESPONSAVEL":
      // Enquanto o processo está atribuído a um funcionário, a vez é SÓ dele.
      // A chefia volta a ter a vez quando ele sobe a resposta (RESPOSTA_A_SUBIR).
      return ctx.utilizadorId === vez.utilizadorId;
    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quem deve ser avisado
// ─────────────────────────────────────────────────────────────────────────────

export type Destinatario = { utilizadorId: string; email: string | null; nomeCompleto: string | null };

const SELECT_DESTINATARIO = { id: true, email: true, nomeCompleto: true } as const;

type LinhaUtilizador = { id: string; email: string | null; nomeCompleto: string | null };

async function porDireccaoId(tx: Prisma.TransactionClient, municipioId: string, direcaoId: string): Promise<LinhaUtilizador[]> {
  return tx.utilizador.findMany({
    where: { municipioId, estado: "ACTIVA", tipoConta: "INTERNO", direcaoId },
    select: SELECT_DESTINATARIO,
  });
}

async function porDireccaoSigla(tx: Prisma.TransactionClient, municipioId: string, sigla: string): Promise<LinhaUtilizador[]> {
  const direcao = await tx.direcao.findUnique({
    where: { municipioId_sigla: { municipioId, sigla } },
    select: { id: true },
  });
  return direcao ? porDireccaoId(tx, municipioId, direcao.id) : [];
}

async function administradorMunicipal(tx: Prisma.TransactionClient, municipioId: string): Promise<LinhaUtilizador[]> {
  return tx.utilizador.findMany({
    where: {
      municipioId,
      estado: "ACTIVA",
      tipoConta: "INTERNO",
      perfis: { some: { perfil: { nome: "ADMINISTRADOR_MUNICIPAL" } } },
    },
    select: SELECT_DESTINATARIO,
  });
}

export async function resolverDestinatariosDaVez(
  tx: Prisma.TransactionClient,
  municipioId: string,
  vez: Vez
): Promise<Destinatario[]> {
  let linhas: LinhaUtilizador[] = [];

  switch (vez.papel) {
    case "ADMINISTRADOR":
      linhas = await administradorMunicipal(tx, municipioId);
      break;
    case "GABINETE":
      linhas = [
        ...(await administradorMunicipal(tx, municipioId)),
        ...(await porDireccaoSigla(tx, municipioId, SIGLA_GABINETE_ADMINISTRADOR)),
      ];
      break;
    case "SECRETARIA_GERAL":
      linhas = await porDireccaoSigla(tx, municipioId, SIGLA_SECRETARIA_GERAL);
      break;
    case "CHEFIA_DIRECCAO": {
      if (!vez.direcaoId) break;
      const pessoal = await porDireccaoId(tx, municipioId, vez.direcaoId);
      const chefias = (
        await Promise.all(
          pessoal.map(async (u) =>
            (await hasPermission(u.id, municipioId, "processos_genericos:atribuir_responsavel")) ? u : null
          )
        )
      ).filter((u): u is LinhaUtilizador => u !== null);
      // Se a direcção não tiver chefia configurada, avisa todo o pessoal para o processo não ficar parado.
      linhas = chefias.length > 0 ? chefias : pessoal;
      break;
    }
    case "RESPONSAVEL": {
      if (!vez.utilizadorId) break;
      const u = await tx.utilizador.findUnique({ where: { id: vez.utilizadorId }, select: SELECT_DESTINATARIO });
      if (u) linhas = [u];
      break;
    }
    default:
      break;
  }

  const unicos = new Map(linhas.map((u) => [u.id, u]));
  return [...unicos.values()].map((u) => ({ utilizadorId: u.id, email: u.email, nomeCompleto: u.nomeCompleto }));
}

/** Para quem NÃO tem a vez: explica onde está o processo e o que falta. */
export function descreverVez(vez: Vez, nomes: { direcao?: string | null; responsavel?: string | null } = {}): string {
  if (vez.papel === "NINGUEM") return vez.acaoEsperada;

  const quem: Record<Exclude<PapelDaVez, "NINGUEM">, string> = {
    ADMINISTRADOR: "o Administrador Municipal",
    GABINETE: "o Gabinete do Administrador",
    SECRETARIA_GERAL: "a Secretaria Geral",
    CHEFIA_DIRECCAO: nomes.direcao ? `a chefia da ${nomes.direcao}` : "a chefia da direcção",
    RESPONSAVEL: nomes.responsavel ? `${nomes.responsavel}` : "o responsável pelo processo",
  };
  return `Neste momento o processo está com ${quem[vez.papel]}. Próximo passo: ${vez.acaoEsperada}`;
}

/** Para quem TEM a vez: "a próxima acção é contigo". */
export function mensagemDaVez(params: {
  numero: string;
  oQueAconteceu: string;
  vez: Vez;
  soUmDestinatario: boolean;
  complemento?: string;
}): { titulo: string; mensagem: string } {
  const pessoal = params.soUmDestinatario || params.vez.papel === "RESPONSAVEL";
  return {
    titulo: pessoal
      ? `Processo ${params.numero} - a próxima acção é contigo`
      : `Processo ${params.numero} - a próxima acção é da tua equipa`,
    mensagem:
      `${params.oQueAconteceu} O que falta fazer: ${params.vez.acaoEsperada}` +
      (params.complemento ? ` ${params.complemento}` : ""),
  };
}