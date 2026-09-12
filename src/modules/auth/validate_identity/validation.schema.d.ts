import { z } from "zod";
export declare const submeterDocumentoSchema: z.ZodObject<{
    documentoTipo: z.ZodEnum<{
        "Bilhete de Identidade": "Bilhete de Identidade";
        "Documento Fiscal": "Documento Fiscal";
    }>;
    documentoNumero: z.ZodString;
    perfilSolicitadoId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubmeterDocumentoInput = z.infer<typeof submeterDocumentoSchema>;
export declare const aprovarPedidoSchema: z.ZodObject<{
    comentario: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AprovarPedidoInput = z.infer<typeof aprovarPedidoSchema>;
export declare const rejeitarPedidoSchema: z.ZodObject<{
    motivoRejeicao: z.ZodString;
}, z.core.$strip>;
export type RejeitarPedidoInput = z.infer<typeof rejeitarPedidoSchema>;
//# sourceMappingURL=validation.schema.d.ts.map