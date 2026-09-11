import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import type { AccessTokenPayload } from "../../modules/auth/jwt.service.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

export const jwtPlugin = fp(async function (fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  });
});