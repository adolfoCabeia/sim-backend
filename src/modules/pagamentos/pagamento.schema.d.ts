import { z } from "zod";
export declare const confirmarPagamentoSchema: z.ZodObject<{
    meioPagamento: z.ZodOptional<z.ZodString>;
    observacao: z.ZodOptional<z.ZodString>;
    metadados: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type ConfirmarPagamentoInput = z.infer<typeof confirmarPagamentoSchema>;
export declare const cancelarPagamentoSchema: z.ZodObject<{
    motivo: z.ZodString;
}, z.core.$strip>;
export type CancelarPagamentoInput = z.infer<typeof cancelarPagamentoSchema>;
export declare const ajustarValorPagamentoSchema: z.ZodObject<{
    valor: z.ZodNumber;
    motivo: z.ZodString;
}, z.core.$strip>;
export type AjustarValorPagamentoInput = z.infer<typeof ajustarValorPagamentoSchema>;
export declare const listarPagamentosQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    estado: z.ZodOptional<z.ZodEnum<{
        PENDENTE: "PENDENTE";
        PAGO: "PAGO";
        EXPIRADO: "EXPIRADO";
        CANCELADO: "CANCELADO";
    }>>;
}, z.core.$strip>;
export type ListarPagamentosQuery = z.infer<typeof listarPagamentosQuerySchema>;
//# sourceMappingURL=pagamento.schema.d.ts.map