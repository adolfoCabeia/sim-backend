import type { FastifyRequest, FastifyReply } from "fastify";
import { hasPermission } from "../modules/auth/rbac/rbac.service.js";

export function requirePermission(permissaoChave: string) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const utilizadorId = request.user?.sub;
        const municipioId = request.user?.municipioId;

        if (!utilizadorId || !municipioId) {
            return reply.status(401).send({ success: false, message: "Não autenticado." });
        }

        const permitido = await hasPermission(utilizadorId, municipioId, permissaoChave);

        if (!permitido) {
            return reply.status(403).send({
                success: false,
                message: "Não tem permissão para executar esta acção.",
                code: "PERMISSAO_INSUFICIENTE",
            });
        }
    };
}

export function requireAnyPermission(...permissoesChave: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const utilizadorId = request.user?.sub;
        const municipioId = request.user?.municipioId;

        if (!utilizadorId || !municipioId) {
            return reply.status(401).send({ success: false, message: "Não autenticado." });
        }

        for (const chave of permissoesChave) {
            if (await hasPermission(utilizadorId, municipioId, chave)) {
                return;
            }
        }

        return reply.status(403).send({
            success: false,
            message: "Não tem permissão para executar esta acção.",
            code: "PERMISSAO_INSUFICIENTE",
        });
    };
}