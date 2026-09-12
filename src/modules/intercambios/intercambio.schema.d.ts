import { z } from "zod";
export declare const enviarIntercambioSchema: z.ZodObject<{
    municipioDestinoId: z.ZodString;
    assunto: z.ZodString;
    documentoStorageKey: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EnviarIntercambioInput = z.infer<typeof enviarIntercambioSchema>;
export declare const listarIntercambiosQuerySchema: z.ZodObject<{
    direcao: z.ZodDefault<z.ZodEnum<{
        ENVIADOS: "ENVIADOS";
        RECEBIDOS: "RECEBIDOS";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type ListarIntercambiosQuery = z.infer<typeof listarIntercambiosQuerySchema>;
//# sourceMappingURL=intercambio.schema.d.ts.map