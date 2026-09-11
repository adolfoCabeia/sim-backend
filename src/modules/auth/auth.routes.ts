  import type { FastifyInstance } from "fastify";
  import {
    registerController,
    confirmEmailController,
    loginController,
    refreshController,
    logoutController,
    initiateMfaController,
    confirmMfaController,
    forgotPasswordController,
    resetPasswordController,
  } from "./auth.controller.js";
  import {
    registerSchema,
    confirmEmailSchema,
    loginSchema,
    refreshSchema,
    activateMfaSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
  } from "./auth.schema.js";
  import type {
    RegisterInput,
    ConfirmEmailInput,
    LoginInput,
    RefreshInput,
    ActivateMfaInput,
    ForgotPasswordInput,
    ResetPasswordInput,
  } from "./auth.schema.js";
  import {
    registerDocs,
    confirmEmailDocs,
    loginDocs,
    refreshDocs,
    logoutDocs,
    initiateMfaDocs,
    confirmMfaDocs,
    forgotPasswordDocs,
    resetPasswordDocs,
  } from "./auth.docs.js";
  import { validateBody } from "../../utils/validate.js";

  export async function authRoutes(fastify: FastifyInstance) {
    
    fastify.get("/auth/health", async (request, reply) => {
      return { status: "ok" };
    });

    fastify.post<{ Body: RegisterInput }>(
      "/auth/register",
      {
        ...registerDocs,
        preHandler: validateBody(registerSchema),
      },
      registerController
    );

    fastify.post<{ Body: ConfirmEmailInput }>(
      "/auth/confirm-email",
      {
        ...confirmEmailDocs,
        preHandler: validateBody(confirmEmailSchema),
        config: {
          rateLimit: {
            max: 5,
            timeWindow: "15 minutes",
          },
        },
      },
      confirmEmailController
    );

    fastify.post<{ Body: LoginInput }>(
      "/auth/login",
      {
        ...loginDocs,
        preHandler: validateBody(loginSchema),
        config: {
          rateLimit: {
            max: 10,
            timeWindow: "1 minute",
          },
        },
      },
      loginController
    );

    fastify.post<{ Body: RefreshInput }>(
      "/auth/refresh",
      {
        ...refreshDocs,
        preHandler: validateBody(refreshSchema),
      },
      refreshController
    );

    // "adiciona um recovery de senha nos CIDADAO e nos portais" — só contas
    // externas recebem o email (ver requestPasswordReset em auth.service.ts);
    // contas INTERNO são redefinidas pelo Administrador Municipal/RH via
    // POST /utilizadores/:id/redefinir-password.
    fastify.post<{ Body: ForgotPasswordInput }>(
      "/auth/forgot-password",
      {
        ...forgotPasswordDocs,
        preHandler: validateBody(forgotPasswordSchema),
        config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      },
      forgotPasswordController
    );

    fastify.post<{ Body: ResetPasswordInput }>(
      "/auth/reset-password",
      {
        ...resetPasswordDocs,
        preHandler: validateBody(resetPasswordSchema),
        config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      },
      resetPasswordController
    );

    fastify.post<{ Body: RefreshInput }>(
      "/auth/logout",
      {
        ...logoutDocs,
        preHandler: validateBody(refreshSchema),
      },
      logoutController
    );

    fastify.post(
      "/auth/mfa/initiate",
      {
        ...initiateMfaDocs,
        preHandler: [fastify.authenticate],
      },
      initiateMfaController
    );

    fastify.post<{ Body: ActivateMfaInput }>(
      "/auth/mfa/confirm",
      {
        ...confirmMfaDocs,
        preHandler: [fastify.authenticate, validateBody(activateMfaSchema)],
        config: {
          rateLimit: {
            max: 5,
            timeWindow: "15 minutes",
          },
        },
      },
      confirmMfaController
    );
  }