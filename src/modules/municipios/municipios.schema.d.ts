import { z } from "zod";
export declare const criarMunicipioSchema: z.ZodObject<{
    nome: z.ZodString;
    codigo: z.ZodString;
    provincia: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CriarMunicipioInput = z.infer<typeof criarMunicipioSchema>;
//# sourceMappingURL=municipios.schema.d.ts.map