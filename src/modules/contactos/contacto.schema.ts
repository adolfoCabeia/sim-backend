import { z } from "zod";

const TIPOS_CONTACTO = ["INTERNO", "EXTERNO"] as const;

export const criarContactoSchema = z
  .object({
    tipo: z.enum(TIPOS_CONTACTO),
    nome: z.string().min(2).max(200),
    cargo: z.string().max(150).optional(),
    instituicao: z.string().max(200).optional(),
    direcaoSigla: z.string().optional(),
    telefone: z.string().max(50).optional(),
    email: z.string().email().optional(),
    endereco: z.string().max(300).optional(),
    notas: z.string().max(1000).optional(),
    visivelPublico: z.boolean().default(false),
  })
  .refine((data) => data.tipo !== "INTERNO" || !!data.direcaoSigla, {
    message: "Contactos INTERNO devem indicar 'direcaoSigla'.",
    path: ["direcaoSigla"],
  })
  .refine((data) => data.tipo !== "EXTERNO" || !!data.instituicao, {
    message: "Contactos EXTERNO devem indicar 'instituicao'.",
    path: ["instituicao"],
  })
  .refine((data) => !!data.telefone || !!data.email, {
    message: "Indica pelo menos um telefone ou email de contacto.",
    path: ["telefone"],
  });
export type CriarContactoInput = z.infer<typeof criarContactoSchema>;

export const editarContactoSchema = z.object({
  nome: z.string().min(2).max(200).optional(),
  cargo: z.string().max(150).optional(),
  instituicao: z.string().max(200).optional(),
  telefone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  endereco: z.string().max(300).optional(),
  notas: z.string().max(1000).optional(),
  visivelPublico: z.boolean().optional(),
});
export type EditarContactoInput = z.infer<typeof editarContactoSchema>;

export const listarContactosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  tipo: z.enum(TIPOS_CONTACTO).optional(),
  pesquisa: z.string().max(200).optional(),
});
export type ListarContactosQuery = z.infer<typeof listarContactosQuerySchema>;

export const listarContactosPublicoQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  pesquisa: z.string().max(200).optional(),
  municipioId: z.string().min(1).optional(),
});
export type ListarContactosPublicoQuery = z.infer<typeof listarContactosPublicoQuerySchema>;
