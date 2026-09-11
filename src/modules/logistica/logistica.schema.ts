import { z } from "zod";

export const RequisicaoCategoriaEnum = z.enum(["BEM", "SERVICO", "EMPREITADA"]);
export const RequisicaoEstadoEnum = z.enum([
  "RASCUNHO", "SUBMETIDA", "APROVADA", "REJEITADA", "EM_EXECUCAO", "CONCLUIDA",
]);

const itemBemSchema = z.object({
  tipoBem: z.string().min(1).max(100),
  unidadeMedida: z.string().min(1).max(50),
  quantidade: z.coerce.number().positive(), // aceita string de FormData
  especificacoes: z.string().max(1000).optional(),
});

const baseRequisicaoSchema = z.object({
  designacao: z.string().min(3).max(200).optional(),
  destinatario: z.string().min(2).max(200).optional(),
  observacao: z.string().max(3000).optional(),
  direcaoId: z.string().uuid().optional(),
});

export const criarRequisicaoBemSchema = baseRequisicaoSchema.extend({
  categoria: z.literal("BEM"),
  itens: z.array(itemBemSchema).min(1).max(50),
});

export const criarRequisicaoServicoSchema = baseRequisicaoSchema.extend({
  categoria: z.literal("SERVICO"),
  tipoServico: z.enum(["REPARACAO", "MONTAGEM", "MELHORIA", "MANUTENCAO", "CONSTRUCAO_SOFTWARE"]),
  dataProximaAccao: z.string().datetime().optional(),
  beneficiarioServico: z.string().min(2).max(200).optional(),
  especificacoesTecnicas: z.string().max(3000).optional(),
});

export const criarRequisicaoEmpreitadaSchema = baseRequisicaoSchema.extend({
  categoria: z.literal("EMPREITADA"),
  dataInicioObra: z.string().datetime().optional(),
  estadoObra: z.enum(["NAO_INICIADA", "EM_CURSO", "PARADA", "CONCLUIDA"]).optional(),
  prazoExecucao: z.coerce.number().int().min(1).optional(), // coerce para FormData
  percentagemExecucao: z.coerce.number().int().min(0).max(100).optional(),
});

export const criarRequisicaoSchema = z.discriminatedUnion("categoria", [
  criarRequisicaoBemSchema,
  criarRequisicaoServicoSchema,
  criarRequisicaoEmpreitadaSchema,
]);

export const alterarEstadoSchema = z.object({
  estado: RequisicaoEstadoEnum,
  motivo: z.string().max(1000).optional(),
});

export const adicionarItemSchema = itemBemSchema;

export const listarRequisicoesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  categoria: RequisicaoCategoriaEnum.optional(),
  estado: RequisicaoEstadoEnum.optional(),
  direcaoId: z.string().uuid().optional(),
});

export const actualizarRequisicaoBemSchema = baseRequisicaoSchema.partial().extend({
  itens: z.array(itemBemSchema).min(1).max(50).optional(),
});

export const actualizarRequisicaoServicoSchema = baseRequisicaoSchema.partial().extend({
  tipoServico: z.enum(["REPARACAO", "MONTAGEM", "MELHORIA", "MANUTENCAO", "CONSTRUCAO_SOFTWARE"]).optional(),
  dataProximaAccao: z.string().datetime().optional(),
  beneficiarioServico: z.string().min(2).max(200).optional(),
  especificacoesTecnicas: z.string().max(3000).optional(),
});

export const actualizarRequisicaoEmpreitadaSchema = baseRequisicaoSchema.partial().extend({
  dataInicioObra: z.string().datetime().optional(),
  estadoObra: z.enum(["NAO_INICIADA", "EM_CURSO", "PARADA", "CONCLUIDA"]).optional(),
  prazoExecucao: z.coerce.number().int().min(1).optional(),
  percentagemExecucao: z.coerce.number().int().min(0).max(100).optional(),
});

export type ActualizarRequisicaoBemInput = z.infer<typeof actualizarRequisicaoBemSchema>;
export type ActualizarRequisicaoServicoInput = z.infer<typeof actualizarRequisicaoServicoSchema>;
export type ActualizarRequisicaoEmpreitadaInput = z.infer<typeof actualizarRequisicaoEmpreitadaSchema>;

export type CriarRequisicaoInput = z.infer<typeof criarRequisicaoSchema>;
export type AlterarEstadoInput = z.infer<typeof alterarEstadoSchema>;
export type AdicionarItemInput = z.infer<typeof adicionarItemSchema>;
export type ListarRequisicoesQuery = z.infer<typeof listarRequisicoesQuerySchema>;