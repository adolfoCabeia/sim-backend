import { z } from "zod";

export const submeterDocumentoSchema = z.object({
  documentoTipo: z.enum(["Bilhete de Identidade", "Documento Fiscal"]),
  documentoNumero: z.string().min(3).max(50),
  perfilSolicitadoId: z.string().uuid().optional(),
});
export type SubmeterDocumentoInput = z.infer<typeof submeterDocumentoSchema>;

export const aprovarPedidoSchema = z.object({
  comentario: z.string().max(500).optional(),
});
export type AprovarPedidoInput = z.infer<typeof aprovarPedidoSchema>;

export const rejeitarPedidoSchema = z.object({
  motivoRejeicao: z.string().min(10).max(500),
});
export type RejeitarPedidoInput = z.infer<typeof rejeitarPedidoSchema>;