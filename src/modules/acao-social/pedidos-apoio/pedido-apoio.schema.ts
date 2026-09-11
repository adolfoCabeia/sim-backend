import { z } from "zod";
import { TIPOS_PEDIDO_APOIO, ESTADOS_PEDIDO_APOIO } from "../acao-social.constants.js";

export const criarPedidoApoioSchema = z.object({
  beneficiarioId: z.string().uuid(),
  tipo: z.enum(TIPOS_PEDIDO_APOIO),
  valorAprovado: z.coerce.number().positive().optional(), // preenchido normalmente só na resolução
  observacoes: z.string().trim().max(1000).optional(),
});
export type CriarPedidoApoioInput = z.infer<typeof criarPedidoApoioSchema>;

export const resolverPedidoApoioSchema = z
  .object({
    estado: z.enum(["DEFERIDO", "INDEFERIDO"]),
    valorAprovado: z.coerce.number().positive().optional(),
    motivoIndeferimento: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.estado !== "INDEFERIDO" || Boolean(data.motivoIndeferimento), {
    message: "Indique o motivo do indeferimento.",
    path: ["motivoIndeferimento"],
  });
export type ResolverPedidoApoioInput = z.infer<typeof resolverPedidoApoioSchema>;

export const listarPedidosApoioQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  tipo: z.enum(TIPOS_PEDIDO_APOIO).optional(),
  estado: z.enum(ESTADOS_PEDIDO_APOIO).optional(),
  beneficiarioId: z.string().uuid().optional(),
});
export type ListarPedidosApoioQuery = z.infer<typeof listarPedidosApoioQuerySchema>;
