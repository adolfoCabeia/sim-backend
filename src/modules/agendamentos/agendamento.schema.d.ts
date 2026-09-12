import { z } from "zod";
/**
 * "Agendamento Digital: Sistema de marcação prévia para audiências com o
 * administrador ou assistentes sociais, evitando filas."
 */
export declare const criarAgendamentoSchema: z.ZodObject<{
    tipo: z.ZodEnum<{
        ADMINISTRADOR: "ADMINISTRADOR";
        ASSISTENTE_SOCIAL: "ASSISTENTE_SOCIAL";
    }>;
    dataHoraInicio: z.ZodString;
    duracaoMinutos: z.ZodDefault<z.ZodNumber>;
    motivo: z.ZodString;
    processoGenericoId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CriarAgendamentoInput = z.infer<typeof criarAgendamentoSchema>;
export declare const confirmarAgendamentoSchema: z.ZodObject<{
    atendidoPorId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ConfirmarAgendamentoInput = z.infer<typeof confirmarAgendamentoSchema>;
export declare const cancelarAgendamentoSchema: z.ZodObject<{
    motivo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CancelarAgendamentoInput = z.infer<typeof cancelarAgendamentoSchema>;
export declare const listarAgendamentosQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    tipo: z.ZodOptional<z.ZodEnum<{
        ADMINISTRADOR: "ADMINISTRADOR";
        ASSISTENTE_SOCIAL: "ASSISTENTE_SOCIAL";
    }>>;
    estado: z.ZodOptional<z.ZodEnum<{
        CANCELADO: "CANCELADO";
        CONFIRMADO: "CONFIRMADO";
        SOLICITADO: "SOLICITADO";
        REALIZADO: "REALIZADO";
        FALTA: "FALTA";
    }>>;
    desde: z.ZodOptional<z.ZodString>;
    ate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListarAgendamentosQuery = z.infer<typeof listarAgendamentosQuerySchema>;
//# sourceMappingURL=agendamento.schema.d.ts.map