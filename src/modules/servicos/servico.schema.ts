import { z } from "zod";

const TIPOS_PROCESSO = [
  "EXPEDIENTE",
  "PARECER_JURIDICO",
  "REQUISICAO_BEM_SERVICO",
  "REQUISICAO_EMPREITADA",
  "PEDIDO_AUDIENCIA",
  "RECLAMACAO",
  "DENUNCIA",
  "LICENCIAMENTO",
  "SUGESTAO",
  "DOACAO",
  "AUTO_NOTICIA",
  "CONTRA_ORDENACAO",
  "VISTORIA",
] as const;

const ORIGENS = ["CIDADAO", "EMPRESA", "INSTITUICAO", "INTERNO", "COMISSAO_MORADORES"] as const;

export const documentoExigidoSchema = z.object({
  codigo: z.string().min(2).max(100),
  nome: z.string().min(2).max(300),
  obrigatorio: z.boolean().default(true),
});
export type DocumentoExigido = z.infer<typeof documentoExigidoSchema>;

const servicoBaseSchema = z.object({
  codigo: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[A-Z0-9_]+$/, "O código deve usar apenas maiúsculas, números e underscore (ex: LICENCA_EVENTO_CULTURAL)."),
  nome: z.string().min(2).max(300),
  descricao: z.string().min(2).max(2000),
  tipoProcesso: z.enum(TIPOS_PROCESSO),
  direcaoResponsavelSigla: z.string().min(1).max(50),
  prazoDiasCorridos: z.number().int().min(1, "O prazo tem de ser pelo menos 1 dia."),
  diasAlertaAntesPrazo: z.number().int().min(0),
  origensPermitidas: z.array(z.enum(ORIGENS)).min(1, "Indique pelo menos uma origem permitida."),
  documentosExigidos: z.array(documentoExigidoSchema).default([]),
  pago: z.boolean().default(false),
  valorReferenciaKz: z.number().nonnegative().max(999_999_999_999).optional(),
  fonte: z.string().max(500).optional(),
});

export const criarServicoSchema = servicoBaseSchema.superRefine((dados, ctx) => {
  if (dados.diasAlertaAntesPrazo >= dados.prazoDiasCorridos) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["diasAlertaAntesPrazo"],
      message: "Os dias de alerta têm de ser inferiores ao prazo total.",
    });
  }
});
export type CriarServicoInput = z.infer<typeof criarServicoSchema>;

export const actualizarServicoSchema = servicoBaseSchema.partial().superRefine((dados, ctx) => {
  if (
    dados.prazoDiasCorridos !== undefined &&
    dados.diasAlertaAntesPrazo !== undefined &&
    dados.diasAlertaAntesPrazo >= dados.prazoDiasCorridos
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["diasAlertaAntesPrazo"],
      message: "Os dias de alerta têm de ser inferiores ao prazo total.",
    });
  }
});
export type ActualizarServicoInput = z.infer<typeof actualizarServicoSchema>;

export const listarServicosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(50),
  origem: z.enum(ORIGENS).optional(),
  tipoProcesso: z.enum(TIPOS_PROCESSO).optional(),
  direcaoResponsavelSigla: z.string().optional(),
  pago: z.coerce.boolean().optional(),
  activo: z.coerce.boolean().optional(),
  pesquisa: z.string().max(200).optional(),
});
export type ListarServicosQuery = z.infer<typeof listarServicosQuerySchema>;

/** Query da listagem pública: sem paginação e sem `activo` (é sempre forçado a true no serviço).
 * Não herda de listarServicosQuerySchema de propósito — a API pública não deve aceitar page/pageSize. */
export const listarServicosPublicoQuerySchema = z.object({
  municipioId: z.string().uuid(),
  origem: z.enum(ORIGENS).optional(),
  tipoProcesso: z.enum(TIPOS_PROCESSO).optional(),
  direcaoResponsavelSigla: z.string().optional(),
  pago: z.coerce.boolean().optional(),
  pesquisa: z.string().max(200).optional(),
});
export type ListarServicosPublicoQuery = z.infer<typeof listarServicosPublicoQuerySchema>;

/** Params/query do detalhe público (GET /servicos/publico/:codigo?municipioId=...). */
export const obterServicoPublicoParamsSchema = z.object({
  codigo: z.string().min(2).max(100),
});
export type ObterServicoPublicoParams = z.infer<typeof obterServicoPublicoParamsSchema>;

export const obterServicoPublicoQuerySchema = z.object({
  municipioId: z.string().uuid(),
});
export type ObterServicoPublicoQuery = z.infer<typeof obterServicoPublicoQuerySchema>;