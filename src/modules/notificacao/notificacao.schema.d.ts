import { z } from "zod";
export declare const listarNotificacoesQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    apenasNaoLidas: z.ZodDefault<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export type ListarNotificacoesQuery = z.infer<typeof listarNotificacoesQuerySchema>;
//# sourceMappingURL=notificacao.schema.d.ts.map