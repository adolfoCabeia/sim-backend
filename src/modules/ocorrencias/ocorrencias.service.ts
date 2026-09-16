import { prisma, withTenantTransaction } from "../../config/prisma.js";
import type {
  CriarOcorrenciaInput,
  ResponderOcorrenciaInput,
  MudarEstadoOcorrenciaInput,
} from "./ocorrencias.schema.js";
import { MAX_IMAGENS_OCORRENCIA } from "./ocorrencias.schema.js";
import { OcorrenciaNaoEncontradaError, ImagensLimiteExcedidoError } from "./ocorrencias.errors.js";
import { uploadImagem } from "../storage/upload-imagem.js";
import { storageService } from "../storage/storage.service.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { emitirNovaMensagem,emitirMensagensLidas, emitirMudancaEstado, emitirAtribuicao } from "./ocorrencia.realtime.js";

/*
 * ── NOTA SOBRE NOTIFICAÇÕES E EVENTOS EM TEMPO REAL ─────────────────────
 * `notificarUtilizador` faz I/O de rede (envia email quando recebe
 * emailDestino). Tal como no motor de processos, NUNCA deve correr dentro
 * da transação de escrita do negócio: se a rede demorar, a transação
 * (timeout curto) expira e o commit falha com P2028, mesmo já com as
 * escritas prontas.
 *
 * Além disso, os eventos de tempo real (`emitirX`) também não devem ser
 * disparados de dentro da transação: se um passo posterior dentro do
 * mesmo bloco falhar, a transação é revertida, mas o evento já terá sido
 * enviado aos clientes — que passam a ver no ecrã uma mudança de estado
 * ou atribuição que nunca chegou a ser persistida na BD.
 *
 * Padrão adotado abaixo: a transação só lê/escreve na BD e devolve dados
 * simples; notificação e eventos em tempo real disparam depois do commit,
 * com a notificação protegida por try/catch (uma falha de envio nunca
 * desfaz nem falha a ação de negócio já concluída).
 */
async function dispararNotificacao(
  municipioId: string,
  contexto: string,
  fn: (tx: Parameters<Parameters<typeof withTenantTransaction>[1]>[0]) => Promise<void>
): Promise<void> {
  try {
    await withTenantTransaction(municipioId, fn);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[notificacao] Falha ao notificar (${contexto}):`, err);
  }
}

async function gerarNumero(municipioId: string, tx: any) {
  const ano = new Date().getFullYear();
  const total = await tx.ocorrencia.count({ where: { municipioId } });
  return `OC-${ano}-${String(total + 1).padStart(5, "0")}`;
}

const SELECT_PUBLICO = {
  id: true,
  numero: true,
  bairroZona: true,
  categoria: true,
  titulo: true,
  descricao: true,
  estado: true,
  criadoEm: true,
  alteradoEm: true,
  comissaoId: true,
  comissao: { select: { bairro: true } },
  responsavel: {
    select: {
      direcao: { select: { nome: true } },
      departamento: { select: { nome: true } },
    },
  },
  anexos: {
    select: { id: true, storageKey: true, nomeFicheiro: true, mimeType: true },
  },
} as const;

export interface ListarOcorrenciasPublicasParams {
  municipioId: string;
  page: number;
  pageSize: number;
  categoria?: string | undefined;
  bairroZona?: string | undefined;
}

export async function listarOcorrenciasPublicas(params: ListarOcorrenciasPublicasParams) {
  const where = {
    municipioId: params.municipioId,
    estado: "RESOLVIDA" as const,
    ...(params.categoria && { categoria: params.categoria }),
    ...(params.bairroZona && { bairroZona: { contains: params.bairroZona, mode: "insensitive" as const } }),
  };

  const [items, total] = await Promise.all([
    prisma.ocorrencia.findMany({
      where,
      select: SELECT_PUBLICO,
      orderBy: { alteradoEm: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.ocorrencia.count({ where }),
  ]);

  const itemsPublicos = await Promise.all(
    items.map(async (item) => ({
      numero: item.numero,
      bairroZona: item.bairroZona,
      categoria: item.categoria,
      titulo: item.titulo,
      descricao: item.descricao,
      estado: item.estado,
      registadoEm: item.criadoEm,
      resolvidoEm: item.alteradoEm, 
      reportadoPor: item.comissao ? `Comissão de Moradores — ${item.comissao.bairro}` : "Cidadão",
      resolvidoPor:
        [item.responsavel?.direcao?.nome, item.responsavel?.departamento?.nome].filter(Boolean).join(" · ") ||
        null,
      imagens: await Promise.all(
        item.anexos.map(async (anexo) => ({
          id: anexo.id,
          nomeFicheiro: anexo.nomeFicheiro,
          mimeType: anexo.mimeType,
          url: await storageService.gerarUrlVisualizacao(anexo.storageKey, 3600),
        }))
      ),
    }))
  );

  return {
    items: itemsPublicos,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function criarOcorrencia(params: {
  input: CriarOcorrenciaInput;
  municipioId: string;
  criadoPorId: string;
  imagens: Array<{ buffer: Buffer; nomeOriginal: string }>;
}) {
  if (params.imagens.length > MAX_IMAGENS_OCORRENCIA) {
    throw new ImagensLimiteExcedidoError(
      `Só é possível anexar até ${MAX_IMAGENS_OCORRENCIA} imagens por ocorrência.`
    );
  }

  const anexosCarregados = await Promise.all(
    params.imagens.map((imagem) =>
      uploadImagem({
        buffer: imagem.buffer,
        prefixo: `ocorrencias/${params.municipioId}`,
        nomeOriginal: imagem.nomeOriginal,
      })
    )
  );

  return withTenantTransaction(params.municipioId, async (tx) => {
    const numero = await gerarNumero(params.municipioId, tx);

    return tx.ocorrencia.create({
      data: {
        municipioId: params.municipioId,
        criadoPorId: params.criadoPorId,
        numero,
        bairroZona: params.input.bairroZona,
        categoria: params.input.categoria,
        titulo: params.input.titulo,
        descricao: params.input.descricao,
        estado: "REGISTADA",
        ...(params.input.comissaoId !== undefined && { comissaoId: params.input.comissaoId }),
        anexos: {
          create: anexosCarregados.map((anexo) => ({
            storageKey: anexo.storageKey,
            nomeFicheiro: anexo.nomeOriginal,
            mimeType: anexo.mimeType,
            tamanhoBytes: anexo.tamanhoBytes,
          })),
        },
      },
      include: { anexos: true },
    });
  });
}

export async function listarOcorrencias(params: {
  municipioId: string;
  viewerId: string;
  page: number;
  pageSize: number;
  apenasMinhas?: string;
  estado?: string;
}) {
  const where = {
    municipioId: params.municipioId,
    ...(params.apenasMinhas && { criadoPorId: params.apenasMinhas }),
    ...(params.estado && { estado: params.estado }),
  };

  const [items, total] = await Promise.all([
    prisma.ocorrencia.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { responsavel: { select: { nomeCompleto: true } } }, // ← novo
    }),
    prisma.ocorrencia.count({ where }),
  ]);

  const naoLidasPorOcorrencia = await prisma.ocorrenciaMensagem.groupBy({
    by: ["ocorrenciaId"],
    where: { ocorrenciaId: { in: items.map((o) => o.id) }, autorId: { not: params.viewerId }, lida: false },
    _count: { _all: true },
  });
  const mapaNaoLidas = new Map(naoLidasPorOcorrencia.map((n) => [n.ocorrenciaId, n._count._all]));

  const itemsComContagem = items.map((item) => ({ ...item, naoLidas: mapaNaoLidas.get(item.id) ?? 0 }));

  return {
    items: itemsComContagem,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize) || 1,
  };
}

export async function obterOcorrencia(id: string, municipioId: string, viewerId: string) {
  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id, municipioId },
    include: {
      mensagens: { orderBy: { criadoEm: "asc" }, include: { autor: { select: { nomeCompleto: true } } } },
      anexos: true,
      criadoPor: { select: { nomeCompleto: true } },
      responsavel: { select: { nomeCompleto: true } },
    },
  });

  if (!ocorrencia) throw new OcorrenciaNaoEncontradaError("Ocorrência não encontrada.");

  const { count: marcadas } = await prisma.ocorrenciaMensagem.updateMany({
    where: { ocorrenciaId: id, autorId: { not: viewerId }, lida: false },
    data: { lida: true, lidaEm: new Date() },
  });

  if (marcadas > 0) {
    emitirMensagensLidas(id, viewerId);
  }

  const anexos = await Promise.all(
    ocorrencia.anexos.map(async (anexo) => ({
      ...anexo,
      url: await storageService.gerarUrlVisualizacao(anexo.storageKey, 3600),
    }))
  );

  // refletir o estado "lida" já atualizado nas mensagens devolvidas nesta resposta
  const mensagens = ocorrencia.mensagens.map((m) =>
    m.autorId !== viewerId && !m.lida ? { ...m, lida: true, lidaEm: new Date() } : m
  );

  return { ...ocorrencia, mensagens, anexos };
}

export async function responderOcorrencia(params: {
  ocorrenciaId: string;
  municipioId: string;
  autorId: string;
  input: ResponderOcorrenciaInput;
}) {
  // 1) Transação: só leituras/escritas de negócio. Nada de rede aqui.
  const {
    mensagem,
    numeroOcorrencia,
    deveAtribuir,
    atribuidoNome,
    destinatarioParaNotificar,
  } = await prisma.$transaction(async (tx) => {
    const ocorrencia = await tx.ocorrencia.findFirst({
      where: { id: params.ocorrenciaId, municipioId: params.municipioId },
    });
    if (!ocorrencia) throw new OcorrenciaNaoEncontradaError("Ocorrência não encontrada.");

    const ehCriador = ocorrencia.criadoPorId === params.autorId;
    const deveAtribuir = !ehCriador && !ocorrencia.responsavelId;

    const mensagem = await tx.ocorrenciaMensagem.create({
      data: { ocorrenciaId: params.ocorrenciaId, autorId: params.autorId, mensagem: params.input.mensagem },
      include: { autor: { select: { nomeCompleto: true } } },
    });

    if (deveAtribuir) {
      await tx.ocorrencia.update({
        where: { id: params.ocorrenciaId },
        data: { responsavelId: params.autorId },
      });
    }

    const destinatarioId = ehCriador
      ? ocorrencia.responsavelId ?? deveAtribuir ? params.autorId : null
      : ocorrencia.criadoPorId;

    // Se for o criador a responder e ainda não há responsável, não há para quem notificar.
    let destinatarioParaNotificar: {
      utilizadorDestinoId: string;
      email: string | null;
      nomeCompleto: string | null;
    } | null = null;

    if (destinatarioId && destinatarioId !== params.autorId) {
      const destinatario = await tx.utilizador.findUnique({
        where: { id: destinatarioId },
        select: { email: true, nomeCompleto: true },
      });
      destinatarioParaNotificar = {
        utilizadorDestinoId: destinatarioId,
        email: destinatario?.email ?? null,
        nomeCompleto: destinatario?.nomeCompleto ?? null,
      };
    }

    return {
      mensagem,
      numeroOcorrencia: ocorrencia.numero,
      deveAtribuir,
      atribuidoNome: mensagem.autor.nomeCompleto,
      destinatarioParaNotificar,
    };
  });

  // 2) Efeitos fora da transação: eventos em tempo real e notificação,
  //    só depois de a escrita estar de facto confirmada na BD.
  if (deveAtribuir) {
    emitirAtribuicao(params.ocorrenciaId, atribuidoNome);
  }

  if (destinatarioParaNotificar) {
    await dispararNotificacao(
      params.municipioId,
      `responderOcorrencia:${params.ocorrenciaId}`,
      async (tx) => {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: destinatarioParaNotificar.utilizadorDestinoId,
          titulo: `Nova mensagem em ${numeroOcorrencia}`,
          mensagem:
            params.input.mensagem.length > 140
              ? `${params.input.mensagem.slice(0, 140)}…`
              : params.input.mensagem,
          tipo: "OCORRENCIA_MENSAGEM",
          metadata: { ocorrenciaId: params.ocorrenciaId },
          emailDestino: destinatarioParaNotificar.email,
          nomeDestino: destinatarioParaNotificar.nomeCompleto,
        });
      }
    );
  }

  emitirNovaMensagem(params.ocorrenciaId, {
    id: mensagem.id,
    mensagem: mensagem.mensagem,
    autorId: mensagem.autorId,
    autorNome: mensagem.autor.nomeCompleto,
    criadoEm: mensagem.criadoEm,
  });

  return mensagem;
}

export async function mudarEstadoOcorrencia(params: {
  ocorrenciaId: string;
  municipioId: string;
  input: MudarEstadoOcorrenciaInput;
}) {
  // 1) Transação: só leituras/escritas de negócio.
  const { atualizada, numeroOcorrencia, destinatarioParaNotificar } = await prisma.$transaction(async (tx) => {
    const ocorrencia = await tx.ocorrencia.findFirst({
      where: { id: params.ocorrenciaId, municipioId: params.municipioId },
    });
    if (!ocorrencia) throw new OcorrenciaNaoEncontradaError("Ocorrência não encontrada.");

    const atualizada = await tx.ocorrencia.update({
      where: { id: params.ocorrenciaId },
      data: { estado: params.input.estado },
    });

    const destinatario = await tx.utilizador.findUnique({
      where: { id: ocorrencia.criadoPorId },
      select: { email: true, nomeCompleto: true },
    });

    return {
      atualizada,
      numeroOcorrencia: ocorrencia.numero,
      destinatarioParaNotificar: {
        utilizadorDestinoId: ocorrencia.criadoPorId,
        email: destinatario?.email ?? null,
        nomeCompleto: destinatario?.nomeCompleto ?? null,
      },
    };
  });

  // 2) Efeitos fora da transação, só depois da escrita confirmada na BD.
  await dispararNotificacao(
    params.municipioId,
    `mudarEstadoOcorrencia:${params.ocorrenciaId}`,
    async (tx) => {
      await notificarUtilizador(tx, {
        utilizadorDestinoId: destinatarioParaNotificar.utilizadorDestinoId,
        titulo: `Ocorrência ${numeroOcorrencia} atualizada`,
        mensagem: params.input.observacao
          ? `Novo estado: ${params.input.estado}. ${params.input.observacao}`
          : `A tua ocorrência passou para o estado ${params.input.estado}.`,
        tipo: "OCORRENCIA_ATUALIZADA",
        metadata: { ocorrenciaId: params.ocorrenciaId },
        emailDestino: destinatarioParaNotificar.email,
        nomeDestino: destinatarioParaNotificar.nomeCompleto,
      });
    }
  );

  emitirMudancaEstado(params.ocorrenciaId, params.input.estado);

  return atualizada;
}