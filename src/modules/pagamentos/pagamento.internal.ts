import { randomInt } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client.js";


const ENTIDADE_RUPE_MUNICIPAL = "11121";

function gerarNumeroReferencia(): string {
  return String(randomInt(100_000_000, 999_999_999));
}

export const DIAS_VALIDADE_REFERENCIA_PAGAMENTO = 30;

export async function gerarReferenciaUnica(tx: Prisma.TransactionClient): Promise<string> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const referencia = gerarNumeroReferencia();
    const existente = await tx.pagamento.findUnique({ where: { referencia }, select: { id: true } });
    if (!existente) return referencia;
  }
  // Extremamente improvável (espaço de 9 dígitos), mas nunca deixar cair em referência duplicada.
  throw new Error("Não foi possível gerar uma referência de pagamento única. Tente novamente.");
}

export async function criarPagamentoParaProcessoTx(
  tx: Prisma.TransactionClient,
  params: {
    municipioId: string;
    processoId: string;
    valorReferenciaKz?: number;
    criadoPorId?: string;
  }
): Promise<void> {
  const referencia = await gerarReferenciaUnica(tx);
  const expiraEm = new Date(Date.now() + DIAS_VALIDADE_REFERENCIA_PAGAMENTO * 24 * 60 * 60 * 1000);
  
  const valor = params.valorReferenciaKz ?? 0;

  await tx.pagamento.create({
    data: {
      municipioId: params.municipioId,
      processoId: params.processoId,
      referencia,
      entidade: ENTIDADE_RUPE_MUNICIPAL,
      valor,
      estado: "PENDENTE",
      expiraEm,
      ...(params.criadoPorId !== undefined && { criadoPorId: params.criadoPorId }),
    },
  });

  await tx.processoGenerico.update({
    where: { id: params.processoId },
    data: { aguardaPagamento: true },
  });
}