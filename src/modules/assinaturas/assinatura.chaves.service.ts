import { withTenantTransaction } from "../../config/prisma.js";
import { gerarParChaves, cifrarChavePrivada } from "./assinatura.crypto.js";

/** Devolve a chave activa do utilizador; gera uma nova (auto-provisionamento) se não existir nenhuma. */
export async function obterOuCriarChaveActiva(municipioId: string, utilizadorId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    const activa = await tx.chaveAssinaturaUtilizador.findFirst({
      where: { utilizadorId, revogadoEm: null },
      orderBy: { criadoEm: "desc" },
    });
    if (activa) return activa;

    const { chavePublicaDer, chavePrivadaDer } = gerarParChaves();
    const { cifrado, iv, authTag } = cifrarChavePrivada(chavePrivadaDer);

    return tx.chaveAssinaturaUtilizador.create({
      data: {
        utilizadorId,
        chavePublica: chavePublicaDer.toString("base64"),
        chavePrivadaCifrada: cifrado,
        iv,
        authTag,
      },
    });
  });
}

/** Uso administrativo — revoga a chave activa e gera uma nova. Assinaturas
 * antigas continuam válidas (verificadas com a chave vigente na altura). */
export async function rotacionarChave(municipioId: string, utilizadorId: string) {
  return withTenantTransaction(municipioId, async (tx) => {
    await tx.chaveAssinaturaUtilizador.updateMany({
      where: { utilizadorId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });

    const { chavePublicaDer, chavePrivadaDer } = gerarParChaves();
    const { cifrado, iv, authTag } = cifrarChavePrivada(chavePrivadaDer);

    return tx.chaveAssinaturaUtilizador.create({
      data: {
        utilizadorId,
        chavePublica: chavePublicaDer.toString("base64"),
        chavePrivadaCifrada: cifrado,
        iv,
        authTag,
      },
    });
  });
}

/** Chave pública activa no exacto momento da assinatura — necessária para
 * verificar correctamente assinaturas antigas depois de uma rotação. */
export async function obterChaveVigenteEm(municipioId: string, utilizadorId: string, instante: Date) {
  return withTenantTransaction(municipioId, (tx) =>
    tx.chaveAssinaturaUtilizador.findFirst({
      where: {
        utilizadorId,
        criadoEm: { lte: instante },
        OR: [{ revogadoEm: null }, { revogadoEm: { gte: instante } }],
      },
      orderBy: { criadoEm: "desc" },
    })
  );
}