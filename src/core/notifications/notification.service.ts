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
    | "OCORRENCIA_MENSAGEM"   // novo
    | "OCORRENCIA_ATUALIZADA" // novo
    | "OCORRENCIA_ATRIBUIDA"; 
  metadata?: Record<string, unknown> | undefined;
  emailDestino?: string | null | undefined;
  nomeDestino?: string | null | undefined;
  telefoneDestino?: string | null | undefined;
  canais?: CanalNotificacao[] | undefined;
}

export async function notificarUtilizador(
  tx: Prisma.TransactionClient,
  params: NotificarParams
): Promise<void> {
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
  }

  if (canais.includes("EMAIL") && params.emailDestino) {
    try {
      await dispatchEmail({
        to: params.emailDestino,
        ...(params.nomeDestino ? { toName: params.nomeDestino } : {}),
        subject: params.titulo,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <div style="padding: 24px 0; border-bottom: 2px solid #0b5fae;">
              <strong style="font-size: 18px; color: #0b5fae;">SIM</strong>
            </div>
            <div style="padding: 24px 0;">
              <p>Olá ${params.nomeDestino ?? ""},</p>
              <p>${params.mensagem}</p>
              ${params.metadata?.processoId ? `
                <p style="margin-top: 16px;">
                  <a href="${env.FRONTEND_URL}/processos-genericos/${params.metadata.processoId}" 
                     style="display: inline-block; padding: 10px 20px; background: #0b5fae; color: #fff; text-decoration: none; border-radius: 4px;">
                    Ver processo
                  </a>
                </p>
              ` : ""}
            </div>
            <div style="padding: 16px 0; border-top: 1px solid #e2e2e2; font-size: 12px; color: #888;">
              Administração Municipal. Esta é uma mensagem automática, não responda a este email.
            </div>
          </div>
        `,
      });
    } catch (erro) {
      console.error("[Notificacao] Falha ao enviar email:", erro);
    }
  }

  // 4. SMS
  if (canais.includes("SMS") && params.telefoneDestino) {
    await enviarSmsStub({ telefone: params.telefoneDestino, mensagem: params.mensagem });
  }
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
): Promise<void> {
  for (const uid of params.utilizadorIds) {
    await notificarUtilizador(tx, {
      utilizadorDestinoId: uid,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: params.tipo,
      metadata: params.metadata,
      canais: ["APP"],
    });
  }
}