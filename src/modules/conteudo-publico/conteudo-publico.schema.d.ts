import { z } from "zod";
export declare const criarConteudoPublicoSchema: z.ZodObject<{
    chave: z.ZodString;
    titulo: z.ZodString;
    resumo: z.ZodOptional<z.ZodString>;
    corpo: z.ZodString;
    categoria: z.ZodDefault<z.ZodEnum<{
        NOTICIA: "NOTICIA";
        AVISO: "AVISO";
        SERVICO: "SERVICO";
        TRANSPARENCIA: "TRANSPARENCIA";
        LEGISLACAO: "LEGISLACAO";
        EVENTO: "EVENTO";
        OUTRO: "OUTRO";
    }>>;
}, z.core.$strip>;
export type CriarConteudoPublicoInput = z.infer<typeof criarConteudoPublicoSchema>;
export declare const editarConteudoPublicoSchema: z.ZodObject<{
    titulo: z.ZodOptional<z.ZodString>;
    resumo: z.ZodOptional<z.ZodString>;
    corpo: z.ZodOptional<z.ZodString>;
    categoria: z.ZodOptional<z.ZodEnum<{
        NOTICIA: "NOTICIA";
        AVISO: "AVISO";
        SERVICO: "SERVICO";
        TRANSPARENCIA: "TRANSPARENCIA";
        LEGISLACAO: "LEGISLACAO";
        EVENTO: "EVENTO";
        OUTRO: "OUTRO";
    }>>;
}, z.core.$strip>;
export type EditarConteudoPublicoInput = z.infer<typeof editarConteudoPublicoSchema>;
export declare const publicarConteudoPublicoSchema: z.ZodObject<{
    estadoPublicacao: z.ZodEnum<{
        PUBLICADO: "PUBLICADO";
        PUBLICADO_PARCIAL: "PUBLICADO_PARCIAL";
        RESTRITO: "RESTRITO";
    }>;
    gruposComAcesso: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        CIDADAO: "CIDADAO";
        EMPRESA: "EMPRESA";
        INSTITUICAO: "INSTITUICAO";
        COMISSAO_MORADORES: "COMISSAO_MORADORES";
        INTERNO: "INTERNO";
    }>>>;
}, z.core.$strip>;
export type PublicarConteudoPublicoInput = z.infer<typeof publicarConteudoPublicoSchema>;
export declare const listarConteudosPublicosQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    categoria: z.ZodOptional<z.ZodEnum<{
        NOTICIA: "NOTICIA";
        AVISO: "AVISO";
        SERVICO: "SERVICO";
        TRANSPARENCIA: "TRANSPARENCIA";
        LEGISLACAO: "LEGISLACAO";
        EVENTO: "EVENTO";
        OUTRO: "OUTRO";
    }>>;
    estadoPublicacao: z.ZodOptional<z.ZodEnum<{
        RASCUNHO: "RASCUNHO";
        PUBLICADO: "PUBLICADO";
        PUBLICADO_PARCIAL: "PUBLICADO_PARCIAL";
        RESTRITO: "RESTRITO";
    }>>;
}, z.core.$strip>;
export type ListarConteudosPublicosQuery = z.infer<typeof listarConteudosPublicosQuerySchema>;
export declare const listarConteudosPublicosPublicoQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    categoria: z.ZodOptional<z.ZodEnum<{
        NOTICIA: "NOTICIA";
        AVISO: "AVISO";
        SERVICO: "SERVICO";
        TRANSPARENCIA: "TRANSPARENCIA";
        LEGISLACAO: "LEGISLACAO";
        EVENTO: "EVENTO";
        OUTRO: "OUTRO";
    }>>;
    municipioId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListarConteudosPublicosPublicoQuery = z.infer<typeof listarConteudosPublicosPublicoQuerySchema>;
//# sourceMappingURL=conteudo-publico.schema.d.ts.map