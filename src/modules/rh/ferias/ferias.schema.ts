import { z } from "zod";
import { ESTADOS_PEDIDO_FERIAS } from "../rh.constants.js";

export const criarPedidoFeriasSchema = z
  .object({
    dataInicio: z.string().datetime(),
    dataFim: z.string().datetime(),
    motivo: z.string().trim().max(500).optional(),
  })
  .refine((data) => new Date(data.dataFim) >= new Date(data.dataInicio), {
    message: "A data de fim não pode ser anterior à data de início.",
    path: ["dataFim"],
  });
export type CriarPedidoFeriasInput = z.infer<typeof criarPedidoFeriasSchema>;

export const responderPedidoFeriasSchema = z
  .object({
    aprovar: z.boolean(),
    motivoRejeicao: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.aprovar || Boolean(data.motivoRejeicao), {
    message: "Indique o motivo da rejeição.",
    path: ["motivoRejeicao"],
  });
export type ResponderPedidoFeriasInput = z.infer<typeof responderPedidoFeriasSchema>;

export const listarPedidosFeriasQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  estado: z.enum(ESTADOS_PEDIDO_FERIAS).optional(),
  funcionarioId: z.string().uuid().optional(),
  departamentoId: z.string().uuid().optional(),
});
export type ListarPedidosFeriasQuery = z.infer<typeof listarPedidosFeriasQuerySchema>;
