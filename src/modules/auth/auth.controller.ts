import type { FastifyRequest, FastifyReply } from "fastify";
import {
  registerUser,
  loginUser,
  confirmEmail,
  initiateMfaSetup,
  confirmMfaSetup,
  requestPasswordReset,
  resetPassword,
  CredenciaisInvalidasError,
  ContaBloqueadaError,
  ContaNaoActivaError,
  EmailNaoConfirmadoError,
  MfaObrigatorioError,
  MfaTokenInvalidoError,
  EmailJaExisteError,
  DocumentoJaExisteError,
  TokenConfirmacaoInvalidoError,
  TokenRedefinicaoInvalidoError,
  DirecaoNaoEncontradaError,
  RegistoInternoNaoPermitidoError,
  ForaDoHorarioDeAcessoError
} from "./auth.service.js";
import {
  rotateRefreshToken,
  revokeRefreshToken,
  RefreshTokenInvalidoError,
  RefreshTokenReutilizadoError,
} from "./jwt.service.js";
import { prismaAuthBypass } from "../../config/prisma.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  ConfirmEmailInput,
  ActivateMfaInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.schema.js";
import { env } from "../../config/env.js";
import { isRateLimited } from "../../utils/rate-limit-key.js";

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
  domain: env.COOKIE_DOMAIN,
} as const;

export async function registerController(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) {
  try {
    const utilizador = await registerUser(request.body);

    await prismaAuthBypass.logAuditoria.create({
      data: {
        municipioId: request.body.municipioId,
        utilizadorId: utilizador.id,
        accao: "REGISTO_CONTA",
        entidade: "Utilizador",
        entidadeId: utilizador.id,
        ipOrigem: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: utilizador.id,
        email: utilizador.email,
        estado: utilizador.estado,
        emailConfirmado: utilizador.emailConfirmado,
        tipoConta: utilizador.tipoConta,
      },
    });
  } catch (error) {
    if (error instanceof EmailJaExisteError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    if (error instanceof DocumentoJaExisteError) {
      return reply.status(409).send({ success: false, message: error.message });
    }
    if (error instanceof DirecaoNaoEncontradaError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    if (error instanceof RegistoInternoNaoPermitidoError) {
      return reply.status(403).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro inesperado no registo de utilizador");
    return reply.status(500).send({ success: false, message: "Erro interno ao criar conta." });
  }
}

export async function confirmEmailController(
  request: FastifyRequest<{ Body: ConfirmEmailInput }>,
  reply: FastifyReply
) {
  try {
    await confirmEmail(request.body.token);

    await prismaAuthBypass.logAuditoria.create({
      data: {
        accao: "EMAIL_CONFIRMADO",
        entidade: "Utilizador",
        ipOrigem: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
        municipioId: "unknown",
      },
    });

    return reply.send({ success: true, message: "Email confirmado com sucesso." });
  } catch (error) {
    if (error instanceof TokenConfirmacaoInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro inesperado ao confirmar email");
    return reply
      .status(500)
      .send({ success: false, message: "Erro interno ao confirmar email." });
  }
}

export async function loginController(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  try {
    const { utilizador, refreshToken } = await loginUser(request.body, {
      ipOrigem: request.ip,
      ...(request.headers["user-agent"] !== undefined && {
        userAgent: request.headers["user-agent"],
      }),
    });

    const accessToken = await reply.jwtSign({
      sub: utilizador.id,
      municipioId: utilizador.municipioId,
      tipoConta: utilizador.tipoConta,
      deveTrocarPassword: utilizador.deveTrocarPassword,
    });

    reply.setCookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    await prismaAuthBypass.logAuditoria.create({
      data: {
        municipioId: utilizador.municipioId,
        utilizadorId: utilizador.id,
        accao: "LOGIN_SUCESSO",
        entidade: "Utilizador",
        entidadeId: utilizador.id,
        ipOrigem: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
      },
    });

    return reply.send({
      success: true,
      data: {
        utilizador,
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof CredenciaisInvalidasError) {
      return reply.status(401).send({ success: false, message: error.message });
    }
    if (error instanceof ContaBloqueadaError) {
      return reply.status(423).send({ success: false, message: error.message });
    }
    if (error instanceof ForaDoHorarioDeAcessoError) {
      return reply.status(403).send({
        error: "fora_do_horario_de_acesso",
        message: error.message,
      });
    }
    if (error instanceof EmailNaoConfirmadoError) {
      return reply
        .status(403)
        .send({ success: false, message: error.message, code: "EMAIL_NAO_CONFIRMADO" });
    }
    if (error instanceof ContaNaoActivaError) {
      return reply
        .status(403)
        .send({ success: false, message: error.message, code: "CONTA_NAO_ACTIVA" });
    }
    if (error instanceof MfaObrigatorioError) {
      return reply
        .status(401)
        .send({ success: false, message: error.message, code: "MFA_OBRIGATORIO" });
    }
    if (error instanceof MfaTokenInvalidoError) {
      return reply
        .status(401)
        .send({ success: false, message: error.message, code: "MFA_INVALIDO" });
    }
    request.log.error({ err: error }, "Erro inesperado no login");
    return reply
      .status(500)
      .send({ success: false, message: "Erro interno ao iniciar sessão." });
  }
}

export async function refreshController(
  request: FastifyRequest<{ Body: RefreshInput }>,
  reply: FastifyReply
) {
  try {
    const refreshToken =
      request.cookies.refreshToken || request.body.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({
        success: false,
        message: "Refresh token não encontrado.",
      });
    }

    const { novoRefreshToken, utilizadorId } =
      await rotateRefreshToken(refreshToken, {
        ipOrigem: request.ip,
        ...(request.headers["user-agent"] !== undefined && {
          userAgent: request.headers["user-agent"],
        }),
      });

    const utilizador =
      await prismaAuthBypass.utilizador.findUniqueOrThrow({
        where: { id: utilizadorId },
        select: {
          municipioId: true,
          tipoConta: true,
          deveTrocarPassword: true,
        },
      });

    const accessToken = await reply.jwtSign({
      sub: utilizadorId,
      municipioId: utilizador.municipioId,
      tipoConta: utilizador.tipoConta,
      deveTrocarPassword: utilizador.deveTrocarPassword,
    });

    reply.setCookie(
      "refreshToken",
      novoRefreshToken,
      REFRESH_TOKEN_COOKIE_OPTIONS
    );

    return reply.send({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    if (error instanceof RefreshTokenReutilizadoError) {
      reply.clearCookie("refreshToken");

      return reply.status(401).send({
        success: false,
        message: error.message,
        code: "TOKEN_REUTILIZADO",
      });
    }

    if (error instanceof RefreshTokenInvalidoError) {
      return reply.status(401).send({
        success: false,
        message: error.message,
      });
    }

    request.log.error(
      { error },
      "Erro inesperado ao renovar sessão"
    );

    return reply.status(500).send({
      success: false,
      message: "Erro interno ao renovar sessão.",
    });
  }
}

export async function logoutController(
  request: FastifyRequest<{ Body: RefreshInput }>,
  reply: FastifyReply
) {
  try {
    const refreshToken = request.cookies.refreshToken || request.body.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    reply.clearCookie("refreshToken");

    await prismaAuthBypass.logAuditoria.create({
      data: {
        accao: "LOGOUT",
        entidade: "Utilizador",
        ipOrigem: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
        municipioId: "unknown",
      },
    });

    return reply.send({ success: true, message: "Sessão terminada." });
  } catch (error) {
    request.log.error({ error }, "Erro ao fazer logout");
    return reply
      .status(500)
      .send({ success: false, message: "Erro ao terminar sessão." });
  }
}

export async function initiateMfaController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const utilizadorId = request.user.sub;
    const municipioId = request.user.municipioId;
    const { qrCodeDataUrl, secret } = await initiateMfaSetup({ utilizadorId, municipioId });

    await prismaAuthBypass.logAuditoria.create({
      data: {
        utilizadorId,
        accao: "MFA_INICIADO",
        entidade: "Utilizador",
        entidadeId: utilizadorId,
        ipOrigem: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
        municipioId,
      },
    });

    return reply.send({ success: true, data: { qrCodeDataUrl, secret } });
  } catch (error) {
    request.log.error({ error }, "Erro ao iniciar configuração de MFA");
    return reply
      .status(500)
      .send({ success: false, message: "Erro interno ao configurar MFA." });
  }
}

export async function confirmMfaController(
  request: FastifyRequest<{ Body: ActivateMfaInput }>,
  reply: FastifyReply
) {
  try {
    const utilizadorId = request.user.sub;
    const municipioId = request.user.municipioId;
    await confirmMfaSetup({ utilizadorId, municipioId, token: request.body.token });

    reply.clearCookie("refreshToken");

    await prismaAuthBypass.logAuditoria.create({
      data: {
        utilizadorId,
        accao: "MFA_CONFIRMADO",
        entidade: "Utilizador",
        entidadeId: utilizadorId,
        ipOrigem: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
        municipioId,
      },
    });

    return reply.send({
      success: true,
      message: "MFA activado com sucesso. Por favor, faça login novamente."
    });
  } catch (error) {
    if (error instanceof MfaTokenInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro ao confirmar MFA");
    return reply.status(500).send({ success: false, message: "Erro interno ao confirmar MFA." });
  }
}

const FORGOT_PASSWORD_MENSAGEM_GENERICA =
  "Se existir uma conta elegível com este email, foi enviado um link de recuperação de password.";
// Tempo mínimo de resposta, para que o tempo do pedido não deixe perceber
// se a conta existe/é elegível (canal lateral de temporização) — ver nota
// em requestPasswordReset (auth.service.ts).
const FORGOT_PASSWORD_TEMPO_MINIMO_MS = 400;
const FORGOT_PASSWORD_MAX_POR_EMAIL = 3;
const FORGOT_PASSWORD_JANELA_MS = 15 * 60 * 1000;

export async function forgotPasswordController(
  request: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply
) {
  const inicio = Date.now();
  const email = request.body.email.trim().toLowerCase();

  try {
    // Rate limit adicional por email (o rate limit da rota já limita por IP;
    // isto evita que alguém a rodar de IP consiga martelar o mesmo email).
    if (!isRateLimited(`forgot-password:${email}`, FORGOT_PASSWORD_MAX_POR_EMAIL, FORGOT_PASSWORD_JANELA_MS)) {
      await requestPasswordReset(email);
    }
    // O resultado (conta existe? é elegível? já está limitada?) nunca é
    // exposto ao cliente — resposta sempre igual, em forma e em estado
    // HTTP, para não permitir enumeração de contas/tipos de conta.
  } catch (error) {
    request.log.error({ error }, "Erro ao processar pedido de recuperação de password");
    // Mesmo em erro interno, não diferenciamos a resposta.
  }

  const decorrido = Date.now() - inicio;
  if (decorrido < FORGOT_PASSWORD_TEMPO_MINIMO_MS) {
    await new Promise((resolve) => setTimeout(resolve, FORGOT_PASSWORD_TEMPO_MINIMO_MS - decorrido));
  }

  return reply.send({
    success: true,
    message: FORGOT_PASSWORD_MENSAGEM_GENERICA,
  });
}

export async function resetPasswordController(
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply
) {
  try {
    await resetPassword(request.body.token, request.body.novaPassword);
    return reply.send({
      success: true,
      message: "Password redefinida com sucesso. Inicie sessão com a nova password.",
    });
  } catch (error) {
    if (error instanceof TokenRedefinicaoInvalidoError) {
      return reply.status(400).send({ success: false, message: error.message });
    }
    request.log.error({ error }, "Erro inesperado ao redefinir password");
    return reply.status(500).send({ success: false, message: "Erro interno ao redefinir password." });
  }
}