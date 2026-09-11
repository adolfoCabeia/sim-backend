import type { FastifyRequest, FastifyReply } from "fastify";
import type { ZodType } from "zod";
import { ZodError } from "zod";

export function validateBody(schema: ZodType) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const primeiroErro = (result.error as ZodError).issues[0];
      return reply.status(400).send({
        success: false,
        message: primeiroErro?.message ?? "Dados inválidos.",
        errors: (result.error as ZodError).issues.map((issue) => ({
          campo: issue.path.join("."),
          mensagem: issue.message,
        })),
      });
    }

    request.body = result.data;
  };
}