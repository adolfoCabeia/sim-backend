import type { Prisma } from "../../generated/prisma/client.js";
export declare const DIAS_VALIDADE_REFERENCIA_PAGAMENTO = 30;
export declare function gerarReferenciaUnica(tx: Prisma.TransactionClient): Promise<string>;
export declare function criarPagamentoParaProcessoTx(tx: Prisma.TransactionClient, params: {
    municipioId: string;
    processoId: string;
    valorReferenciaKz?: number;
    criadoPorId?: string;
}): Promise<void>;
//# sourceMappingURL=pagamento.internal.d.ts.map