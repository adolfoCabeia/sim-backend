import type { FastifyRequest, FastifyReply } from "fastify";
import { obterIndicadoresGerais } from "./indicadores.service.js";

export async function obterIndicadoresController(request: FastifyRequest, reply: FastifyReply) {
  const indicadores = await obterIndicadoresGerais({ municipioId: request.user.municipioId });
  return reply.send({ success: true, data: indicadores });
}
