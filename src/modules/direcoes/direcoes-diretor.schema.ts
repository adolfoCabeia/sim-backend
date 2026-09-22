import { z } from "zod";

/** `utilizadorId: null` remove o director da direcção. */
export const definirDirectorSchema = z.object({
  utilizadorId: z.string().uuid("Indica um utilizador válido.").nullable(),
});
export type DefinirDirectorInput = z.infer<typeof definirDirectorSchema>;