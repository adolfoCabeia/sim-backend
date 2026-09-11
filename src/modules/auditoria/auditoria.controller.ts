import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./auditoria.service.js";
import { listarLogsQuerySchema, exportarLogsQuerySchema } from "./auditoria.schema.js";
import type { ListarLogsQuery, ExportarLogsQuery } from "./auditoria.schema.js";

export async function listarLogsController(req: FastifyRequest<{ Querystring: ListarLogsQuery }>, reply: FastifyReply) {
  const query = listarLogsQuerySchema.parse(req.query);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const resultado = await service.listarLogsAuditoria(
    {
      municipioId,
      utilizadorId: query.utilizadorId,
      entidade: query.entidade,
      entidadeId: query.entidadeId,
      accao: query.accao,
      desde: query.desde ? new Date(query.desde) : undefined,
      ate: query.ate ? new Date(query.ate) : undefined,
    },
    { page: Number(query.page), limit: Number(query.limit) }
  );
  return reply.send(resultado);
}

export async function obterLogController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const log = await service.obterLogAuditoria(req.params.id, municipioId);
  if (!log) return reply.status(404).send({ error: "Registo de auditoria não encontrado" });
  return reply.send(log);
}

export async function exportarLogsController(req: FastifyRequest<{ Querystring: ExportarLogsQuery }>, reply: FastifyReply) {
  const query = exportarLogsQuerySchema.parse(req.query);
  const municipioId = (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const linhas = await service.listarLogsParaExportacao({
    municipioId,
    utilizadorId: query.utilizadorId,
    entidade: query.entidade,
    entidadeId: query.entidadeId,
    accao: query.accao,
    desde: query.desde ? new Date(query.desde) : undefined,
    ate: query.ate ? new Date(query.ate) : undefined,
  });

  const csv = service.gerarCsv(linhas);
  const dataFicheiro = new Date().toISOString().slice(0, 10);

  reply
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", `attachment; filename="logs-auditoria-${dataFicheiro}.csv"`)
    .send(csv);
}