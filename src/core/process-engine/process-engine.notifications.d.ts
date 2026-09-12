import type { Prisma } from "../../generated/prisma/client.js";
/**
 * Regra 6.3(b): "Cada mudança de estado dispara automaticamente [...]
 * notificação ao requerente (SMS/e-mail/notificação na app)".
 *
 * Implementado:
 *  - Notificação in-app (tabela `Notificacao`) — sempre.
 *  - E-mail — sempre que o requerente tem email confirmado.
 *
 * NÃO implementado (ver relatório final):
 *  - SMS: não existe nenhum provedor de SMS configurado neste repositório
 *    (sem Twilio, Africa's Talking, Vodafone/Movicel gateway, etc. — nem
 *    variáveis de ambiente para isso em src/config/env.ts). A função
 *    abaixo regista a intenção e falha de forma silenciosa e auditável em
 *    vez de fingir que enviou. Ligar um provedor real é um passo de
 *    integração à parte, fora do alcance do motor em si.
 */
export declare function enviarSmsStub(params: {
    telefone: string;
    mensagem: string;
}): Promise<void>;
export declare function notificarTransicaoProcesso(tx: Prisma.TransactionClient, params: {
    utilizadorDestinoId: string;
    titulo: string;
    mensagem: string;
    emailDestino?: string | null;
    nomeDestino?: string | null;
    telefoneDestino?: string | null;
}): Promise<void>;
//# sourceMappingURL=process-engine.notifications.d.ts.map