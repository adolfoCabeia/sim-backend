import { z } from "zod";

export const referenciaTipoSchema = z.enum(["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"]);
export const tipoAssinaturaSchema = z.enum(["PARECER_JURIDICO", "DESPACHO", "CONTRATO", "AUTO_FISCALIZACAO"]);

export const assinarDocumentoSchema = z.object({
  referenciaTipo: referenciaTipoSchema,
  referenciaId: z.string().uuid(),
  tipoAssinatura: tipoAssinaturaSchema,
  conteudo: z.string().min(1),
});

export const listarAssinaturasQuerySchema = z.object({
  referenciaTipo: referenciaTipoSchema,
  referenciaId: z.string().uuid(),
});

export type AssinarDocumentoInput = z.infer<typeof assinarDocumentoSchema>;
export type ListarAssinaturasQuery = z.infer<typeof listarAssinaturasQuerySchema>;