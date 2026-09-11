export type TipoOrgao =
  | "ORGAO_APOIO_CONSULTIVO"
  | "SERVICO_APOIO_TECNICO"
  | "SERVICO_APOIO_INSTRUMENTAL"
  | "DIRECCAO_EXECUTIVA_DESCONCENTRADA";

export interface DirecaoTemplate {
  nome: string;
  sigla: string;
  tipo: TipoOrgao;
  areaResponsabilidade:
    | "POLITICA_SOCIAL_COMUNIDADE"
    | "ECONOMICA_FINANCEIRA"
    | "TECNICA_INFRAESTRUTURAS_SERVICOS"
    | null;
  descricao: string;

  permiteIntercambioInterMunicipal?: boolean;
}

const ORGAOS_APOIO_CONSULTIVO: DirecaoTemplate[] = [
  {
    nome: "Conselho Municipal de Auscultação da Comunidade",
    sigla: "CMAC",
    tipo: "ORGAO_APOIO_CONSULTIVO",
    areaResponsabilidade: null,
    descricao:
      "Apoia a Administração Municipal na apreciação e tomada de medidas de natureza política, económica e social (Artigo 11.º).",
  },
  {
    nome: "Conselho Municipal de Concertação Social",
    sigla: "CMCS",
    tipo: "ORGAO_APOIO_CONSULTIVO",
    areaResponsabilidade: null,
    descricao: "Órgão de apoio consultivo do Administrador Municipal em assuntos de âmbito municipal (Artigo 12.º).",
  },
  {
    nome: "Conselho Municipal de Vigilância Comunitária",
    sigla: "CMVC",
    tipo: "ORGAO_APOIO_CONSULTIVO",
    areaResponsabilidade: null,
    descricao: "Apoio consultivo em matéria de segurança pública, protecção civil e ordem pública (Artigo 13.º).",
  },
];

const SERVICOS_APOIO_TECNICO: DirecaoTemplate[] = [
  {
    nome: "Secretaria Geral",
    sigla: "SG",
    tipo: "SERVICO_APOIO_TECNICO",
    areaResponsabilidade: null,
    descricao: "Expediente, Património, Logística/Protocolo, Orçamento e Receitas Municipais (Artigo 14.º).",
  },
  {
    nome: "Gabinete de Estudos, Planeamento e Estatística",
    sigla: "GEPE",
    tipo: "SERVICO_APOIO_TECNICO",
    areaResponsabilidade: null,
    descricao: "Estudos, planeamento, estatística e monitorização do PDM e da execução orçamental (Artigo 15.º).",
  },
  {
    nome: "Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores",
    sigla: "GJ",
    tipo: "SERVICO_APOIO_TECNICO",
    areaResponsabilidade: null,
    descricao:
      "Assessoria jurídica, intercâmbio/geminação institucional e acompanhamento das Comissões de Moradores (Artigo 16.º).",
  },
  {
    nome: "Gabinete de Recursos Humanos",
    sigla: "GRH",
    tipo: "SERVICO_APOIO_TECNICO",
    areaResponsabilidade: null,
    descricao: "Gestão administrativa e técnica do capital humano da Administração Municipal (Artigo 17.º).",
  },
  {
    nome: "Gabinete de Comunicação Social",
    sigla: "GCS",
    tipo: "SERVICO_APOIO_TECNICO",
    areaResponsabilidade: null,
    descricao: "Comunicação institucional, imprensa e portal público de conteúdo (Artigo 18.º).",
  },
];

const SERVICOS_APOIO_INSTRUMENTAL: DirecaoTemplate[] = [
  {
    nome: "Gabinete do Administrador Municipal e dos Administradores Municipais-Adjuntos",
    sigla: "GAM",
    tipo: "SERVICO_APOIO_INSTRUMENTAL",
    areaResponsabilidade: null,
    descricao: "Apoio técnico-administrativo directo ao Administrador e Adjuntos (Artigo 19.º).",
    permiteIntercambioInterMunicipal: true,
  },
  {
    nome: "Comissão Municipal de Protecção Civil",
    sigla: "CMPC",
    tipo: "SERVICO_APOIO_INSTRUMENTAL",
    areaResponsabilidade: null,
    descricao: "Serviço de apoio ao Administrador Municipal em matéria de protecção civil (Artigo 20.º).",
  },
];

const DIRECCOES_EXECUTIVAS: DirecaoTemplate[] = [
  {
    nome: "Educação",
    sigla: "DME",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "POLITICA_SOCIAL_COMUNIDADE",
    descricao: "Direção Municipal da Educação",
  },
  {
    nome: "Saúde",
    sigla: "DMS",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "POLITICA_SOCIAL_COMUNIDADE",
    descricao: "Direção Municipal da Saúde",
  },
  {
    nome: "Desenvolvimento Económico Integrado",
    sigla: "DMDEI",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "ECONOMICA_FINANCEIRA",
    descricao: "Direção Municipal de Promoção do Desenvolvimento Económico Integrado",
  },
  {
    nome: "Ambiente e Saneamento Básico",
    sigla: "DMASB",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "TECNICA_INFRAESTRUTURAS_SERVICOS",
    descricao: "Direção Municipal do Ambiente e Saneamento Básico",
  },
  {
    nome: "Transportes, Tráfego e Mobilidade",
    sigla: "DMTTM",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "TECNICA_INFRAESTRUTURAS_SERVICOS",
    descricao: "Direção Municipal dos Transportes, Tráfego e Mobilidade",
  },
  {
    nome: "Ação Social, Antigos Combatentes e Veteranos da Pátria",
    sigla: "DMASACVP",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "POLITICA_SOCIAL_COMUNIDADE",
    descricao: "Direção Municipal de Ação Social",
  },
  {
    nome: "Turismo e Cultura",
    sigla: "DMTC",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "POLITICA_SOCIAL_COMUNIDADE",
    descricao: "Direção Municipal do Turismo e Cultura",
  },
  {
    nome: "Tempos Livres, Juventude e Desportos",
    sigla: "DMTLJD",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "POLITICA_SOCIAL_COMUNIDADE",
    descricao: "Direção Municipal de Tempos Livres, Juventude e Desportos",
  },
  {
    nome: "Energia e Águas",
    sigla: "DMEA",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "TECNICA_INFRAESTRUTURAS_SERVICOS",
    descricao: "Direção Municipal de Energia e Águas",
  },
  {
    nome: "Infra-Estruturas, Ordenamento do Território e Habitação",
    sigla: "DMIOTH",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "TECNICA_INFRAESTRUTURAS_SERVICOS",
    descricao: "Direção Municipal de Infra-Estruturas, Ordenamento Território e Habitação",
  },
  {
    nome: "Agricultura, Pecuária e Pescas",
    sigla: "DMAPP",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "ECONOMICA_FINANCEIRA",
    descricao: "Direção Municipal de Agricultura, Pecuária e Pescas",
  },
  {
    nome: "Registos e Modernização Administrativa",
    sigla: "DMRMA",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "TECNICA_INFRAESTRUTURAS_SERVICOS",
    descricao: "Direção Municipal dos Registos e Modernização Administrativa",
  },
  {
    nome: "Fiscalização",
    sigla: "DMF",
    tipo: "DIRECCAO_EXECUTIVA_DESCONCENTRADA",
    areaResponsabilidade: "TECNICA_INFRAESTRUTURAS_SERVICOS",
    descricao: "Direção Municipal de Fiscalização",
  },
];


export const DIRECOES_TEMPLATE: DirecaoTemplate[] = [
  ...ORGAOS_APOIO_CONSULTIVO,
  ...SERVICOS_APOIO_TECNICO,
  ...SERVICOS_APOIO_INSTRUMENTAL,
  ...DIRECCOES_EXECUTIVAS,
];

export const DIRECAO_SIGLAS = DIRECOES_TEMPLATE.map((d) => d.sigla) as [string, ...string[]];

export type DirecaoSigla = (typeof DIRECOES_TEMPLATE)[number]["sigla"];

export const DEPARTAMENTOS_POR_DIRECAO: Record<string, string[]> = {
  SG: ["Secção de Orçamento, Finanças e Contratação Pública", "Secção de Património, Logística e Protocolo", "Secção de Expediente"],
  GEPE: ["Secção de Estudo e Estatística", "Secção de Planeamento", "Secção de Monitorização e Controlo"],
  GJ: ["Secção dos Assuntos Jurídicos e Intercâmbio", "Secção de Acompanhamento e Apoio às Comissões de Moradores"],
  GRH: ["Secção de Gestão Administrativa", "Secção de Gestão de Carreiras e Capacitação Técnica"],
  GCS: ["Secção de Comunicação Institucional e Imprensa", "Secção para Documentação e Informação"],

  DME: [
    "Secção de Educação e Ensino",
    "Secção de Planeamento, Estatística e Recursos Humanos",
    "Secção de Inspecção Escolar",
    "Secção de Ciências, Tecnologia e Inovação",
  ],
  DMS: [
    "Secção de Logística Hospitalar e Depósito de Medicamentos",
    "Secção de Estatística, Planeamento e Recursos Humanos",
    "Secção de Saúde Pública",
    "Secção de Inspecção de Saúde",
  ],
  DMDEI: [
    "Secção de Promoção do Desenvolvimento Económico Integrado",
    "Secção de Administração Pública e Trabalho",
    "Secção de Licenciamento das Actividades Económicas e Serviços",
  ],
  DMASB: ["Secção do Ambiente", "Secção do Saneamento Básico"],
  DMTTM: ["Secção de Transportes", "Secção de Tráfego e Mobilidade"],
  DMASACVP: [
    "Secção de Acção Social, Família e Igualdade do Género",
    "Secção de Inspecção",
    "Secção dos Antigos Combatentes e Veteranos da Pátria",
  ],
  DMTC: ["Secção de Turismo", "Secção de Promoção da Cultura"],
  DMTLJD: ["Secção de Tempos Livres", "Secção de Juventude e Desportos"],
  DMEA: ["Secção de Serviços Municipalizados de Energia", "Secção de Serviços Municipalizados das Águas"],
  DMIOTH: ["Secção do Ordenamento do Território", "Secção de Habitação", "Secção de Infra-Estruturas"],
  DMAPP: ["Secção de Agricultura", "Secção de Pecuária e Pescas"],
  DMRMA: [
    "Secção de Registo Eleitoral, Recenseamento Militar e Organização do Território",
    "Secção de Modernização Administrativa e Gestão do Balcão Único de Atendimento ao Público (BUAP)",
  ],
};