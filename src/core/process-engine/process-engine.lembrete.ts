/**
 * Lembretes: "Tens documentos à espera da tua acção".
 *
 * Chamar periodicamente (ex.: de 6 em 6 horas) para cada município, a partir do
 * mesmo sítio onde já corre o alerta de prazos (SLA).
 *
 * Regras:
 *  - só lembra depois de o processo estar parado há `horasParaLembrar` horas
 *    (desde o último movimento);
 *  - não repete o lembrete antes de passarem `horasEntreLembretes` horas, a menos
 *    que o processo tenha andado entretanto e voltado a ficar parado;
 *  - cada pessoa recebe UMA notificação com o resumo de tudo o que a espera,
 *    em vez de uma por processo.
 *
 * Requer o campo `ultimoLembreteVezEm DateTime?` em ProcessoGenerico (ver notas).
 */
import type { Prisma } from "../../generated/prisma/client.js";
import { LocalizacaoProcesso } from "../../generated/prisma/client.js";
import { withTenantTransaction } from "../../config/prisma.js";
import type { EnviosPendentes } from "../notifications/notification.service.js";
import { notificarAcaoProcesso } from "./process-engine.notifications.js";
import { dispararNotificacaoComEnvio, juntarEnvios } from "./process-engine.service.js";
import { determinarVez, resolverDestinatariosDaVez, type Destinatario } from "./process-engine.vez.js";

const HORA_MS = 60 * 60 * 1000;
const MAX_PROCESSOS_NA_MENSAGEM = 5;

type Pendente = { processoId: string; numero: string; acaoEsperada: string; paradoDesdeMs: number };

function haQuantoTempo(desdeMs: number, agoraMs: number): string {
  const horas = Math.floor((agoraMs - desdeMs) / HORA_MS);
  if (horas < 24) return `há ${Math.max(horas, 1)} hora${horas > 1 ? "s" : ""}`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}

export async function enviarLembretesDeAccaoPendente(params: {
  municipioId: string;
  horasParaLembrar?: number;
  horasEntreLembretes?: number;
}): Promise<{ pessoasAvisadas: number; processosLembrados: number }> {
  const horasParaLembrar = params.horasParaLembrar ?? 24;
  const horasEntreLembretes = params.horasEntreLembretes ?? 24;
  const agora = new Date();
  const agoraMs = agora.getTime();

  let pessoasAvisadas = 0;
  let processosLembrados = 0;

  await dispararNotificacaoComEnvio(params.municipioId, `lembretes:${params.municipioId}`, async (tx: Prisma.TransactionClient) => {
    const processos = await tx.processoGenerico.findMany({
      where: {
        municipioId: params.municipioId,
        estado: { not: "CONCLUIDO" },
        arquivoDigitalEm: null,
        arquivoMortoEm: null,
        aguardaPagamento: false,
        localizacaoActual: { notIn: [LocalizacaoProcesso.CONCLUIDO_NOTIFICADO] },
      },
      select: {
        id: true,
        numero: true,
        estado: true,
        localizacaoActual: true,
        responsavelActualId: true,
        direcaoAtualId: true,
        direcaoDespachadaId: true,
        ultimoLembreteVezEm: true,
      },
    });
    if (processos.length === 0) return;

    // "Parado desde": data do último movimento registado no histórico.
    const movimentos = await tx.processoGenericoTransicao.groupBy({
      by: ["processoId"],
      where: { processoId: { in: processos.map((p) => p.id) } },
      _max: { criadoEm: true },
    });
    const ultimoMovimento = new Map(movimentos.map((m) => [m.processoId, m._max.criadoEm ?? null]));

    const porPessoa = new Map<string, { destinatario: Destinatario; pendentes: Pendente[] }>();
    const idsLembrados: string[] = [];

    // Cache: vários processos com a mesma vez (ex.: SG) partilham os mesmos destinatários.
    const cacheDestinatarios = new Map<string, Destinatario[]>();

    for (const p of processos) {
      const movimentoEm = ultimoMovimento.get(p.id);
      if (!movimentoEm) continue;

      const paradoHoras = (agoraMs - movimentoEm.getTime()) / HORA_MS;
      if (paradoHoras < horasParaLembrar) continue;

      const ultimo = p.ultimoLembreteVezEm;
      const jaLembradoNestaEspera = ultimo !== null && ultimo >= movimentoEm;
      const passouTempoSuficiente = ultimo === null || (agoraMs - ultimo.getTime()) / HORA_MS >= horasEntreLembretes;
      if (jaLembradoNestaEspera && !passouTempoSuficiente) continue;

      const vez = determinarVez(p);
      if (vez.papel === "NINGUEM") continue;

      const chave = `${vez.papel}:${vez.direcaoId ?? ""}:${vez.utilizadorId ?? ""}`;
      let destinatarios = cacheDestinatarios.get(chave);
      if (!destinatarios) {
        destinatarios = await resolverDestinatariosDaVez(tx, params.municipioId, vez);
        cacheDestinatarios.set(chave, destinatarios);
      }
      if (destinatarios.length === 0) continue;

      idsLembrados.push(p.id);
      for (const d of destinatarios) {
        const entrada = porPessoa.get(d.utilizadorId) ?? { destinatario: d, pendentes: [] };
        entrada.pendentes.push({
          processoId: p.id,
          numero: p.numero,
          acaoEsperada: vez.acaoEsperada,
          paradoDesdeMs: movimentoEm.getTime(),
        });
        porPessoa.set(d.utilizadorId, entrada);
      }
    }

    if (porPessoa.size === 0) return;

    const envios: EnviosPendentes[] = [];
    for (const { destinatario, pendentes } of porPessoa.values()) {
      // Os mais antigos primeiro: são os mais urgentes.
      pendentes.sort((a, b) => a.paradoDesdeMs - b.paradoDesdeMs);
      const total = pendentes.length;
      const maisAntigo = pendentes[0]!;

      const linhas = pendentes
        .slice(0, MAX_PROCESSOS_NA_MENSAGEM)
        .map((x) => `• Processo ${x.numero} (parado ${haQuantoTempo(x.paradoDesdeMs, agoraMs)}): ${x.acaoEsperada}`);
      const resto = total - linhas.length;

      const titulo =
        total === 1
          ? `Tens 1 processo à espera da tua acção`
          : `Tens ${total} processos à espera da tua acção`;
      const mensagem =
        `${total === 1 ? "Há um documento" : "Há documentos"} à espera da tua acção:\n` +
        linhas.join("\n") +
        (resto > 0 ? `\n… e mais ${resto}.` : "") +
        `\nAbre a tua lista "Aguarda a minha acção" para os tratar.`;

      const envio = await notificarAcaoProcesso(tx, {
        titulo,
        mensagem,
        tipo: "ACAO_REQUERIDA",
        processoId: maisAntigo.processoId,
        numeroProcesso: maisAntigo.numero,
        destinatarios: [destinatario],
      });
      juntarEnvios(envios, envio);
    }

    await tx.processoGenerico.updateMany({
      where: { id: { in: idsLembrados } },
      data: { ultimoLembreteVezEm: agora },
    });

    pessoasAvisadas = porPessoa.size;
    processosLembrados = idsLembrados.length;
    return envios;
  });

  return { pessoasAvisadas, processosLembrados };
}