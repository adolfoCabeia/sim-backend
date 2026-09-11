import { randomBytes, createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { prismaAuthBypass } from "../../config/prisma.js";
import { parseExpiryToMs } from "../../utils/time.js";

export interface AccessTokenPayload {
  sub: string;
  municipioId: string;
  tipoConta: string;
  deveTrocarPassword: boolean;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(params: {
  utilizadorId: string;
  ipOrigem?: string;
  userAgent?: string;
}): Promise<string> {
  const rawToken = randomBytes(40).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiraEm = new Date(Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN));

  await prismaAuthBypass.refreshToken.create({
    data: {
      utilizadorId: params.utilizadorId,
      tokenHash,
      expiraEm,
      ...(params.ipOrigem !== undefined && { ipOrigem: params.ipOrigem }),
      ...(params.userAgent !== undefined && { userAgent: params.userAgent }),
    },
  });

  return rawToken;
}

export interface RotateResult {
  novoRefreshToken: string;
  utilizadorId: string;
}

export class RefreshTokenInvalidoError extends Error {}
export class RefreshTokenReutilizadoError extends Error {}

export async function rotateRefreshToken(
  rawToken: string,
  params: { ipOrigem?: string; userAgent?: string }
): Promise<RotateResult> {
  const tokenHash = hashToken(rawToken);

  const existing = await prismaAuthBypass.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!existing) {
    throw new RefreshTokenInvalidoError("Refresh token não encontrado.");
  }

  if (existing.revogadoEm) {
    await prismaAuthBypass.refreshToken.updateMany({
      where: { utilizadorId: existing.utilizadorId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
    throw new RefreshTokenReutilizadoError(
      "Refresh token já tinha sido usado — todas as sessões foram revogadas por segurança."
    );
  }

  if (existing.expiraEm < new Date()) {
    throw new RefreshTokenInvalidoError("Refresh token expirado.");
  }

  // Rotação: revoga o actual, emite um novo
  await prismaAuthBypass.refreshToken.update({
    where: { id: existing.id },
    data: { revogadoEm: new Date() },
  });

  const novoRefreshToken = await issueRefreshToken({
    utilizadorId: existing.utilizadorId,
    ...(params.ipOrigem !== undefined && { ipOrigem: params.ipOrigem }),
    ...(params.userAgent !== undefined && { userAgent: params.userAgent }),
  });

  return { novoRefreshToken, utilizadorId: existing.utilizadorId };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prismaAuthBypass.refreshToken.updateMany({
    where: { tokenHash, revogadoEm: null },
    data: { revogadoEm: new Date() },
  });
}

export async function revokeAllRefreshTokens(utilizadorId: string): Promise<void> {
  await prismaAuthBypass.refreshToken.updateMany({
    where: { utilizadorId, revogadoEm: null },
    data: { revogadoEm: new Date() },
  });
}