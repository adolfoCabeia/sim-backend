import { z } from "zod";

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


export const criarPedidoPortalSchema = z.object({
  tipo: z.enum(TIPOS_PROCESSO_GENERICO),
  assunto: z.string().min(5).max(300),
  servicoCodigo: z.string().optional(),
});
export type CriarPedidoPortalInput = z.infer<typeof criarPedidoPortalSchema>;

export const listarMeusProcessosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  tipo: z.enum(TIPOS_PROCESSO_GENERICO).optional(),
  estado: z.enum(ESTADOS_PROCESSO_GENERICO).optional(),
});
export type ListarMeusProcessosQuery = z.infer<typeof listarMeusProcessosQuerySchema>;

export const listarServicosPortalQuerySchema = z.object({
  tipo: z.enum(TIPOS_PROCESSO_GENERICO).optional(),
  direcaoSigla: z.string().optional(),
  pago: z.coerce.boolean().optional(),
});
export type ListarServicosPortalQuery = z.infer<typeof listarServicosPortalQuerySchema>;