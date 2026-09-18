import type { Prisma } from "../../generated/prisma/client.js";
import { dispatchEmail } from "../../modules/email/email.transport.js";
import { env } from "../../config/env.js";
import { getIO } from "../../plugins/realtime/sockets.js";

export async function enviarSmsStub(params: { telefone: string; mensagem: string }): Promise<void> {
  console.warn(
    `[SMS-NAO-CONFIGURADO] Seria enviado SMS para ${params.telefone}: "${params.mensagem}". ` +
      `Nenhum provedor de SMS está integrado neste projecto — configurar antes de produção.`
  );
}

type CanalNotificacao = "APP" | "EMAIL" | "SMS";

interface NotificarParams {
  utilizadorDestinoId: string;
  titulo: string;
  mensagem: string;
  tipo:
    | "PROCESSO_SUBMETIDO"
    | "PROCESSO_ATRIBUIDO"
    | "PROCESSO_ATUALIZADO"
    | "PROCESSO_CONCLUIDO"
    | "ACAO_REQUERIDA"
    | "SISTEMA"
    | "OCORRENCIA_MENSAGEM"
    | "OCORRENCIA_ATUALIZADA"
    | "OCORRENCIA_ATRIBUIDA";
  metadata?: Record<string, unknown> | undefined;
  emailDestino?: string | null | undefined;
  nomeDestino?: string | null | undefined;
  telefoneDestino?: string | null | undefined;
  canais?: CanalNotificacao[] | undefined;
}

/*
 * ── PADRÃO DE ENVIO ──────────────────────────────────────────────────────
 * `notificarUtilizador` corre DENTRO da tx curta de `withTenantTransaction`
 * chamada por quem a invoca. Por isso só faz aqui o que é rápido e não
 * depende de rede externa: gravar a notificação "APP" na BD e emitir o
 * evento de socket (best-effort).
 *
 * O envio de email/SMS NUNCA deve acontecer dentro dessa tx — se o
 * provedor (Brevo, SMTP, etc.) estiver lento ou em baixo, a tx do Prisma
 * expira antes do envio terminar de falhar, e o commit rebenta com P2028
 * mesmo que a escrita de negócio já estivesse pronta. Por isso esta
 * função apenas MONTA a mensagem e devolve-a como "pendente" — quem
 * chama dispara `dispararEnviosPendentes` depois da tx já ter fechado.
 */
export interface EnviosPendentes {
  email: { to: string; toName?: string | undefined; subject: string; html: string } | null;
  sms: { telefone: string; mensagem: string } | null;
}

function construirHtmlEmail(params: NotificarParams): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="padding: 24px 0; border-bottom: 2px solid #0b5fae;">
        <strong style="font-size: 18px; color: #0b5fae;">SIM</strong>
      </div>
      <div style="padding: 24px 0;">
        <p>Olá ${params.nomeDestino ?? ""},</p>
        <p>${params.mensagem}</p>
        ${
          params.metadata?.processoId
            ? `
          <p style="margin-top: 16px;">
            <a href="${env.FRONTEND_URL}/processos-genericos/${params.metadata.processoId}"
               style="display: inline-block; padding: 10px 20px; background: #0b5fae; color: #fff; text-decoration: none; border-radius: 4px;">
              Ver processo
            </a>
          </p>
        `
            : ""
        }
      </div>
      <div style="padding: 16px 0; border-top: 1px solid #e2e2e2; font-size: 12px; color: #888;">
        Administração Municipal. Esta é uma mensagem automática, não responda a este email.
      </div>
    </div>
  `;
}

export async function notificarUtilizador(
  tx: Prisma.TransactionClient,
  params: NotificarParams
): Promise<EnviosPendentes> {
  const canais = params.canais ?? ["APP", "EMAIL"];

  if (canais.includes("APP")) {
    await tx.notificacao.create({
      data: {
        utilizadorId: params.utilizadorDestinoId,
        titulo: params.titulo,
        mensagem: params.mensagem,
        tipo: params.tipo,
        lida: false,
      },
    });
  }

  try {
    const io = getIO();
    io?.to(`utilizador:${params.utilizadorDestinoId}`).emit("notificacao", {
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: params.tipo,
      timestamp: new Date().toISOString(),
      metadata: params.metadata ?? {},
    });
  } catch {
    // socket é best-effort, nunca deve bloquear a notificação
  }

  const pendentes: EnviosPendentes = { email: null, sms: null };

  if (canais.includes("EMAIL") && params.emailDestino) {
    pendentes.email = {
      to: params.emailDestino,
      toName: params.nomeDestino ?? undefined,
      subject: params.titulo,
      html: construirHtmlEmail(params),
    };
  }

  if (canais.includes("SMS") && params.telefoneDestino) {
    pendentes.sms = { telefone: params.telefoneDestino, mensagem: params.mensagem };
  }

  return pendentes;
}

/**
 * Dispara, fora de qualquer transacção da BD, os envios pendentes
 * devolvidos por `notificarUtilizador`/`notificarMultiplos`. Cada envio
 * corre isoladamente — uma falha de email nunca impede o SMS (ou
 * vice-versa), e nenhuma excepção sobe para quem chamou: é sempre
 * apanhada e logada aqui.
 */
export async function dispararEnviosPendentes(
  contexto: string,
  ...listas: EnviosPendentes[]
): Promise<void> {
  const disparos: Promise<void>[] = [];

  for (const pendente of listas) {
    if (pendente.email) {
      const email = pendente.email;
      disparos.push(
        dispatchEmail(email).catch((erro) => {
          console.error(`[Notificacao] Falha ao enviar email (${contexto}):`, erro);
        })
      );
    }
    if (pendente.sms) {
      const sms = pendente.sms;
      disparos.push(
        enviarSmsStub(sms).catch((erro) => {
          console.error(`[Notificacao] Falha ao enviar SMS (${contexto}):`, erro);
        })
      );
    }
  }

  await Promise.all(disparos);
}

export async function notificarMultiplos(
  tx: Prisma.TransactionClient,
  params: {
    utilizadorIds: string[];
    titulo: string;
    mensagem: string;
    tipo: NotificarParams["tipo"];
    metadata?: Record<string, unknown> | undefined;
  }
): Promise<EnviosPendentes[]> {
  const pendentes: EnviosPendentes[] = [];
  for (const uid of params.utilizadorIds) {
    const p = await notificarUtilizador(tx, {
      utilizadorDestinoId: uid,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: params.tipo,
      metadata: params.metadata,
      canais: ["APP"],
    });
    pendentes.push(p);
  }
  return pendentes;
}