import type { Prisma } from "../../generated/prisma/client.js";
import { notificarUtilizador } from "./notification.service.js";

export async function notificarGam(
  tx: Prisma.TransactionClient,
  params: {
    municipioId: string;
    titulo: string;
    mensagem: string;
    tipo: "PROCESSO_SUBMETIDO" | "ACAO_REQUERIDA";
    processoId: string;
    numeroProcesso: string;
  }
): Promise<void> {
  const funcionariosGam = await tx.utilizador.findMany({
    where: {
      municipioId: params.municipioId,
      estado: "ACTIVA",
      tipoConta: "INTERNO",
      OR: [
        { direcao: { sigla: "GAM" } },
        { perfis: { some: { perfil: { nome: "ADMINISTRADOR_MUNICIPAL" } } } },
      ],
    },
    select: { id: true, email: true, nomeCompleto: true },
  });

  for (const func of funcionariosGam) {
    await notificarUtilizador(tx, {
      utilizadorDestinoId: func.id,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: params.tipo,
      metadata: { processoId: params.processoId, numeroProcesso: params.numeroProcesso },
      emailDestino: func.email,
      nomeDestino: func.nomeCompleto,
      canais: ["APP", "EMAIL"],
    });
  }
}