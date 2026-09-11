import { z } from "zod";

export const criarMunicipioSchema = z.object({
  nome: z.string().min(3).max(100),
  // Código nacional normalizado (secção 17.2 — lista dos 300+ municípios
  // de Angola), usado como identificador estável no Intercâmbio
  // Inter-Municipal. Sugestão de formato: "AO-<PROVINCIA>-<MUNICIPIO>".
  codigo: z.string().min(3).max(30),
  provincia: z.string().min(2).max(100).optional(),
});
export type CriarMunicipioInput = z.infer<typeof criarMunicipioSchema>;