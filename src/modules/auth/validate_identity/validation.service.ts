import { withTenantTransaction, prisma } from "../../../config/prisma.js";
import { uploadDocumento, eliminarDocumento, gerarUrlVisualizacao } from "../../storage/storage.service.js";
import { atribuirPerfilTx } from "../rbac/rbac.service.js";
import { PERFIS_QUE_EXIGEM_DUPLA_APROVACAO } from "../rbac/perfis-dupla-aprovacao.js";
import { undefinedToNull } from "../../../utils/optional.js";

export class PedidoNaoEncontradoError extends Error {}
export class EstadoInvalidoParaOperacaoError extends Error {}
export class SemPermissaoNivel2Error extends Error {}


export async function submeterDocumento(params: {
  utilizadorId: string;
  municipioId: string;
  documentoTipo: string;
  documentoNumero: string;
  perfilSolicitadoId?: string;
  ficheiroBuffer: Buffer;
  nomeOriginal?: string;
}) {
  const upload = await uploadDocumento({
    buffer: params.ficheiroBuffer,
    prefixo: "validacao-identidade",
    ...(params.nomeOriginal !== undefined && { nomeOriginal: params.nomeOriginal }),
  });

  const perfilSolicitadoId = undefinedToNull(params.perfilSolicitadoId);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const pedidoExistente = await tx.pedidoValidacaoIdentidade.findFirst({
      where: {
        utilizadorId: params.utilizadorId,
        estado: { in: ["AGUARDANDO_DOCUMENTO", "CORRECAO_SOLICITADA"] },
      },
      orderBy: { criadoEm: "desc" },
    });

    if (pedidoExistente?.documentoStorageKey) {
      await eliminarDocumento(pedidoExistente.documentoStorageKey).catch(() => {
      });
    }

    const pedido = pedidoExistente
      ? await tx.pedidoValidacaoIdentidade.update({
          where: { id: pedidoExistente.id },
          data: {
            documentoTipo: params.documentoTipo,
            documentoNumero: params.documentoNumero,
            documentoStorageKey: upload.storageKey,
            documentoNomeOriginal: upload.nomeOriginal,
            perfilSolicitadoId,
            estado: "EM_REVISAO",
            motivoRejeicao: null,
          },
        })
      : await tx.pedidoValidacaoIdentidade.create({
          data: {
            municipioId: params.municipioId,
            utilizadorId: params.utilizadorId,
            documentoTipo: params.documentoTipo,
            documentoNumero: params.documentoNumero,
            documentoStorageKey: upload.storageKey,
            documentoNomeOriginal: upload.nomeOriginal,
            perfilSolicitadoId,
            estado: "EM_REVISAO",
          },
        });

    await tx.logAuditoria.create({
      data: {
        municipioId: params.municipioId,
        utilizadorId: params.utilizadorId,
        accao: "SUBMETER_DOCUMENTO_IDENTIDADE",
        entidade: "PedidoValidacaoIdentidade",
        entidadeId: pedido.id,
      },
    });

    return pedido;
  });
}

export async function listarPedidosPendentes(municipioId: string) {
  return withTenantTransaction(municipioId, (tx) =>
    tx.pedidoValidacaoIdentidade.findMany({
      where: {
        municipioId,
        estado: { in: ["EM_REVISAO", "AGUARDANDO_NIVEL_2"] },
      },
      include: {
        utilizador: { select: { id: true, nomeCompleto: true, email: true, tipoConta: true } },
      },
      orderBy: { criadoEm: "asc" },
    })
  );
}

export async function obterPedido(pedidoId: string, municipioId: string) {
  const pedido = await withTenantTransaction(municipioId, (tx) =>
    tx.pedidoValidacaoIdentidade.findUnique({
      where: { id: pedidoId },
      include: {
        utilizador: { select: { id: true, nomeCompleto: true, email: true, tipoConta: true } },
      },
    })
  );

  if (!pedido) {
    throw new PedidoNaoEncontradoError("Pedido de validação não encontrado.");
  }

  return pedido;
}

/**
 * Gera uma URL temporária para o revisor visualizar o documento anexado,
 * sem nunca expor o ficheiro publicamente.
 */
export async function obterUrlDocumento(pedidoId: string, municipioId: string): Promise<string> {
  const pedido = await obterPedido(pedidoId, municipioId);

  if (!pedido.documentoStorageKey) {
    throw new EstadoInvalidoParaOperacaoError("Este pedido ainda não tem documento anexado.");
  }

  return gerarUrlVisualizacao(pedido.documentoStorageKey);
}

/**
 * Passo "Pedido de Correcção" do fluxograma: revisor (nível 1) rejeita o
 * documento por estar ilegível, inconsistente, etc. Volta ao utilizador
 * para reenvio — NÃO é uma rejeição definitiva da conta.
 */
export async function solicitarCorrecao(params: {
  pedidoId: string;
  municipioId: string;
  motivoRejeicao: string;
  executorId: string;
}) {
  const pedido = await obterPedido(params.pedidoId, params.municipioId);

  if (pedido.estado !== "EM_REVISAO") {
    throw new EstadoInvalidoParaOperacaoError(
      `Só é possível solicitar correcção a pedidos em revisão (estado actual: ${pedido.estado}).`
    );
  }

  return withTenantTransaction(params.municipioId, async (tx) => {
    const actualizado = await tx.pedidoValidacaoIdentidade.update({
      where: { id: params.pedidoId },
      data: { estado: "CORRECAO_SOLICITADA", motivoRejeicao: params.motivoRejeicao },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: pedido.municipioId,
        utilizadorId: params.executorId,
        accao: "SOLICITAR_CORRECAO_IDENTIDADE",
        entidade: "PedidoValidacaoIdentidade",
        entidadeId: pedido.id,
        detalhes: { motivoRejeicao: params.motivoRejeicao },
      },
    });

    return actualizado;
  });
}

/**
 * Rejeição definitiva (diferente de "pedido de correcção" — esta encerra
 * o pedido, não convida a reenviar). Usada quando o documento é
 * fraudulento ou os dados não correspondem de forma irrecuperável.
 */
export async function rejeitarDefinitivamente(params: {
  pedidoId: string;
  municipioId: string;
  motivoRejeicao: string;
  executorId: string;
}) {
  const pedido = await obterPedido(params.pedidoId, params.municipioId);

  if (pedido.estado === "APROVADO") {
    throw new EstadoInvalidoParaOperacaoError("Não é possível rejeitar um pedido já aprovado.");
  }

  return withTenantTransaction(params.municipioId, async (tx) => {
    const actualizado = await tx.pedidoValidacaoIdentidade.update({
      where: { id: params.pedidoId },
      data: { estado: "REJEITADO", motivoRejeicao: params.motivoRejeicao },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: pedido.municipioId,
        utilizadorId: params.executorId,
        accao: "REJEITAR_IDENTIDADE",
        entidade: "PedidoValidacaoIdentidade",
        entidadeId: pedido.id,
        detalhes: { motivoRejeicao: params.motivoRejeicao },
      },
    });

    return actualizado;
  });
}

/**
 * Passo "Aprovação por um Segundo Nível" do fluxograma — só se aplica de
 * facto a perfis críticos (PERFIS_QUE_EXIGEM_DUPLA_APROVACAO). Para os
 * restantes, aprovarNivel1 já conclui o fluxo directamente.
 *
 * O executor (revisor de nível 1) NUNCA pode ser o próprio utilizador a
 * validar — isso seria auto-validação de identidade, exactamente o tipo de
 * contorno que a secção 5.4 (regras de governação) quer impedir.
 */
export async function aprovarNivel1(params: {
  pedidoId: string;
  municipioId: string;
  executorId: string;
}) {
  const pedido = await obterPedido(params.pedidoId, params.municipioId);

  if (pedido.utilizadorId === params.executorId) {
    throw new SemPermissaoNivel2Error("Não é possível aprovar o seu próprio pedido de identidade.");
  }

  if (pedido.estado !== "EM_REVISAO") {
    throw new EstadoInvalidoParaOperacaoError(
      `Só é possível aprovar (nível 1) pedidos em revisão (estado actual: ${pedido.estado}).`
    );
  }

  const perfilExigeNivel2 = pedido.perfilSolicitadoId
    ? await perfilExigeDuplaAprovacao(pedido.perfilSolicitadoId)
    : false;

  const novoEstado = perfilExigeNivel2 ? "AGUARDANDO_NIVEL_2" : "APROVADO";

  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const resultado = await tx.pedidoValidacaoIdentidade.update({
      where: { id: params.pedidoId },
      data: {
        estado: novoEstado,
        aprovacaoNivel1PorId: params.executorId,
        aprovacaoNivel1Em: new Date(),
      },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: pedido.municipioId,
        utilizadorId: params.executorId,
        accao: "APROVAR_IDENTIDADE_NIVEL_1",
        entidade: "PedidoValidacaoIdentidade",
        entidadeId: pedido.id,
        detalhes: { exigeNivel2: perfilExigeNivel2 },
      },
    });

    return resultado;
  });

  if (novoEstado === "APROVADO") {
    await concluirAprovacao(actualizado, params.executorId, params.municipioId);
  }

  return actualizado;
}

/**
 * Segundo nível de aprovação — só chamável quando o pedido está em
 * AGUARDANDO_NIVEL_2. O executor do nível 2 tem de ser diferente do
 * executor do nível 1 (dois pares de olhos reais) e diferente do próprio
 * utilizador.
 */
export async function aprovarNivel2(params: {
  pedidoId: string;
  municipioId: string;
  executorId: string;
}) {
  const pedido = await obterPedido(params.pedidoId, params.municipioId);

  if (pedido.utilizadorId === params.executorId) {
    throw new SemPermissaoNivel2Error("Não é possível aprovar o seu próprio pedido de identidade.");
  }

  if (pedido.aprovacaoNivel1PorId === params.executorId) {
    throw new SemPermissaoNivel2Error(
      "A aprovação de 2º nível tem de ser feita por uma pessoa diferente da que aprovou o 1º nível."
    );
  }

  if (pedido.estado !== "AGUARDANDO_NIVEL_2") {
    throw new EstadoInvalidoParaOperacaoError(
      `Só é possível aprovar (nível 2) pedidos a aguardar 2º nível (estado actual: ${pedido.estado}).`
    );
  }

  const actualizado = await withTenantTransaction(params.municipioId, async (tx) => {
    const resultado = await tx.pedidoValidacaoIdentidade.update({
      where: { id: params.pedidoId },
      data: {
        estado: "APROVADO",
        aprovacaoNivel2PorId: params.executorId,
        aprovacaoNivel2Em: new Date(),
      },
    });

    await tx.logAuditoria.create({
      data: {
        municipioId: pedido.municipioId,
        utilizadorId: params.executorId,
        accao: "APROVAR_IDENTIDADE_NIVEL_2",
        entidade: "PedidoValidacaoIdentidade",
        entidadeId: pedido.id,
      },
    });

    return resultado;
  });

  await concluirAprovacao(actualizado, params.executorId, params.municipioId);

  return actualizado;
}

// perfis/permissoes são entidades globais sem RLS (ver rbac.service.ts) —
// `prisma` directo continua correcto aqui, sem necessidade de tenant.
async function perfilExigeDuplaAprovacao(perfilId: string): Promise<boolean> {
  const perfil = await prisma.perfil.findUnique({ where: { id: perfilId }, select: { nome: true } });
  if (!perfil) return false;
  return PERFIS_QUE_EXIGEM_DUPLA_APROVACAO.includes(perfil.nome);
}

/**
 * Passos finais do fluxograma: "Associação do Documento ao Perfil" →
 * "Atribuição de Perfil" → "Activação da Conta" → "Registo no Log".
 * Chamado tanto por aprovarNivel1 (quando não exige 2º nível) como por
 * aprovarNivel2 (sempre).
 *
 * CORRECÇÃO (verificação adicional, 28/06): "activar a conta" e "atribuir o
 * perfil solicitado" correm agora dentro da MESMA transacção (usando
 * atribuirPerfilTx em vez de atribuirPerfil). Antes, eram duas transacções
 * separadas — se a atribuição do perfil falhasse depois da conta já ter
 * sido marcada ACTIVA, ficava um estado inconsistente (conta activa, sem
 * nenhum perfil) sem possibilidade de rollback automático.
 */
async function concluirAprovacao(
  pedido: {
    id: string;
    utilizadorId: string;
    documentoTipo: string | null;
    documentoNumero: string | null;
    perfilSolicitadoId: string | null;
  },
  executorId: string,
  municipioId: string
): Promise<void> {
  await withTenantTransaction(municipioId, async (tx) => {
    await tx.utilizador.update({
      where: { id: pedido.utilizadorId },
      data: {
        documentoTipo: pedido.documentoTipo,
        documentoNumero: pedido.documentoNumero,
        documentoValidadoEm: new Date(),
        documentoValidadoPorId: executorId,
        estado: "ACTIVA",
      },
    });

    if (pedido.perfilSolicitadoId) {
      await atribuirPerfilTx(tx, {
        utilizadorId: pedido.utilizadorId,
        perfilId: pedido.perfilSolicitadoId,
        executorId,
      });
    }
  });
}