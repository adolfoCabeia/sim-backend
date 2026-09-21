import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./frota.service.js";
import {
  frotaCreateSchema,
  frotaUpdateSchema,
  frotaParamsSchema,
  listarFrotaQuerySchema,
  registrarUsoSchema,
  registrarRevisaoSchema,
  registrarAbastecimentoSchema,
} from "./frota.schema.js";
import type {
  FrotaCreateInput,
  FrotaUpdateInput,
  ListarFrotaQuery,
  RegistrarUsoInput,
  RegistrarRevisaoInput,
  RegistrarAbastecimentoInput,
} from "./frota.schema.js";

export async function listarController(
  req: FastifyRequest<{ Querystring: ListarFrotaQuery }>,
  reply: FastifyReply
) {
  const query = listarFrotaQuerySchema.parse(req.query);

  const municipioId = query.municipioId ?? (req as any).user?.municipioId;

  if (!municipioId) {
    return reply.status(400).send({
      success: false,
      error: "Município não identificado",
    });
  }

  const page = Number(query.page);
  const limit = Number(query.limit);

  const result = await service.listar(
    {
      municipioId,
      ...(query.alocacaoActual !== undefined && {
        alocacaoActual: query.alocacaoActual,
      }),
      ...(query.revisaoPendente !== undefined && {
        revisaoPendente: query.revisaoPendente === "true",
      }),
    },
    {
      page,
      limit,
    }
  );

  const totalPages = Math.ceil(result.total / limit);

  return reply.send({
    success: true,
    data: {
      items: result.data,
      total: result.total,
      page,
      limit,
      totalPages,
    },
  });
}

export async function obterController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = frotaParamsSchema.parse(req.params);

  const item = await service.obter(id);

  if (!item) {
    return reply.status(404).send({
      success: false,
      error: "Registro de frota não encontrado",
    });
  }

  return reply.send({
    success: true,
    data: item,
  });
}

export async function criarController(req: FastifyRequest<{ Body: FrotaCreateInput }>, reply: FastifyReply) {
  const dados = frotaCreateSchema.parse(req.body);
  const municipioId = dados.municipioId ?? (req as any).user?.municipioId;
  if (!municipioId) return reply.status(400).send({ error: "municipioId não identificado" });

  const item = await service.criar(municipioId, dados);
  return reply.status(201).send(item);
}

export async function atualizarController(req: FastifyRequest<{ Params: { id: string }; Body: FrotaUpdateInput }>, reply: FastifyReply) {
  const { id } = frotaParamsSchema.parse(req.params);
  const dados = frotaUpdateSchema.parse(req.body);
  const item = await service.atualizar(id, dados);
  return reply.send(item);
}

export async function removerController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = frotaParamsSchema.parse(req.params);
  await service.remover(id);
  return reply.status(204).send();
}

export async function registrarUsoController(req: FastifyRequest<{ Params: { id: string }; Body: RegistrarUsoInput }>, reply: FastifyReply) {
  const { id } = frotaParamsSchema.parse(req.params);
  const dados = registrarUsoSchema.parse(req.body);
  const item = await service.registrarUso(id, dados);
  return reply.send(item);
}

export async function registrarRevisaoController(req: FastifyRequest<{ Params: { id: string }; Body: RegistrarRevisaoInput }>, reply: FastifyReply) {
  const { id } = frotaParamsSchema.parse(req.params);
  const dados = registrarRevisaoSchema.parse(req.body);
  const item = await service.registrarRevisao(id, dados);
  return reply.send(item);
}

export async function registrarAbastecimentoController(req: FastifyRequest<{ Params: { id: string }; Body: RegistrarAbastecimentoInput }>, reply: FastifyReply) {
  const { id } = frotaParamsSchema.parse(req.params);
  const dados = registrarAbastecimentoSchema.parse(req.body);
  const item = await service.registrarAbastecimento(id, dados);
  return reply.send(item);
}

export async function alertasController(req: FastifyRequest, reply: FastifyReply) {
  const municipioId = (req.query as any).municipioId ?? (req as any).user?.municipioId;
  const alertas = await service.listarAlertas(municipioId);
  return reply.send(alertas);
}