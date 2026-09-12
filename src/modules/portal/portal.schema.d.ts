import { z } from "zod";
export declare const criarPedidoPortalSchema: z.ZodObject<{
    tipo: z.ZodEnum<{
        EXPEDIENTE: "EXPEDIENTE";
        PARECER_JURIDICO: "PARECER_JURIDICO";
        REQUISICAO_BEM_SERVICO: "REQUISICAO_BEM_SERVICO";
        REQUISICAO_EMPREITADA: "REQUISICAO_EMPREITADA";
        PEDIDO_AUDIENCIA: "PEDIDO_AUDIENCIA";
        RECLAMACAO: "RECLAMACAO";
        DENUNCIA: "DENUNCIA";
        LICENCIAMENTO: "LICENCIAMENTO";
        SUGESTAO: "SUGESTAO";
        DOACAO: "DOACAO";
    }>;
    assunto: z.ZodString;
    servicoCodigo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CriarPedidoPortalInput = z.infer<typeof criarPedidoPortalSchema>;
export declare const listarMeusProcessosQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    tipo: z.ZodOptional<z.ZodEnum<{
        EXPEDIENTE: "EXPEDIENTE";
        PARECER_JURIDICO: "PARECER_JURIDICO";
        REQUISICAO_BEM_SERVICO: "REQUISICAO_BEM_SERVICO";
        REQUISICAO_EMPREITADA: "REQUISICAO_EMPREITADA";
        PEDIDO_AUDIENCIA: "PEDIDO_AUDIENCIA";
        RECLAMACAO: "RECLAMACAO";
        DENUNCIA: "DENUNCIA";
        LICENCIAMENTO: "LICENCIAMENTO";
        SUGESTAO: "SUGESTAO";
        DOACAO: "DOACAO";
    }>>;
    estado: z.ZodOptional<z.ZodEnum<{
        RECEBIDO: "RECEBIDO";
        EM_ANALISE: "EM_ANALISE";
        EM_PARECER: "EM_PARECER";
        AGUARDANDO_DESPACHO: "AGUARDANDO_DESPACHO";
        DEFERIDO: "DEFERIDO";
        INDEFERIDO: "INDEFERIDO";
        CONCLUIDO: "CONCLUIDO";
        DEVOLVIDO: "DEVOLVIDO";
    }>>;
}, z.core.$strip>;
export type ListarMeusProcessosQuery = z.infer<typeof listarMeusProcessosQuerySchema>;
export declare const listarServicosPortalQuerySchema: z.ZodObject<{
    tipo: z.ZodOptional<z.ZodEnum<{
        EXPEDIENTE: "EXPEDIENTE";
        PARECER_JURIDICO: "PARECER_JURIDICO";
        REQUISICAO_BEM_SERVICO: "REQUISICAO_BEM_SERVICO";
        REQUISICAO_EMPREITADA: "REQUISICAO_EMPREITADA";
        PEDIDO_AUDIENCIA: "PEDIDO_AUDIENCIA";
        RECLAMACAO: "RECLAMACAO";
        DENUNCIA: "DENUNCIA";
        LICENCIAMENTO: "LICENCIAMENTO";
        SUGESTAO: "SUGESTAO";
        DOACAO: "DOACAO";
    }>>;
    direcaoSigla: z.ZodOptional<z.ZodString>;
    pago: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export type ListarServicosPortalQuery = z.infer<typeof listarServicosPortalQuerySchema>;
//# sourceMappingURL=portal.schema.d.ts.map