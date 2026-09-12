import { z } from "zod";
export declare const criarProcessoSchema: z.ZodObject<{
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
    origem: z.ZodEnum<{
        CIDADAO: "CIDADAO";
        EMPRESA: "EMPRESA";
        INSTITUICAO: "INSTITUICAO";
        COMISSAO_MORADORES: "COMISSAO_MORADORES";
        INTERNO: "INTERNO";
    }>;
    assunto: z.ZodString;
    direcaoOrigemSigla: z.ZodOptional<z.ZodString>;
    servicoCodigo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CriarProcessoInput = z.infer<typeof criarProcessoSchema>;
export declare const transicionarProcessoSchema: z.ZodObject<{
    novoEstado: z.ZodEnum<{
        RECEBIDO: "RECEBIDO";
        EM_ANALISE: "EM_ANALISE";
        EM_PARECER: "EM_PARECER";
        AGUARDANDO_DESPACHO: "AGUARDANDO_DESPACHO";
        DEFERIDO: "DEFERIDO";
        INDEFERIDO: "INDEFERIDO";
        CONCLUIDO: "CONCLUIDO";
        DEVOLVIDO: "DEVOLVIDO";
    }>;
    observacao: z.ZodOptional<z.ZodString>;
    visivelAoCidadao: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type TransicionarProcessoInput = z.infer<typeof transicionarProcessoSchema>;
export declare const listarProcessosGenericosQuerySchema: z.ZodObject<{
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
    origem: z.ZodOptional<z.ZodEnum<{
        CIDADAO: "CIDADAO";
        EMPRESA: "EMPRESA";
        INSTITUICAO: "INSTITUICAO";
        COMISSAO_MORADORES: "COMISSAO_MORADORES";
        INTERNO: "INTERNO";
    }>>;
    atribuidosAMim: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    departamentoId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListarProcessosGenericosQuery = z.infer<typeof listarProcessosGenericosQuerySchema>;
export declare const atribuirResponsavelSchema: z.ZodObject<{
    novoResponsavelActualId: z.ZodString;
}, z.core.$strip>;
export type AtribuirResponsavelInput = z.infer<typeof atribuirResponsavelSchema>;
export declare const apresentarAdministradorSchema: z.ZodObject<{
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ApresentarAdministradorInput = z.infer<typeof apresentarAdministradorSchema>;
export declare const despacharEncaminhamentoSchema: z.ZodObject<{
    direcaoDespachadaSigla: z.ZodString;
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DespacharEncaminhamentoInput = z.infer<typeof despacharEncaminhamentoSchema>;
export declare const despacharAssessorJuridicoSchema: z.ZodObject<{
    assessorUtilizadorId: z.ZodString;
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DespacharAssessorJuridicoInput = z.infer<typeof despacharAssessorJuridicoSchema>;
export declare const expedirSchema: z.ZodObject<{
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ExpedirInput = z.infer<typeof expedirSchema>;
export declare const subirRespostaSchema: z.ZodObject<{
    viaExpediente: z.ZodBoolean;
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubirRespostaInput = z.infer<typeof subirRespostaSchema>;
export declare const prepararSaidaSchema: z.ZodObject<{
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PrepararSaidaInput = z.infer<typeof prepararSaidaSchema>;
export declare const submeterDespachoSaidaSchema: z.ZodObject<{
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubmeterDespachoSaidaInput = z.infer<typeof submeterDespachoSaidaSchema>;
export declare const despacharSaidaSchema: z.ZodObject<{
    autorizar: z.ZodBoolean;
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DespacharSaidaInput = z.infer<typeof despacharSaidaSchema>;
export declare const formalizarEnvioExternoSchema: z.ZodObject<{
    destinoExterno: z.ZodString;
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FormalizarEnvioExternoInput = z.infer<typeof formalizarEnvioExternoSchema>;
export declare const tipoAnexoProcessoSchema: z.ZodEnum<{
    ENTRADA: "ENTRADA";
    SAIDA: "SAIDA";
}>;
export type TipoAnexoProcessoInput = z.infer<typeof tipoAnexoProcessoSchema>;
//# sourceMappingURL=processos-genericos.schema.d.ts.map