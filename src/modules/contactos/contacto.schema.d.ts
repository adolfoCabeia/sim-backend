import { z } from "zod";
export declare const criarContactoSchema: z.ZodObject<{
    tipo: z.ZodEnum<{
        INTERNO: "INTERNO";
        EXTERNO: "EXTERNO";
    }>;
    nome: z.ZodString;
    cargo: z.ZodOptional<z.ZodString>;
    instituicao: z.ZodOptional<z.ZodString>;
    direcaoSigla: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    endereco: z.ZodOptional<z.ZodString>;
    notas: z.ZodOptional<z.ZodString>;
    visivelPublico: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type CriarContactoInput = z.infer<typeof criarContactoSchema>;
export declare const editarContactoSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodString>;
    instituicao: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    endereco: z.ZodOptional<z.ZodString>;
    notas: z.ZodOptional<z.ZodString>;
    visivelPublico: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type EditarContactoInput = z.infer<typeof editarContactoSchema>;
export declare const listarContactosQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    tipo: z.ZodOptional<z.ZodEnum<{
        INTERNO: "INTERNO";
        EXTERNO: "EXTERNO";
    }>>;
    pesquisa: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListarContactosQuery = z.infer<typeof listarContactosQuerySchema>;
export declare const listarContactosPublicoQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pesquisa: z.ZodOptional<z.ZodString>;
    municipioId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListarContactosPublicoQuery = z.infer<typeof listarContactosPublicoQuerySchema>;
//# sourceMappingURL=contacto.schema.d.ts.map