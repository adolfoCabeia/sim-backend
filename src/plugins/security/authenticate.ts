import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";

import {
  verificarJanelaDeAcesso,
  MENSAGEM_FORA_DO_HORARIO_DE_ACESSO,
} from "../../modules/rh/ponto/ponto.service.js";

const ROTAS_PERMITIDAS_COM_TROCA_PASSWORD_PENDENTE: Array<{
  method: string;
  path: string;
}> = [
  {
    method: "GET",
    path: "/utilizadores/me",
  },
  {
    method: "POST",
    path: "/utilizadores/me/change-password",
  },
];

export const authenticatePlugin = fp(async (app) => {
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        request.tenant = {
          municipioId: request.user.municipioId,
        };
      } catch (err) {
        request.log.warn(
          {
            err,
            hasAuthHeader: !!request.headers.authorization,
          },
          "jwtVerify falhou"
        );

        return reply.status(401).send({
          error: "invalid_token",
          message: "Token de acesso inválido ou expirado.",
        });
      }

      const caminhoActual = request.url.split("?")[0] ?? "";

      if (request.user.deveTrocarPassword) {
        const permitido =
          ROTAS_PERMITIDAS_COM_TROCA_PASSWORD_PENDENTE.some(
            (rota) =>
              rota.method === request.method &&
              rota.path === caminhoActual
          );

        if (!permitido) {
          return reply.status(403).send({
            error: "troca_password_obrigatoria",
            message:
              "A sua password foi redefinida e precisa de ser alterada antes de continuar. " +
              "Use POST /utilizadores/me/change-password.",
          });
        }
      }

      const isRotaDePonto = caminhoActual.startsWith("/rh/ponto");

      const { permitido: dentroDaJanelaDeAcesso } =
        await verificarJanelaDeAcesso({
          tipoConta: request.user.tipoConta,
          utilizadorId: request.user.sub,
          municipioId: request.user.municipioId,
          isRotaDePonto,
        });

      if (!dentroDaJanelaDeAcesso) {
        return reply.status(403).send({
          error: "fora_do_horario_de_acesso",
          message: MENSAGEM_FORA_DO_HORARIO_DE_ACESSO,
        });
      }
    }
  );
});