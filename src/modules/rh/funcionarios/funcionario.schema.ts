import { z } from "zod";

/**
 * NOTA: este ficheiro foi reconstruído a partir dos JSON Schemas usados em
 * funcionario.docs.ts (para documentação Swagger), porque o funcionario.schema.ts
 * original não foi partilhado. Se o teu ficheiro real tiver nomes/tipos diferentes,
 * ajusta os campos abaixo — a forma (shape) dos objectos tem de continuar igual,
 * porque o serviço e o controller dependem destes tipos.
 *
 * Mudança relevante: fotografiaUrl, cvUrl e comprovativoUrl deixam de existir como
 * campos de texto (URL) nestes schemas — passam a ser ficheiros enviados via
 * multipart/form-data e tratados directamente no controller.
 */

export const tipoVinculoEnum = z.enum(["QUADRO", "CONTRATO", "ESTAGIARIO"]);
export const estadoFuncionarioEnum = z.enum(["ATIVO", "EM_FERIAS", "SUSPENSO", "OUTRO"]);
// Aceita tanto "YYYY-MM-DD" (o que um <input type="date"> envia) como um
// ISO datetime completo. z.string().datetime() só aceitava o segundo formato,
// o que rejeitava sempre as datas vindas do formulário do frontend.
const dataISO = z.string().refine((valor) => !Number.isNaN(Date.parse(valor)), {
  message: "Data inválida.",
});

export const nivelHabilitacaoEnum = z.enum([
  "ENSINO_PRIMARIO",
  "ENSINO_SECUNDARIO",
  "TECNICO_MEDIO",
  "BACHARELATO",
  "LICENCIATURA",
  "POS_GRADUACAO",
  "MESTRADO",
  "DOUTORAMENTO",
  "CERTIFICACAO_PROFISSIONAL",
  "OUTRO",
]);

export const criarFuncionarioSchema = z
  .object({
    utilizadorId: z.string().uuid(),
    // departamentoId REMOVIDO: já vem de utilizador.departamentoId — não faz
    // sentido duplicar aqui.
    cargo: z.string().min(2).max(120),
    contactoTelefone: z.string().max(30).optional(),
    contactoEmail: z.string().email().optional(),
    tipoVinculo: tipoVinculoEnum,
    dataInicioVinculo: dataISO,
    dataFimVinculo: dataISO.optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .refine((data) => data.tipoVinculo === "QUADRO" || !!data.dataFimVinculo, {
    message: "Vínculos não-permanentes (Contrato/Estagiário) exigem data de fim.",
    path: ["dataFimVinculo"],
  });

export type CriarFuncionarioInput = z.infer<typeof criarFuncionarioSchema>;

export const atualizarFuncionarioSchema = z.object({
  // departamentoId REMOVIDO: idem — vem de utilizador.departamentoId. Para
  // mudar o departamento de alguém, actualiza-se a ficha do Utilizador, não
  // a do Funcionario.
  cargo: z.string().min(2).max(120).optional(),
  contactoTelefone: z.string().max(30).optional(),
  contactoEmail: z.string().email().optional(),
  tipoVinculo: tipoVinculoEnum.optional(),
  dataInicioVinculo: dataISO.optional(),
  dataFimVinculo: dataISO.optional(),
  // "EM_FERIAS" é derivado automaticamente — não pode ser definido manualmente aqui.
  estado: z.enum(["ATIVO", "SUSPENSO", "OUTRO"]).optional(),
  observacoes: z.string().max(1000).optional(),
});

export type AtualizarFuncionarioInput = z.infer<typeof atualizarFuncionarioSchema>;

export const listarFuncionariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  departamentoId: z.string().uuid().optional(),
  tipoVinculo: tipoVinculoEnum.optional(),
  estado: estadoFuncionarioEnum.optional(),
});

export type ListarFuncionariosQuery = z.infer<typeof listarFuncionariosQuerySchema>;

export const adicionarHabilitacaoSchema = z.object({
  nivel: nivelHabilitacaoEnum,
  curso: z.string().min(1).max(200),
  instituicao: z.string().min(1).max(200),
  anoConclusao: z.coerce.number().int().min(1900).max(2100).optional(),
});

export type AdicionarHabilitacaoInput = z.infer<typeof adicionarHabilitacaoSchema>;