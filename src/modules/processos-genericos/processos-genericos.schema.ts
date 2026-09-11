import { z } from "zod";
import type { MultipartFile } from "@fastify/multipart";


const TIPOS_PROCESSO_GENERICO = [
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
] as const;

const ORIGENS_PROCESSO = ["CIDADAO", "EMPRESA", "INSTITUICAO", "INTERNO", "COMISSAO_MORADORES"] as const;

const TIPOS_ANEXO_PROCESSO = ["ENTRADA", "SAIDA"] as const;

const ESTADOS_PROCESSO_GENERICO = [
  "RECEBIDO",
  "EM_ANALISE",
  "EM_PARECER",
  "AGUARDANDO_DESPACHO",
  "DEFERIDO",
  "INDEFERIDO",
  "CONCLUIDO",
  "DEVOLVIDO",
] as const;

export const criarProcessoSchema = z.object({
  tipo: z.enum(TIPOS_PROCESSO_GENERICO),
  origem: z.enum(ORIGENS_PROCESSO),
  assunto: z.string().min(5).max(300),
  direcaoOrigemSigla: z.string().optional(),

  servicoCodigo: z.string().optional(),
});
export type CriarProcessoInput = z.infer<typeof criarProcessoSchema>;

export const transicionarProcessoSchema = z.object({
  novoEstado: z.enum(ESTADOS_PROCESSO_GENERICO),
  observacao: z.string().max(2000).optional(),
  visivelAoCidadao: z.boolean().optional(),
});
export type TransicionarProcessoInput = z.infer<typeof transicionarProcessoSchema>;

export const listarProcessosGenericosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  tipo: z.enum(TIPOS_PROCESSO_GENERICO).optional(),
  estado: z.enum(ESTADOS_PROCESSO_GENERICO).optional(),
  origem: z.enum(ORIGENS_PROCESSO).optional(),
  atribuidosAMim: z.coerce.boolean().optional(),
  departamentoId: z.string().uuid().optional(),
  direcaoId: z.string().uuid().optional(),
  aguardaAccaoDeMim: z.coerce.boolean().optional(),

  arquivo: z.enum(["ACTIVOS", "DIGITAL", "MORTO", "TODOS"]).default("ACTIVOS"),
});
export type ListarProcessosGenericosQuery = z.infer<typeof listarProcessosGenericosQuerySchema>;

export const atribuirResponsavelSchema = z.object({
  novoResponsavelActualId: z.string().uuid(),
});
export type AtribuirResponsavelInput = z.infer<typeof atribuirResponsavelSchema>;


export const apresentarAdministradorSchema = z.object({ observacao: z.string().max(2000).optional() });
export type ApresentarAdministradorInput = z.infer<typeof apresentarAdministradorSchema>;

export const despacharEncaminhamentoSchema = z.object({
  direcaoDespachadaSigla: z.string().min(2),
  observacao: z.string().max(2000).optional(),
});
export type DespacharEncaminhamentoInput = z.infer<typeof despacharEncaminhamentoSchema>;

export const despacharAssessorJuridicoSchema = z.object({
  assessorUtilizadorId: z.string().uuid(),
  observacao: z.string().max(2000).optional(),
});
export type DespacharAssessorJuridicoInput = z.infer<typeof despacharAssessorJuridicoSchema>;

export const expedirSchema = z.object({ observacao: z.string().max(2000).optional() });
export type ExpedirInput = z.infer<typeof expedirSchema>;
;

export const anexarDocumentoSchema = z.object({
  tipoDocumentoCodigo: z.string().trim().min(1).optional(),
  tipoAnexo: z.enum(["ENTRADA", "SAIDA"]).optional(),
});

export type AnexarDocumentoInput = z.infer<typeof anexarDocumentoSchema>;
export const subirRespostaSchema = z.object({
  viaExpediente: z.boolean(),
  observacao: z.string().max(2000).optional(),
});
export type SubirRespostaInput = z.infer<typeof subirRespostaSchema>;

export const prepararSaidaSchema = z.object({ observacao: z.string().max(2000).optional() });
export type PrepararSaidaInput = z.infer<typeof prepararSaidaSchema>;

export const submeterDespachoSaidaSchema = z.object({ observacao: z.string().max(2000).optional() });
export type SubmeterDespachoSaidaInput = z.infer<typeof submeterDespachoSaidaSchema>;

export const despacharSaidaSchema = z.object({
  autorizar: z.boolean(),
  observacao: z.string().max(2000).optional(),
});
export type DespacharSaidaInput = z.infer<typeof despacharSaidaSchema>;

export const formalizarEnvioExternoSchema = z.object({
  destinoExterno: z.string().min(2).max(300),
  observacao: z.string().max(2000).optional(),
});
export type FormalizarEnvioExternoInput = z.infer<typeof formalizarEnvioExternoSchema>;

export const tipoAnexoProcessoSchema = z.enum(TIPOS_ANEXO_PROCESSO);
export type TipoAnexoProcessoInput = z.infer<typeof tipoAnexoProcessoSchema>;