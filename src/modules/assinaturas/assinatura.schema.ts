import { z } from "zod";

export const referenciaTipoEnum = z.enum(["PROCESSO_GENERICO", "DOCUMENTO", "FISCALIZACAO_DETALHE"]);
export const tipoAssinaturaEnum = z.enum(["PARECER_JURIDICO", "DESPACHO", "CONTRATO", "AUTO_FISCALIZACAO"]);

export const assinarDocumentoSchema = z.object({
  referenciaTipo: referenciaTipoEnum,
  referenciaId: z.string().uuid(),
  tipoAssinatura: tipoAssinaturaEnum,
  // "conteudo" removido de propósito: o serviço resolve o conteúdo actual
  // a partir da fonte de verdade (assinatura.content-resolver.ts) — nunca
  // confia no que o chamador envia. É essa mudança que torna a verificação
  // pública segura contra réplica de conteúdo.
});
export type AssinarDocumentoInput = z.infer<typeof assinarDocumentoSchema>;

export const listarAssinaturasQuerySchema = z.object({
  referenciaTipo: referenciaTipoEnum,
  referenciaId: z.string().uuid(),
});
export type ListarAssinaturasQuery = z.infer<typeof listarAssinaturasQuerySchema>;