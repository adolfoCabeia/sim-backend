import { randomBytes, createHash } from "node:crypto";
import { env } from "../../config/env.js";
import {
  prismaAuthBypass,
  withTenantTransaction,
} from "../../config/prisma.js";
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

/**
 * Cria um refresh token dentro do contexto do município.
 *
 * IMPORTANTE:
 * prismaAuthBypass NÃO ignora RLS.
 * O INSERT precisa ser feito dentro de withTenantTransaction().
 */
export async function issueRefreshToken(params: {
  utilizadorId: string;
  municipioId: string;
  ipOrigem?: string;
  userAgent?: string;
}): Promise<string> {
  const rawToken = randomBytes(40).toString("hex");

  const tokenHash = hashToken(rawToken);

  const expiraEm = new Date(
    Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN)
  );

  await withTenantTransaction(
    params.municipioId,
    async (tx) => {
      await tx.refreshToken.create({
        data: {
          utilizadorId: params.utilizadorId,
          tokenHash,
          expiraEm,
          ...(params.ipOrigem !== undefined && {
            ipOrigem: params.ipOrigem,
          }),
          ...(params.userAgent !== undefined && {
            userAgent: params.userAgent,
          }),
        },
      });
    },
    {
      timeout: 10_000,
      maxWait: 8_000,
    }
  );

  return rawToken;
}

/**
 * Obtém o município do utilizador.
 *
 * A tabela utilizadores atualmente não possui RLS,
 * portanto ela pode ser usada para descobrir o tenant.
 */
async function obterMunicipioDoUtilizador(
  utilizadorId: string
): Promise<string | null> {
  const utilizador = await prismaAuthBypass.utilizador.findUnique({
    where: {
      id: utilizadorId,
    },
    select: {
      municipioId: true,
    },
  });

  return utilizador?.municipioId ?? null;
}

export interface RotateResult {
  novoRefreshToken: string;
  utilizadorId: string;
}

export class RefreshTokenInvalidoError extends Error {
  constructor(message = "Refresh token inválido.") {
    super(message);
    this.name = "RefreshTokenInvalidoError";
  }
}

export class RefreshTokenReutilizadoError extends Error {
  constructor(
    message = "Refresh token já tinha sido usado — todas as sessões foram revogadas por segurança."
  ) {
    super(message);
    this.name = "RefreshTokenReutilizadoError";
  }
}

async function encontrarRefreshTokenPorHash(
  tokenHash: string
) {
  return prismaAuthBypass.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config(
        'app.refresh_token_hash',
        ${tokenHash},
        true
      )
    `;

    return tx.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        utilizadorId: true,
        expiraEm: true,
        revogadoEm: true,
      },
    });
  });
}

export async function rotateRefreshToken(
  rawToken: string,
  params: {
    ipOrigem?: string;
    userAgent?: string;
  }
): Promise<RotateResult> {
  const tokenHash = hashToken(rawToken);

  const existing = await encontrarRefreshTokenPorHash(tokenHash);

  if (!existing) {
    throw new RefreshTokenInvalidoError(
      "Refresh token não encontrado."
    );
  }

  const municipioId = await obterMunicipioDoUtilizador(
    existing.utilizadorId
  );

  if (!municipioId) {
    throw new RefreshTokenInvalidoError(
      "Não foi possível determinar o município do utilizador."
    );
  }

  return withTenantTransaction(
    municipioId,
    async (tx) => {
      const token = await tx.refreshToken.findUnique({
        where: {
          id: existing.id,
        },
        select: {
          id: true,
          utilizadorId: true,
          expiraEm: true,
          revogadoEm: true,
        },
      });

      if (!token) {
        throw new RefreshTokenInvalidoError(
          "Refresh token não encontrado."
        );
      }

      if (token.revogadoEm) {
        await tx.refreshToken.updateMany({
          where: {
            utilizadorId: token.utilizadorId,
            revogadoEm: null,
          },
          data: {
            revogadoEm: new Date(),
          },
        });

        // Reutilização de refresh token é um forte indício de roubo de
        // sessão: além de revogar tudo, marcamos o utilizador como
        // offline, já que nenhuma sessão dele deve continuar válida.
        await tx.utilizador.update({
          where: { id: token.utilizadorId },
          data: { online: false, ultimoLogoutEm: new Date() },
        });

        throw new RefreshTokenReutilizadoError(
          "Refresh token já tinha sido usado — todas as sessões foram revogadas por segurança."
        );
      }

      if (token.expiraEm < new Date()) {
        throw new RefreshTokenInvalidoError(
          "Refresh token expirado."
        );
      }

      await tx.refreshToken.update({
        where: {
          id: token.id,
        },
        data: {
          revogadoEm: new Date(),
        },
      });

      const novoRawToken = randomBytes(40).toString("hex");
      const novoTokenHash = hashToken(novoRawToken);
      const novaExpiracao = new Date(
        Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN)
      );

      await tx.refreshToken.create({
        data: {
          utilizadorId: token.utilizadorId,
          tokenHash: novoTokenHash,
          expiraEm: novaExpiracao,
          ...(params.ipOrigem !== undefined && {
            ipOrigem: params.ipOrigem,
          }),
          ...(params.userAgent !== undefined && {
            userAgent: params.userAgent,
          }),
        },
      });

      return {
        novoRefreshToken: novoRawToken,
        utilizadorId: token.utilizadorId,
      };
    },
    {
      timeout: 10_000,
      maxWait: 8_000,
    }
  );
}

/**
 * Revoga um refresh token específico e marca o utilizador como offline.
 *
 * NOVO: antes só revogava o token; agora, dentro da mesma transacção de
 * tenant, actualiza utilizador.online = false. É este o ponto único onde
 * o logout — de qualquer tipo de conta — marca a presença como offline.
 */
export async function revokeRefreshToken(
  rawToken: string
): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const token = await prismaAuthBypass.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      utilizadorId: true,
    },
  });

  if (!token) {
    return;
  }

  const municipioId = await obterMunicipioDoUtilizador(
    token.utilizadorId
  );

  if (!municipioId) {
    return;
  }

  await withTenantTransaction(
    municipioId,
    async (tx) => {
      const resultado = await tx.refreshToken.updateMany({
        where: {
          id: token.id,
          revogadoEm: null,
        },
        data: {
          revogadoEm: new Date(),
        },
      });

      // Só marca offline se este era de facto um token activo que acabámos
      // de revogar agora — evita repor "offline" por engano em chamadas
      // repetidas de logout com um token já revogado antes.
      if (resultado.count > 0) {
        await tx.utilizador.update({
          where: { id: token.utilizadorId },
          data: { online: false, ultimoLogoutEm: new Date() },
        });
      }
    },
    {
      timeout: 10_000,
      maxWait: 8_000,
    }
  );
}

/**
 * Revoga todas as sessões do utilizador.
 */
export async function revokeAllRefreshTokens(
  utilizadorId: string
): Promise<void> {
  const municipioId =
    await obterMunicipioDoUtilizador(utilizadorId);

  if (!municipioId) {
    return;
  }

  await withTenantTransaction(
    municipioId,
    async (tx) => {
      await tx.refreshToken.updateMany({
        where: {
          utilizadorId,
          revogadoEm: null,
        },
        data: {
          revogadoEm: new Date(),
        },
      });

      await tx.utilizador.update({
        where: { id: utilizadorId },
        data: { online: false, ultimoLogoutEm: new Date() },
      });
    },
    {
      timeout: 10_000,
      maxWait: 8_000,
    }
  );
}