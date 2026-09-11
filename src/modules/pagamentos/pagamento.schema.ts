import { z } from "zod";

const ESTADOS_PAGAMENTO = ["PENDENTE", "PAGO", "EXPIRADO", "CANCELADO"] as const;

export const confirmarPagamentoSchema = z.object({
  meioPagamento: z.string().max(100).optional(),
  observacao: z.string().max(1000).optional(),
  metadados: z.record(z.string(), z.unknown()).optional(),
});
export type ConfirmarPagamentoInput = z.infer<typeof confirmarPagamentoSchema>;

export const cancelarPagamentoSchema = z.object({
  motivo: z.string().min(3).max(500),
});
export type CancelarPagamentoInput = z.infer<typeof cancelarPagamentoSchema>;

export const ajustarValorPagamentoSchema = z.object({
  valor: z.number().positive().max(999_999_999),
  motivo: z.string().min(3).max(500),
});
export type AjustarValorPagamentoInput = z.infer<typeof ajustarValorPagamentoSchema>;

export const listarPagamentosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  estado: z.enum(ESTADOS_PAGAMENTO).optional(),
});
export type ListarPagamentosQuery = z.infer<typeof listarPagamentosQuerySchema>;