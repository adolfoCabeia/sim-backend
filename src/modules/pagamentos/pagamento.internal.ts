import { randomInt } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client.js";


const ENTIDADE_RUPE_MUNICIPAL = "11121";
const MAX_TENTATIVAS_REFERENCIA = 5;

function gerarNumeroReferencia(): string {
  return String(randomInt(100_000_000, 999_999_999));
}

export const DIAS_VALIDADE_REFERENCIA_PAGAMENTO = 30;


export async function gerarReferenciaUnica(tx: Prisma.TransactionClient): Promise<string> {
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS_REFERENCIA; tentativa++) {
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
  const expiraEm = new Date(Date.now() + DIAS_VALIDADE_REFERENCIA_PAGAMENTO * 24 * 60 * 60 * 1000);
  const valor = params.valorReferenciaKz ?? 0;

  // Inserção com `ON CONFLICT DO NOTHING` (skipDuplicates): se outra transacção concorrente
  // gerou a mesma referência, esta inserção é ignorada (count = 0) em vez de rebentar com
  // P2002. Um erro de constraint dentro de uma transacção interactive do Postgres deixaria a
  // transacção inteira abortada, e não seria possível tentar de novo com outra referência.
  let criado = false;
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS_REFERENCIA && !criado; tentativa++) {
    const referencia = gerarNumeroReferencia();
    const resultado = await tx.pagamento.createMany({
      data: [
        {
          municipioId: params.municipioId,
          processoId: params.processoId,
          referencia,
          entidade: ENTIDADE_RUPE_MUNICIPAL,
          valor,
          estado: "PENDENTE",
          expiraEm,
          ...(params.criadoPorId !== undefined && { criadoPorId: params.criadoPorId }),
        },
      ],
      skipDuplicates: true,
    });
    criado = resultado.count === 1;
  }

  if (!criado) {
    throw new Error("Não foi possível gerar uma referência de pagamento única. Tente novamente.");
  }

  await tx.processoGenerico.update({
    where: { id: params.processoId },
    data: { aguardaPagamento: true },
  });
}