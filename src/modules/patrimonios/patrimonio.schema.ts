import { z } from "zod";

export const BemCategoriaEnum = z.enum([
  "MOVEIS",
  "IMOVEL_DOMINIO_PUBLICO",
  "IMOVEL_DOMINIO_PRIVADO",
  "INTANGIVEIS",
  "VEICULO",
]);

export const BemEstadoEnum = z.enum([
  "OPERACIONAL",
  "TRANSFERIDO",
  "ABATIDO",
  "MAU",
  "OBSOLETO",
  "AVARIADO",
]);

export const SituacaoJuridicaEnum = z.enum(["REGULAR", "IRREGULAR", "EM_REGULARIZACAO"]);
export const EstadoOcupacaoEnum = z.enum(["LIVRE", "OCUPADO", "OCUPADO_ILEGALMENTE"]);

export const FachadaDirecaoEnum = z.enum(["NORTE", "SUL", "SUDOESTE", "LESTE"]);

// Campos numéricos usam z.coerce.number() porque o CriarBemForm envia tudo
// via FormData (multipart) — strings, não números — quando categoria é
// IMOVEL_* ou INTANGIVEIS. z.coerce também aceita number vindo de JSON puro
// (editar), por isso não há downside em usar coerce aqui.
export const criarBemSchema = z.object({
  categoria: BemCategoriaEnum,
  designacao: z.string().min(3).max(200),
  localizacao: z.string().min(3).max(300),
  estado: BemEstadoEnum.optional(),
  tempoVidaUtil: z.coerce.number().int().min(1).optional(),
  dataAquisicao: z.string().datetime().optional(),
  direcaoId: z.string().uuid().optional(),

  // Específicos
  marca: z.string().max(100).optional(),
  modelo: z.string().max(100).optional(),
  cor: z.string().max(50).optional(),
  observacao: z.string().max(2000).optional(),

  extensao: z.coerce.number().positive().optional(),
  largura: z.coerce.number().positive().optional(),
  areaImplantada: z.coerce.number().positive().optional(),
  areaConstruida: z.coerce.number().positive().optional(),
  numeroCompartimentos: z.coerce.number().int().positive().optional(),
  areaInstalada: z.coerce.number().positive().optional(),
  piso: z.string().max(50).optional(),

  chassi: z.string().max(100).optional(),
  numeroMatricula: z.string().max(50).optional(),
  numeroLugares: z.coerce.number().int().positive().optional(),
  tipoCombustivel: z.string().max(50).optional(),

  ticketMarca: z.string().max(100).optional(),
  numeroRegistoMarca: z.string().max(100).optional(),
  // logotipoUrl removido daqui: o logótipo chega como ficheiro (multipart),
  // não como URL — a app nunca constrói createBem a partir de uma URL já
  // existente. O controller define logotipoUrl internamente após o upload.
});

export const editarBemSchema = criarBemSchema.partial();

export const transferirBemSchema = z.object({
  direcaoDestinoId: z.string().uuid(),
  observacao: z.string().max(1000).optional(),
});

export const abaterBemSchema = z.object({
  motivo: z.string().min(3).max(1000),
});

// Multipart: a imagem em si não passa pelo Zod (é binário, tratado à parte
// no controller via request.parts()). Isto só valida os campos de texto.
export const adicionarFachadaSchema = z.object({
  direcao: FachadaDirecaoEnum,
  descricao: z.string().max(500).optional(),
});

export const adicionarImagemSchema = z.object({
  legenda: z.string().max(200).optional(),
});

export const criarMovimentoSchema = z.object({
  tipo: z.enum(["AQUISICAO", "TRANSFERENCIA", "ABATIMENTO", "MANUTENCAO"]),
  descricao: z.string().min(3).max(1000),
  direcaoOrigemId: z.string().uuid().optional(),
  direcaoDestinoId: z.string().uuid().optional(),
  valor: z.number().positive().optional(),
  observacao: z.string().max(1000).optional(),
});

export const actualizarRegularizacaoSchema = z.object({
  situacaoJuridica: SituacaoJuridicaEnum,
  estadoOcupacao: EstadoOcupacaoEnum,
  historicoDocumental: z.string().max(5000).optional(),
  alertaIrregularidade: z.boolean().optional(),
  processos: z.array(z.object({
    processoId: z.string().uuid(),
    numero: z.string(),
    descricao: z.string(),
    status: z.string(),
  })).optional(),
});

export const listarBensQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  categoria: BemCategoriaEnum.optional(),
  estado: BemEstadoEnum.optional(),
  direcaoId: z.string().uuid().optional(),
  search: z.string().min(1).optional(),
});

export type CriarBemInput = z.infer<typeof criarBemSchema>;
export type EditarBemInput = z.infer<typeof editarBemSchema>;
export type TransferirBemInput = z.infer<typeof transferirBemSchema>;
export type AbaterBemInput = z.infer<typeof abaterBemSchema>;
export type AdicionarFachadaInput = z.infer<typeof adicionarFachadaSchema>;
export type AdicionarImagemInput = z.infer<typeof adicionarImagemSchema>;
export type CriarMovimentoInput = z.infer<typeof criarMovimentoSchema>;
export type ActualizarRegularizacaoInput = z.infer<typeof actualizarRegularizacaoSchema>;
export type ListarBensQuery = z.infer<typeof listarBensQuerySchema>;