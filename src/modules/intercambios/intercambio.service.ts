import { prisma, prismaAuthBypass } from "../../config/prisma.js";
import { notificarUtilizador } from "../../core/notifications/notification.service.js";
import { uploadDocumento, gerarUrlVisualizacao } from "../storage/storage.service.js";
import type { EnviarIntercambioInput, ListarIntercambiosQuery } from "./intercambio.schema.js";

export class DirecaoSemPermissaoIntercambioError extends Error {}
export class MunicipioDestinoInvalidoError extends Error {}
export class IntercambioNaoEncontradoError extends Error {}
export class IntercambioNaoPertenceAoMunicipioError extends Error {}
export class IntercambioSemDocumentoError extends Error {}

const MIME_TIPOS_ACEITES_INTERCAMBIO = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];


export async function uploadDocumentoIntercambio(params: { buffer: Buffer; nomeOriginal: string }) {
  return uploadDocumento({
    buffer: params.buffer,
    prefixo: "intercambios",
    nomeOriginal: params.nomeOriginal,
    mimeTiposAceites: MIME_TIPOS_ACEITES_INTERCAMBIO,
  });
}

export async function obterUrlDocumentoIntercambio(params: { intercambioId: string; municipioId: string }) {
  const intercambio = await prisma.intercambio.findUnique({
    where: { id: params.intercambioId },
    include: { direcaoOrigem: { select: { municipioId: true } } },
  });
  if (!intercambio) throw new IntercambioNaoEncontradoError("Intercâmbio não encontrado.");

  const pertenceAoMunicipio =
    intercambio.direcaoOrigem.municipioId === params.municipioId ||
    intercambio.municipioDestinoId === params.municipioId;
  if (!pertenceAoMunicipio) {
    throw new IntercambioNaoPertenceAoMunicipioError(
      "Este intercâmbio não pertence nem à origem nem ao destino do seu município."
    );
  }
  if (!intercambio.documentoStorageKey) {
    throw new IntercambioSemDocumentoError("Este intercâmbio não tem nenhum documento anexado.");
  }

  return gerarUrlVisualizacao(intercambio.documentoStorageKey);
}

async function gerarNumeroProtocolo(): Promise<string> {
  const ano = new Date().getFullYear();
  const inicioAno = new Date(`${ano}-01-01T00:00:00.000Z`);
  const inicioProximoAno = new Date(`${ano + 1}-01-01T00:00:00.000Z`);
  const contagem = await prisma.intercambio.count({
    where: { enviadoEm: { gte: inicioAno, lt: inicioProximoAno } },
  });
  return `INT/${String(contagem + 1).padStart(4, "0")}/${ano}`;
}

async function notificarUtilizadoresDaDirecao(params: {
  direcaoId: string;
  titulo: string;
  mensagem: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const destinatarios = await prismaAuthBypass.utilizador.findMany({
    where: { direcaoId: params.direcaoId, estado: "ACTIVA" },
    select: { id: true, email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
  });

  for (const destinatario of destinatarios) {
    await notificarUtilizador(prismaAuthBypass, {
      utilizadorDestinoId: destinatario.id,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: "SISTEMA",
      metadata: params.metadata,
      emailDestino: destinatario.emailConfirmado ? destinatario.email : null,
      nomeDestino: destinatario.nomeCompleto,
      telefoneDestino: destinatario.telefone,
    });
  }
}

async function notificarUtilizadoresComPermissaoNoMunicipio(params: {
  municipioId: string;
  permissaoChave: string;
  titulo: string;
  mensagem: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const destinatarios = await prismaAuthBypass.utilizador.findMany({
    where: {
      municipioId: params.municipioId,
      estado: "ACTIVA",
      perfis: {
        some: {
          perfil: {
            activo: true,
            permissoes: { some: { permissao: { chave: params.permissaoChave } } },
          },
        },
      },
    },
    select: { id: true, email: true, nomeCompleto: true, telefone: true, emailConfirmado: true },
    distinct: ["id"],
  });

  for (const destinatario of destinatarios) {
    await notificarUtilizador(prismaAuthBypass, {
      utilizadorDestinoId: destinatario.id,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: "SISTEMA",
      metadata: params.metadata,
      emailDestino: destinatario.emailConfirmado ? destinatario.email : null,
      nomeDestino: destinatario.nomeCompleto,
      telefoneDestino: destinatario.telefone,
    });
  }
}

export async function enviarIntercambio(params: {
  municipioOrigemId: string;
  executorId: string;
  input: EnviarIntercambioInput;
}) {
  const executor = await prismaAuthBypass.utilizador.findUnique({
    where: { id: params.executorId },
    select: { direcaoId: true },
  });

  if (!executor?.direcaoId) {
    throw new DirecaoSemPermissaoIntercambioError(
      "Só um utilizador associado a uma direcção com permissão de intercâmbio inter-municipal pode enviar (ex.: GAM)."
    );
  }

  const direcao = await prismaAuthBypass.direcao.findUnique({
    where: { id: executor.direcaoId },
    select: { id: true, municipioId: true, permiteIntercambioInterMunicipal: true },
  });

  if (!direcao || direcao.municipioId !== params.municipioOrigemId || !direcao.permiteIntercambioInterMunicipal) {
    throw new DirecaoSemPermissaoIntercambioError(
      "A sua direcção não tem permissão para enviar intercâmbios inter-municipais."
    );
  }

  if (params.input.municipioDestinoId === params.municipioOrigemId) {
    throw new MunicipioDestinoInvalidoError("O município de destino tem de ser diferente do município de origem.");
  }

  const municipioDestino = await prisma.municipio.findUnique({
    where: { id: params.input.municipioDestinoId },
    select: { id: true, activo: true },
  });
  if (!municipioDestino || !municipioDestino.activo) {
    throw new MunicipioDestinoInvalidoError("O município de destino indicado não existe ou está inactivo.");
  }

  const numeroProtocolo = await gerarNumeroProtocolo();

  const intercambio = await prisma.intercambio.create({
    data: {
      direcaoOrigemId: direcao.id,
      municipioDestinoId: params.input.municipioDestinoId,
      numeroProtocolo,
      assunto: params.input.assunto,
      estado: "ENVIADO",
      ...(params.input.documentoStorageKey !== undefined && {
        documentoStorageKey: params.input.documentoStorageKey,
      }),
    },
  });

  await notificarUtilizadoresComPermissaoNoMunicipio({
    municipioId: params.input.municipioDestinoId,
    permissaoChave: "intercambios:confirmar",
    titulo: `Novo intercâmbio recebido — Protocolo ${numeroProtocolo}`,
    mensagem: `Chegou um novo intercâmbio (Protocolo ${numeroProtocolo}) de outro município, assunto: "${params.input.assunto}". Requer confirmação de recepção.`,
    metadata: { intercambioId: intercambio.id, numeroProtocolo, tipo: "INTERCAMBIO_RECEBIDO" },
  });

  return intercambio;
}

export async function listarIntercambios(params: { municipioId: string; query: ListarIntercambiosQuery }) {
  const where =
    params.query.direcao === "RECEBIDOS"
      ? { municipioDestinoId: params.municipioId }
      : { direcaoOrigem: { municipioId: params.municipioId } };

  const [items, total] = await Promise.all([
    prisma.intercambio.findMany({
      where,
      include: {
        direcaoOrigem: { select: { id: true, nome: true, sigla: true, municipio: { select: { id: true, nome: true } } } },
        municipioDestino: { select: { id: true, nome: true } },
      },
      orderBy: { enviadoEm: "desc" },
      skip: (params.query.page - 1) * params.query.pageSize,
      take: params.query.pageSize,
    }),
    prisma.intercambio.count({ where }),
  ]);

  return {
    items,
    page: params.query.page,
    pageSize: params.query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.query.pageSize)),
  };
}

/** Só o município de DESTINO pode confirmar a recepção. */
export async function confirmarRecepcaoIntercambio(params: { intercambioId: string; municipioId: string }) {
  const intercambio = await prisma.intercambio.findUnique({ where: { id: params.intercambioId } });
  if (!intercambio) {
    throw new IntercambioNaoEncontradoError("Intercâmbio não encontrado.");
  }
  if (intercambio.municipioDestinoId !== params.municipioId) {
    throw new IntercambioNaoPertenceAoMunicipioError("Este intercâmbio não foi enviado para o seu município.");
  }

  const agora = new Date();
  const actualizado = await prisma.intercambio.update({
    where: { id: params.intercambioId },
    data: {
      estado: "CONFIRMADO",
      recebidoEm: intercambio.recebidoEm ?? agora,
      confirmadoEm: agora,
    },
  });
  await notificarUtilizadoresDaDirecao({
    direcaoId: intercambio.direcaoOrigemId,
    titulo: `Intercâmbio confirmado — Protocolo ${intercambio.numeroProtocolo}`,
    mensagem: `O intercâmbio (Protocolo ${intercambio.numeroProtocolo}) foi recebido e confirmado pelo município de destino em ${agora.toLocaleString("pt-PT")}.`,
    metadata: { intercambioId: intercambio.id, numeroProtocolo: intercambio.numeroProtocolo, tipo: "INTERCAMBIO_CONFIRMADO" },
  });

  return actualizado;
}