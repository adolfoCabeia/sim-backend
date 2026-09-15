import { z } from "zod";

const CATEGORIAS = ["NOTICIA", "AVISO", "SERVICO", "TRANSPARENCIA", "LEGISLACAO", "EVENTO", "OUTRO"] as const;
const GRUPOS = ["INTERNO", "CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"] as const;
const ESTADOS_PUBLICACAO = ["RASCUNHO", "PUBLICADO", "PUBLICADO_PARCIAL", "RESTRITO"] as const;

const CHAVE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const criarConteudoPublicoSchema = z.object({
  chave: z.string().min(3).max(120).regex(CHAVE_REGEX, "A chave só pode conter minúsculas, números e hífens (ex.: 'novo-horario-atendimento')."),
  titulo: z.string().min(3).max(200),
  resumo: z.string().max(500).optional(),
  corpo: z.string().min(1).max(50_000),
  categoria: z.enum(CATEGORIAS).default("OUTRO"),
});
export type CriarConteudoPublicoInput = z.infer<typeof criarConteudoPublicoSchema>;

export const editarConteudoPublicoSchema = z.object({
  titulo: z.string().min(3).max(200).optional(),
  resumo: z.string().max(500).optional(),
  corpo: z.string().min(1).max(50_000).optional(),
  categoria: z.enum(CATEGORIAS).optional(),
});
export type EditarConteudoPublicoInput = z.infer<typeof editarConteudoPublicoSchema>;


export const publicarConteudoPublicoSchema = z
  .object({
    estadoPublicacao: z.enum(["PUBLICADO", "PUBLICADO_PARCIAL", "RESTRITO"]),
    gruposComAcesso: z.array(z.enum(GRUPOS)).optional(),
  })
  .refine((data) => data.estadoPublicacao !== "RESTRITO" || (data.gruposComAcesso && data.gruposComAcesso.length > 0), {
    message: "Ao restringir, é obrigatório indicar pelo menos um grupo em 'gruposComAcesso'.",
    path: ["gruposComAcesso"],
  });
export type PublicarConteudoPublicoInput = z.infer<typeof publicarConteudoPublicoSchema>;

export const listarConteudosPublicosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  categoria: z.enum(CATEGORIAS).optional(),
  estadoPublicacao: z.enum(ESTADOS_PUBLICACAO).optional(),
});
export type ListarConteudosPublicosQuery = z.infer<typeof listarConteudosPublicosQuerySchema>;

export const listarConteudosPublicosPublicoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  categoria: z
    .enum([
      "NOTICIA",
      "AVISO",
      "SERVICO",
      "TRANSPARENCIA",
      "LEGISLACAO",
      "EVENTO",
      "OUTRO",
    ])
    .optional(),

  municipioId: z.string().uuid().optional(),

  pesquisa: z
    .string()
    .trim()
    .max(200)
    .optional(),
});
export type ListarConteudosPublicosPublicoQuery = z.infer<typeof listarConteudosPublicosPublicoQuerySchema>;