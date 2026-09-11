import type { Prisma } from "../../../generated/prisma/client.js";
import { withTenantTransaction } from "../../../config/prisma.js";
import { notificarUtilizador } from "../../../core/notifications/notification.service.js";
import { listarUtilizadoresComPermissao, getPerfisDoUtilizador } from "../../auth/rbac/rbac.service.js";
import {
  HORARIO_PADRAO_INICIO_HORA,
  INTERVALO_MINIMO_NOTIFICACAO_AUSENCIA_PONTO_DIAS,
  HORARIO_PADRAO_FIM_HORA,
} from "../rh.constants.js";
import { horaLuanda, inicioDoDiaLuanda, dentroDoHorarioPermitido } from "./luanda.time.js";
import type { RegistarPontoInput } from "./ponto.schema.js";

export { horaLuanda, inicioDoDiaLuanda, dentroDoHorarioPermitido };

export class FuncionarioNaoEncontradoError extends Error {}
// Novo: um funcionário só pode ter um registo de cada tipo (ENTRADA/SAIDA)
// por dia — pedido explícito.
export class RegistoDuplicadoError extends Error {}

// Dados do Utilizador necessários para notificar directamente o próprio
// funcionário (nome, email, telefone) — mesmo padrão usado no
// funcionario.service.ts para não duplicar estes campos.
const UTILIZADOR_CONTACTO_SELECT = {
  id: true,
  nomeCompleto: true,
  email: true,
  emailConfirmado: true,
  telefone: true,
} as const;

export async function registarPonto(municipioId: string, dados: RegistarPontoInput) {
  return withTenantTransaction(municipioId, async (tx) => {
    const funcionario = await tx.funcionario.findUnique({ where: { id: dados.funcionarioId } });
    // Isolamento explícito entre municípios — não confiar só no scoping da
    // transacção (o mesmo padrão de defesa em profundidade usado no resto
    // da aplicação).
    if (!funcionario || funcionario.municipioId !== municipioId) {
      throw new FuncionarioNaoEncontradoError("Funcionário não encontrado.");
    }

    const inicioDia = inicioDoDiaLuanda();
    const registosHoje = await tx.registoPonto.findMany({
      where: { municipioId, funcionarioId: dados.funcionarioId, registadoEm: { gte: inicioDia } },
      orderBy: { registadoEm: "asc" },
    });

    // Regra pedida: só um registo de cada tipo (ENTRADA/SAIDA) por dia.
    if (registosHoje.some((r) => r.tipo === dados.tipo)) {
      throw new RegistoDuplicadoError(
        dados.tipo === "ENTRADA"
          ? "Já existe um registo de entrada hoje para este funcionário."
          : "Já existe um registo de saída hoje para este funcionário."
      );
    }

    // Inovação: uma SAIDA sem ENTRADA prévia no mesmo dia é uma
    // inconsistência (esquecimento de bater a entrada, uso indevido do
    // terminal, etc.) — regista-se na mesma (não vale a pena bloquear
    // alguém de sair), mas o RH é avisado para poder verificar, em vez de
    // a inconsistência passar em silêncio.
    const saidaSemEntrada = dados.tipo === "SAIDA" && !registosHoje.some((r) => r.tipo === "ENTRADA");

    const registo = await tx.registoPonto.create({
      data: {
        municipioId,
        funcionarioId: dados.funcionarioId,
        tipo: dados.tipo,
        metodo: dados.metodo,
        ...(dados.observacoes !== undefined && dados.observacoes !== null && { observacoes: dados.observacoes }),
      },
    });

    if (saidaSemEntrada) {
      const gestoresRH = await listarUtilizadoresComPermissao(tx, "funcionarios:gerir");
      for (const gestor of gestoresRH) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: gestor.id,
          titulo: `Saída sem entrada registada: ${funcionario.cargo}`,
          mensagem: `Funcionário (${funcionario.cargo}) registou saída hoje sem ter registado entrada. Pode ser um esquecimento — requer verificação.`,
          tipo: "ACAO_REQUERIDA",
          metadata: { funcionarioId: funcionario.id, registoId: registo.id, tipo: "SAIDA_SEM_ENTRADA" },
          emailDestino: gestor.emailConfirmado ? gestor.email : null,
          nomeDestino: gestor.nomeCompleto,
          telefoneDestino: gestor.telefone,
        });
      }
    }

    return registo;
  });
}

export async function listarRegistosPonto(
  filtros: {
    municipioId: string;
    funcionarioId?: string | undefined;
    tipo?: "ENTRADA" | "SAIDA" | undefined;
    desde?: Date | undefined;
    ate?: Date | undefined;
  },
  paginacao: { page: number; limit: number }
) {
  const skip = (paginacao.page - 1) * paginacao.limit;
  const where: Prisma.RegistoPontoWhereInput = {
    // Explícito — mesma razão de sempre: defesa em profundidade.
    municipioId: filtros.municipioId,
    ...(filtros.funcionarioId && { funcionarioId: filtros.funcionarioId }),
    ...(filtros.tipo && { tipo: filtros.tipo }),
  };
  if (filtros.desde || filtros.ate) {
    where.registadoEm = {
      ...(filtros.desde && { gte: filtros.desde }),
      ...(filtros.ate && { lte: filtros.ate }),
    };
  }

  return withTenantTransaction(filtros.municipioId, async (tx) => {
    const [data, total] = await Promise.all([
      tx.registoPonto.findMany({
        where,
        skip,
        take: paginacao.limit,
        orderBy: { registadoEm: "desc" },
        include: { funcionario: { select: { id: true, cargo: true } } },
      }),
      tx.registoPonto.count({ where }),
    ]);
    return { data, total };
  });
}

export async function obterUltimoRegistoDoDia(funcionarioId: string, municipioId: string) {
  const inicioDia = inicioDoDiaLuanda();

  return withTenantTransaction(municipioId, async (tx) => {
    return tx.registoPonto.findFirst({
      where: { municipioId, funcionarioId, registadoEm: { gte: inicioDia } },
      orderBy: { registadoEm: "desc" },
    });
  });
}

export async function utilizadorTemAcessoIlimitado(utilizadorId: string, municipioId: string): Promise<boolean> {
  const perfis = await getPerfisDoUtilizador(utilizadorId, municipioId);
  return perfis.some((p: { acessoIlimitadoPonto: boolean }) => p.acessoIlimitadoPonto);
}

export const MENSAGEM_FORA_DO_HORARIO_DE_ACESSO =
  `Acesso fora do horário permitido (${String(HORARIO_PADRAO_INICIO_HORA).padStart(2, "0")}h00–` +
  `${String(HORARIO_PADRAO_FIM_HORA).padStart(2, "0")}h00). Contacte o Administrador Municipal ` +
  "se precisar de acesso fora deste período.";

export async function verificarJanelaDeAcesso(params: {
  tipoConta: string;
  utilizadorId: string;
  municipioId: string;
  isRotaDePonto?: boolean;
}): Promise<{ permitido: boolean }> {
  if (params.tipoConta !== "INTERNO" || params.isRotaDePonto || dentroDoHorarioPermitido()) {
    return { permitido: true };
  }
  const temAcessoIlimitado = await utilizadorTemAcessoIlimitado(params.utilizadorId, params.municipioId);
  return { permitido: temAcessoIlimitado };
}

export async function notificarAusenciasSemRegistoPonto(params: {
  municipioId: string;
}): Promise<{ notificados: number }> {
  const agora = new Date();
  if (horaLuanda(agora) < HORARIO_PADRAO_INICIO_HORA + 1) return { notificados: 0 }; // margem de 1h

  const inicioDia = inicioDoDiaLuanda(agora);

  return withTenantTransaction(params.municipioId, async (tx) => {
    const funcionariosAtivos = await tx.funcionario.findMany({
      where: {
        municipioId: params.municipioId,
        estado: "ATIVO",
        tipoVinculo: { in: ["QUADRO", "CONTRATO"] },
      },
      select: { id: true, cargo: true, ultimaNotificacaoAusenciaPontoEm: true },
    });
    if (funcionariosAtivos.length === 0) return { notificados: 0 };

    const registosHoje = await tx.registoPonto.findMany({
      where: { municipioId: params.municipioId, registadoEm: { gte: inicioDia } },
      select: { funcionarioId: true },
    });
    const idsComRegisto = new Set(registosHoje.map((r: { funcionarioId: string }) => r.funcionarioId));

    const semRegisto = funcionariosAtivos.filter((f) => !idsComRegisto.has(f.id));
    if (semRegisto.length === 0) return { notificados: 0 };

    const gestoresRH = await listarUtilizadoresComPermissao(tx, "funcionarios:gerir");
    if (gestoresRH.length === 0) return { notificados: 0 };

    let notificados = 0;
    for (const funcionario of semRegisto) {
      const jaNotificadoHoje =
        funcionario.ultimaNotificacaoAusenciaPontoEm &&
        agora.getTime() - new Date(funcionario.ultimaNotificacaoAusenciaPontoEm).getTime() <
          INTERVALO_MINIMO_NOTIFICACAO_AUSENCIA_PONTO_DIAS * 24 * 60 * 60_000;
      if (jaNotificadoHoje) continue;

      for (const gestor of gestoresRH) {
        await notificarUtilizador(tx, {
          utilizadorDestinoId: gestor.id,
          titulo: `Ausência de registo de ponto: ${funcionario.cargo}`,
          mensagem: `Funcionário (${funcionario.cargo}) sem registo de ponto hoje. Requer verificação, nenhuma acção automática foi tomada.`,
          tipo: "ACAO_REQUERIDA",
          metadata: { funcionarioId: funcionario.id, tipo: "AUSENCIA_PONTO" },
          emailDestino: gestor.emailConfirmado ? gestor.email : null,
          nomeDestino: gestor.nomeCompleto,
          telefoneDestino: gestor.telefone,
        });
      }

      await tx.funcionario.update({
        where: { id: funcionario.id },
        data: { ultimaNotificacaoAusenciaPontoEm: agora },
      });
      notificados += 1;
    }

    return { notificados };
  });
}

/**
 * Pedido: às 15:50 (10 minutos antes do fecho, assumindo
 * HORARIO_PADRAO_FIM_HORA = 16h), avisar directamente cada funcionário que
 * já registou ENTRADA hoje mas ainda não registou SAIDA, para o fazer antes
 * do sistema fechar. Quem nem sequer registou ENTRADA já está coberto por
 * notificarAusenciasSemRegistoPonto — não faz sentido duplicar o aviso.
 *
 * Precisa de ser chamada por um agendador (cron) às 15:50, para cada
 * município activo — ver ponto.scheduler.example.ts.
 */
export async function notificarSaidaPendenteAntesDoFecho(params: {
  municipioId: string;
}): Promise<{ notificados: number }> {
  const inicioDia = inicioDoDiaLuanda();

  return withTenantTransaction(params.municipioId, async (tx) => {
    const funcionariosAtivos = await tx.funcionario.findMany({
      where: {
        municipioId: params.municipioId,
        estado: "ATIVO",
        tipoVinculo: { in: ["QUADRO", "CONTRATO"] },
      },
      select: {
        id: true,
        cargo: true,
        utilizador: { select: UTILIZADOR_CONTACTO_SELECT },
      },
    });
    if (funcionariosAtivos.length === 0) return { notificados: 0 };

    const registosHoje = await tx.registoPonto.findMany({
      where: { municipioId: params.municipioId, registadoEm: { gte: inicioDia } },
      select: { funcionarioId: true, tipo: true },
    });
    const idsComEntrada = new Set(
      registosHoje.filter((r) => r.tipo === "ENTRADA").map((r) => r.funcionarioId)
    );
    const idsComSaida = new Set(registosHoje.filter((r) => r.tipo === "SAIDA").map((r) => r.funcionarioId));

    const pendentes = funcionariosAtivos.filter((f) => idsComEntrada.has(f.id) && !idsComSaida.has(f.id));
    if (pendentes.length === 0) return { notificados: 0 };

    let notificados = 0;
    for (const funcionario of pendentes) {
      await notificarUtilizador(tx, {
        utilizadorDestinoId: funcionario.utilizador.id,
        titulo: "Lembrete: registe a sua saída",
        mensagem:
          "Ainda não registou a saída de hoje. Registe-a antes do encerramento do sistema às " +
          `${String(HORARIO_PADRAO_FIM_HORA).padStart(2, "0")}h00 para evitar uma marcação incompleta.`,
        tipo: "ACAO_REQUERIDA",
        metadata: { funcionarioId: funcionario.id, tipo: "SAIDA_PENDENTE" },
        emailDestino: funcionario.utilizador.emailConfirmado ? funcionario.utilizador.email : null,
        nomeDestino: funcionario.utilizador.nomeCompleto,
        telefoneDestino: funcionario.utilizador.telefone,
        canais: ["APP"],
      });
      notificados += 1;
    }

    return { notificados };
  });
}