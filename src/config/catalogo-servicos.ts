import type { TipoProcessoGenerico, OrigemProcessoGenerico } from "../generated/prisma/client.js";


export interface DocumentoExigido {
  codigo: string;
  nome: string;
  obrigatorio: boolean;
}

export interface ServicoMunicipal {
  codigo: string;
  nome: string;
  descricao: string;
  tipoProcesso: TipoProcessoGenerico;
  direcaoResponsavelSigla: string;

  origensPermitidas: OrigemProcessoGenerico[];
  documentosExigidos: DocumentoExigido[];
  pago: boolean;
  valorReferenciaKz?: number;
  fonte: string;
}

export const CATALOGO_SERVICOS_MUNICIPAIS: ServicoMunicipal[] = [
  {
    codigo: "ATESTADO_RESIDENCIA",
    nome: "Atestado de Residência / Cartão de Munícipe",
    descricao:
      "Documento que comprova a residência do cidadão no município. Desde o Decreto Presidencial 217/19, " +
      "o Cartão de Munícipe tende a substituir a emissão repetida do Atestado — mas continua a ser um serviço " +
      "pedido presencialmente na Administração Municipal.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "SG",
    origensPermitidas: ["CIDADAO"],
    documentosExigidos: [{ codigo: "BI_COPIA", nome: "Cópia do Bilhete de Identidade (ou Passaporte, se estrangeiro)", obrigatorio: true }],
    pago: true,
    valorReferenciaKz: 880,
    fonte: "camama.co.ao/servico.php?id=6 · Decreto Presidencial 217/19",
  },
  {
    codigo: "LICENCIAMENTO_OBRAS_PARTICULARES",
    nome: "Licenciamento de Obras de Construção ou Restauração (particulares)",
    descricao: "Licença para construir ou restaurar um imóvel, para pessoas singulares (não empresas de construção).",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMIOTH",
    origensPermitidas: ["CIDADAO"],
    documentosExigidos: [
      { codigo: "BI_COPIA", nome: "Cópia do Bilhete de Identidade do requerente", obrigatorio: true },
      {
        codigo: "TITULO_PROPRIEDADE_OU_ARRENDAMENTO",
        nome: "Título de propriedade do terreno ou contrato de arrendamento reconhecido",
        obrigatorio: true,
      },
      { codigo: "CROQUIS_LOCALIZACAO", nome: "Croquis/planta de localização do imóvel", obrigatorio: true },
      { codigo: "COMPROVATIVO_PAGAMENTO", nome: "Comprovativo de pagamento da taxa de licenciamento", obrigatorio: false },
    ],
    pago: true,
    fonte: "sepe.gov.ao — Pedido de Licenciamento de obras para Cidadãos singulares · simplifica.gov.ao/26-medidas",
  },
  {
    codigo: "CARTAO_SANITARIO",
    nome: "Cartão Sanitário Individual",
    descricao: "Emissão do cartão sanitário exigido a manipuladores de alimentos e a quem exerce actividade em contacto com o público.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "DMS",
    origensPermitidas: ["CIDADAO"],
    documentosExigidos: [
      { codigo: "BI_COPIA", nome: "Cópia do Bilhete de Identidade do requerente", obrigatorio: true },
      { codigo: "EXAME_MEDICO", nome: "Boletim de exame médico/analítico actualizado", obrigatorio: true },
    ],
    pago: true,
    valorReferenciaKz: 1200,
    fonte: "Direcção Municipal de Saúde — actos de saúde pública municipal",
  },
  {
    codigo: "INSCRICAO_PROGRAMA_ACCAO_SOCIAL",
    nome: "Inscrição em Programa de Acção Social",
    descricao: "Candidatura a apoios sociais municipais (subsídios, cestas básicas, apoio a idosos/antigos combatentes).",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "DMASACVP",
    origensPermitidas: ["CIDADAO"],
    documentosExigidos: [
      { codigo: "BI_COPIA", nome: "Cópia do Bilhete de Identidade do requerente", obrigatorio: true },
      { codigo: "DECLARACAO_CARENCIA", nome: "Declaração comprovativa de carência económica (bairro/comissão de moradores)", obrigatorio: false },
    ],
    pago: false,
    fonte: "Direcção Municipal de Ação Social, Antigos Combatentes e Veteranos da Pátria",
  },
  {
    codigo: "CERTIDAO_REGISTO_PREDIAL_MUNICIPAL",
    nome: "Certidão de Registo Predial Municipal",
    descricao: "Certidão sobre a situação registral de um imóvel junto dos serviços municipais de registo.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "DMRMA",
    origensPermitidas: ["CIDADAO", "EMPRESA"],
    documentosExigidos: [
      { codigo: "BI_COPIA", nome: "Cópia do Bilhete de Identidade do requerente", obrigatorio: true },
      { codigo: "TITULO_PROPRIEDADE_OU_ARRENDAMENTO", nome: "Título de propriedade ou referência do imóvel", obrigatorio: true },
    ],
    pago: true,
    valorReferenciaKz: 1500,
    fonte: "Direcção Municipal dos Registos e Modernização Administrativa",
  },
  {
    codigo: "LICENCA_EXPLORACAO_AGRICOLA",
    nome: "Licença de Exploração Agro-Pecuária de Pequena Escala",
    descricao: "Autorização para exploração agrícola, pecuária ou de pesca artesanal em terreno municipal ou comunitário.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMAPP",
    origensPermitidas: ["CIDADAO", "EMPRESA"],
    documentosExigidos: [
      { codigo: "BI_OU_CERTIDAO_COMERCIAL", nome: "BI (singular) ou Certidão Comercial (empresa)", obrigatorio: true },
      { codigo: "TITULO_PROPRIEDADE_OU_ARRENDAMENTO", nome: "Título de propriedade ou cessão de uso do terreno", obrigatorio: true },
    ],
    pago: true,
    fonte: "Direcção Municipal de Agricultura, Pecuária e Pescas",
  },
  {
    codigo: "LICENCA_EVENTO_CULTURAL",
    nome: "Licença para Realização de Evento Cultural ou Recreativo",
    descricao: "Autorização para realização de eventos culturais, festivais ou espectáculos em espaço público ou privado de uso colectivo.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMTC",
    origensPermitidas: ["CIDADAO", "EMPRESA"],
    documentosExigidos: [
      { codigo: "BI_OU_CERTIDAO_COMERCIAL", nome: "BI (singular) ou Certidão Comercial (empresa/colectividade)", obrigatorio: true },
      { codigo: "PLANO_EVENTO", nome: "Plano do evento (data, local, horário, público estimado)", obrigatorio: true },
      { codigo: "COMPROVATIVO_PAGAMENTO", nome: "Comprovativo de pagamento da taxa de ocupação", obrigatorio: false },
    ],
    pago: true,
    fonte: "Direcção Municipal do Turismo e Cultura",
  },
  {
    codigo: "LICENCA_OCUPACAO_VIA_PUBLICA",
    nome: "Licença de Ocupação da Via Pública",
    descricao: "Autorização para ocupação temporária de via ou espaço público (obras, mudanças, feiras, esplanadas).",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMTTM",
    origensPermitidas: ["CIDADAO", "EMPRESA"],
    documentosExigidos: [
      { codigo: "BI_OU_CERTIDAO_COMERCIAL", nome: "BI (singular) ou Certidão Comercial (empresa)", obrigatorio: true },
      { codigo: "CROQUIS_LOCALIZACAO", nome: "Croquis do espaço a ocupar e período pretendido", obrigatorio: true },
    ],
    pago: true,
    fonte: "Direcção Municipal dos Transportes, Tráfego e Mobilidade",
  },

  {
    codigo: "ALVARA_COMERCIAL",
    nome: "Alvará Comercial (Comércio e Prestação de Serviços)",
    descricao: "Licenciamento de actividade económica — comércio ou prestação de serviços de pequena escala.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMDEI",
    origensPermitidas: ["CIDADAO", "EMPRESA"],
    documentosExigidos: [
      { codigo: "CERTIDAO_COMERCIAL", nome: "Certidão Comercial (Registo Comercial)", obrigatorio: true },
      { codigo: "BI_GERENTE", nome: "Identificação (BI) do Gerente/comerciante", obrigatorio: true },
      {
        codigo: "TITULO_PROPRIEDADE_OU_ARRENDAMENTO",
        nome: "Contrato de arrendamento reconhecido ou título de propriedade do espaço",
        obrigatorio: false,
      },
    ],
    pago: true,
    fonte: "GUE — gue.gov.ao/portal/licenciamento-geral",
  },
  {
    codigo: "LICENCA_GAS_BUTANO",
    nome: "Licença para Venda de Gás Butano",
    descricao: "Autorização municipal para comercialização de gás butano.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMDEI",
    origensPermitidas: ["CIDADAO", "EMPRESA"],
    documentosExigidos: [
      { codigo: "BI_COPIA", nome: "Cópia do Bilhete de Identidade do requerente", obrigatorio: true },
      { codigo: "COMPROVATIVO_PAGAMENTO", nome: "Comprovativo de pagamento da taxa de emolumento", obrigatorio: true },
    ],
    pago: true,
    fonte: "simplifica.gov.ao/theme/assets/Simplifica_Livro_Digital.pdf (lista de actos — Serviço de Bombeiros/Administração Municipal)",
  },
  {
    codigo: "CERTIDAO_NAO_DIVIDA_MUNICIPAL",
    nome: "Certidão de Não Dívida Municipal",
    descricao: "Comprova que o requerente (singular ou colectivo) não tem taxas ou impostos municipais em atraso.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "SG",
    origensPermitidas: ["CIDADAO", "EMPRESA"],
    documentosExigidos: [
      { codigo: "BI_OU_CERTIDAO_COMERCIAL", nome: "BI (singular) ou Certidão Comercial (empresa)", obrigatorio: true },
    ],
    pago: true,
    valorReferenciaKz: 650,
    fonte: "Secretaria Geral — Secção de Orçamento, Finanças e Contratação Pública",
  },

  {
    codigo: "LICENCIAMENTO_OBRAS_EMPRESA",
    nome: "Licenciamento de Obras de Construção ou Restauração (empresas de construção civil)",
    descricao: "Licença para construir, ampliar ou restaurar, requerida por empresas do ramo da construção civil.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMIOTH",
    origensPermitidas: ["EMPRESA"],
    documentosExigidos: [
      { codigo: "CERTIDAO_COMERCIAL", nome: "Certidão Comercial da empresa de construção", obrigatorio: true },
      { codigo: "ALVARA_CONSTRUCAO", nome: "Alvará de empresa de construção civil emitido pelo INACOM/tutela sectorial", obrigatorio: true },
      { codigo: "PROJECTO_TECNICO", nome: "Projecto técnico assinado por responsável técnico habilitado", obrigatorio: true },
      { codigo: "COMPROVATIVO_PAGAMENTO", nome: "Comprovativo de pagamento da taxa de licenciamento", obrigatorio: false },
    ],
    pago: true,
    fonte: "sepe.gov.ao — Pedido de Licenciamento de obras para Pessoas Colectivas · simplifica.gov.ao/26-medidas",
  },
  {
    codigo: "LICENCA_PUBLICIDADE_EXTERIOR",
    nome: "Licença de Publicidade Exterior / Afixação de Painéis",
    descricao: "Autorização para colocação de painéis publicitários, faixas ou outdoors em espaço visível da via pública.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMDEI",
    origensPermitidas: ["EMPRESA"],
    documentosExigidos: [
      { codigo: "CERTIDAO_COMERCIAL", nome: "Certidão Comercial da empresa", obrigatorio: true },
      { codigo: "MAQUETE_PUBLICIDADE", nome: "Maquete/design da peça publicitária e local pretendido", obrigatorio: true },
    ],
    pago: true,
    fonte: "Direcção Municipal de Desenvolvimento Económico Integrado",
  },
  {
    codigo: "LICENCA_TRANSPORTE_PUBLICO",
    nome: "Licença de Exploração de Transporte Público de Passageiros",
    descricao: "Autorização municipal para operar rotas de transporte semiurbano/urbano de passageiros (táxi, minibus).",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMTTM",
    origensPermitidas: ["EMPRESA"],
    documentosExigidos: [
      { codigo: "CERTIDAO_COMERCIAL", nome: "Certidão Comercial da empresa transportadora", obrigatorio: true },
      { codigo: "LISTA_VIATURAS", nome: "Lista de viaturas e respectivas inspecções periódicas em dia", obrigatorio: true },
    ],
    pago: true,
    fonte: "Direcção Municipal dos Transportes, Tráfego e Mobilidade",
  },
  {
    codigo: "LICENCA_AMBIENTAL_RESIDUOS",
    nome: "Licença Ambiental para Gestão/Recolha de Resíduos",
    descricao: "Autorização para operar recolha, transporte ou tratamento de resíduos sólidos urbanos ou industriais.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMASB",
    origensPermitidas: ["EMPRESA"],
    documentosExigidos: [
      { codigo: "CERTIDAO_COMERCIAL", nome: "Certidão Comercial da empresa", obrigatorio: true },
      { codigo: "ESTUDO_IMPACTE_AMBIENTAL", nome: "Estudo/ficha de impacte ambiental simplificado", obrigatorio: true },
    ],
    pago: true,
    fonte: "Direcção Municipal do Ambiente e Saneamento Básico",
  },
  {
    codigo: "LICENCA_SANITARIA_ESTABELECIMENTO",
    nome: "Licença Sanitária de Estabelecimento (Alimentar/Farmacêutico)",
    descricao: "Autorização sanitária para funcionamento de estabelecimentos comerciais que manipulam géneros alimentícios ou produtos farmacêuticos.",
    tipoProcesso: "LICENCIAMENTO",
    direcaoResponsavelSigla: "DMS",
    origensPermitidas: ["EMPRESA"],
    documentosExigidos: [
      { codigo: "CERTIDAO_COMERCIAL", nome: "Certidão Comercial do estabelecimento", obrigatorio: true },
      { codigo: "CARTAO_SANITARIO_FUNCIONARIOS", nome: "Cartões sanitários dos funcionários que manipulam alimentos", obrigatorio: true },
    ],
    pago: true,
    fonte: "Direcção Municipal de Saúde — Inspecção de Saúde",
  },
  {
    codigo: "DOACAO_MUNICIPIO",
    nome: "Doação à Administração Municipal (responsabilidade social empresarial)",
    descricao: "Registo formal de doação de bens, serviços ou valores por empresas ou instituições à Administração Municipal.",
    tipoProcesso: "DOACAO",
    direcaoResponsavelSigla: "SG",
    origensPermitidas: ["EMPRESA", "INSTITUICAO"],
    documentosExigidos: [
      { codigo: "CERTIDAO_COMERCIAL_OU_ESTATUTOS", nome: "Certidão Comercial (empresa) ou Estatutos (instituição)", obrigatorio: true },
      { codigo: "DESCRICAO_DOACAO", nome: "Descrição/inventário do bem, serviço ou valor doado", obrigatorio: true },
    ],
    pago: false,
    fonte: "Secretaria Geral — Património, Logística e Protocolo",
  },
  {
    codigo: "SUGESTAO_MELHORIA_SERVICOS",
    nome: "Sugestão de Melhoria de Serviços Municipais",
    descricao: "Canal para cidadãos, empresas ou instituições sugerirem melhorias a serviços, processos ou infra-estruturas municipais.",
    tipoProcesso: "SUGESTAO",
    direcaoResponsavelSigla: "GEPE",
    origensPermitidas: ["CIDADAO", "EMPRESA", "INSTITUICAO"],
    documentosExigidos: [],
    pago: false,
    fonte: "Gabinete de Estudos, Planeamento e Estatística",
  },

  {
    codigo: "REGISTO_INSTITUICAO",
    nome: "Registo de Instituição junto da Administração Municipal",
    descricao: "Registo formal de ONG, associação, confissão religiosa ou outra instituição para efeitos de reconhecimento e interlocução com a Administração.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "GJ",
    origensPermitidas: ["INSTITUICAO"],
    documentosExigidos: [
      { codigo: "ESTATUTOS", nome: "Estatutos da instituição", obrigatorio: true },
      { codigo: "ACTA_CONSTITUICAO", nome: "Acta de constituição / registo no órgão tutelar competente", obrigatorio: true },
      { codigo: "BI_REPRESENTANTE", nome: "Identificação (BI) do representante legal", obrigatorio: true },
    ],
    pago: false,
    fonte: "Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores",
  },
  {
    codigo: "PARCERIA_INSTITUCIONAL",
    nome: "Proposta de Parceria ou Protocolo Institucional",
    descricao: "Submissão de proposta de parceria, protocolo de cooperação ou geminação entre a instituição e a Administração Municipal.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "GJ",
    origensPermitidas: ["INSTITUICAO"],
    documentosExigidos: [
      { codigo: "MINUTA_PROTOCOLO", nome: "Minuta do protocolo/acordo de parceria proposto", obrigatorio: true },
    ],
    pago: false,
    fonte: "Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores",
  },
  {
    codigo: "CREDENCIAL_ACESSO_INSTITUCIONAL",
    nome: "Solicitação de Credenciais de Acesso Institucional",
    descricao:
      "Pedido de credenciais (e-mail institucional / acesso ao Portal Institucional) para um representante da instituição — " +
      "tramitado como PedidoValidacaoIdentidade com dupla aprovação (ver módulo validate_identity, secção 10.5).",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "GRH",
    origensPermitidas: ["INSTITUICAO"],
    documentosExigidos: [
      { codigo: "BI_REPRESENTANTE", nome: "Identificação (BI) do representante a credenciar", obrigatorio: true },
      { codigo: "CARTA_INDICACAO", nome: "Carta da instituição a indicar o representante", obrigatorio: true },
    ],
    pago: false,
    fonte: "Gabinete de Recursos Humanos · fluxo de dupla aprovação de credenciais (secção 10.5)",
  },

  {
    codigo: "REGISTO_COMISSAO_MORADORES",
    nome: "Registo/Actualização de Dados da Comissão de Moradores",
    descricao: "Registo inicial ou actualização de membros e contactos de uma Comissão de Moradores junto do Gabinete Jurídico.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "GJ",
    origensPermitidas: ["COMISSAO_MORADORES"],
    documentosExigidos: [
      { codigo: "ACTA_ELEICAO_COMISSAO", nome: "Acta de eleição/constituição da Comissão de Moradores", obrigatorio: true },
      { codigo: "LISTA_MEMBROS", nome: "Lista actualizada dos membros e respectivos cargos", obrigatorio: true },
    ],
    pago: false,
    fonte: "Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores",
  },
  {
    codigo: "REGISTO_OCORRENCIA_BAIRRO",
    nome: "Registo de Ocorrência do Bairro/Zona",
    descricao: "Comunicação directa de uma ocorrência (infra-estrutura danificada, conflito comunitário, necessidade urgente) à Administração.",
    tipoProcesso: "EXPEDIENTE",
    direcaoResponsavelSigla: "GJ",
    origensPermitidas: ["COMISSAO_MORADORES"],
    documentosExigidos: [],
    pago: false,
    fonte: "Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores — comunicação directa com a Administração (secção 16)",
  },

  {
    codigo: "PEDIDO_AUDIENCIA_ADMINISTRADOR",
    nome: "Pedido de Audiência com o Administrador Municipal",
    descricao: "Solicitação de marcação de audiência com o Administrador Municipal ou Administrador Adjunto, tramitada em conjunto com o módulo de Agendamentos.",
    tipoProcesso: "PEDIDO_AUDIENCIA",
    direcaoResponsavelSigla: "GAM",
    origensPermitidas: ["CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"],
    documentosExigidos: [
      { codigo: "EXPOSICAO_MOTIVOS", nome: "Breve exposição dos motivos da audiência", obrigatorio: false },
    ],
    pago: false,
    fonte: "Gabinete do Administrador Municipal — Agendamento Digital",
  },
  {
    codigo: "RECLAMACAO_SERVICO_MUNICIPAL",
    nome: "Reclamação sobre Serviço ou Funcionário Municipal",
    descricao: "Apresentação de reclamação formal sobre a prestação de um serviço municipal ou a conduta de um funcionário.",
    tipoProcesso: "RECLAMACAO",
    direcaoResponsavelSigla: "GJ",
    origensPermitidas: ["CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"],
    documentosExigidos: [
      { codigo: "EVIDENCIA_ANEXO", nome: "Evidência/comprovativo relacionado com a reclamação (opcional)", obrigatorio: false },
    ],
    pago: false,
    fonte: "Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores",
  },
  {
    codigo: "DENUNCIA_IRREGULARIDADE",
    nome: "Denúncia de Irregularidade ou Infracção Administrativa",
    descricao: "Denúncia de construção clandestina, comércio informal ilegal, dano ambiental ou outra infracção fiscalizável pela Administração.",
    tipoProcesso: "DENUNCIA",
    direcaoResponsavelSigla: "DMF",
    origensPermitidas: ["CIDADAO", "EMPRESA", "COMISSAO_MORADORES"],
    documentosExigidos: [
      { codigo: "EVIDENCIA_ANEXO", nome: "Fotografias ou evidências da irregularidade denunciada (opcional)", obrigatorio: false },
    ],
    pago: false,
    fonte: "Direcção Municipal de Fiscalização",
  },
  {
    codigo: "PARECER_JURIDICO_INTERNO",
    nome: "Solicitação de Parecer Jurídico (uso interno)",
    descricao: "Pedido de parecer jurídico sobre um processo em curso, formulado por uma Direcção Municipal ao Gabinete Jurídico.",
    tipoProcesso: "PARECER_JURIDICO",
    direcaoResponsavelSigla: "GJ",
    origensPermitidas: ["INTERNO"],
    documentosExigidos: [],
    pago: false,
    fonte: "Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores — Artigo 16.º",
  },
  {
    codigo: "REQUISICAO_BEM_MATERIAL",
    nome: "Requisição de Bem ou Material de Consumo (uso interno)",
    descricao: "Pedido interno de aquisição/fornecimento de bens ou material de consumo corrente a cargo da Secretaria Geral.",
    tipoProcesso: "REQUISICAO_BEM_SERVICO",
    direcaoResponsavelSigla: "SG",
    origensPermitidas: ["INTERNO"],
    documentosExigidos: [],
    pago: false,
    fonte: "Secretaria Geral — Secção de Património, Logística e Protocolo",
  },
  {
    codigo: "REQUISICAO_EMPREITADA_OBRAS",
    nome: "Requisição de Empreitada de Obras Públicas (uso interno)",
    descricao: "Pedido interno de abertura de processo de empreitada para obra pública municipal.",
    tipoProcesso: "REQUISICAO_EMPREITADA",
    direcaoResponsavelSigla: "DMIOTH",
    origensPermitidas: ["INTERNO"],
    documentosExigidos: [],
    pago: false,
    fonte: "Direcção Municipal de Infra-Estruturas, Ordenamento do Território e Habitação",
  },
];

export function obterServicoPorCodigo(codigo: string): ServicoMunicipal | undefined {
  return CATALOGO_SERVICOS_MUNICIPAIS.find((s) => s.codigo === codigo);
}

export function filtrarServicos(criterios: {
  origem?: OrigemProcessoGenerico;
  tipoProcesso?: TipoProcessoGenerico;
  direcaoResponsavelSigla?: string;
  pago?: boolean;
}): ServicoMunicipal[] {
  return CATALOGO_SERVICOS_MUNICIPAIS.filter((servico) => {
    if (criterios.origem && !servico.origensPermitidas.includes(criterios.origem)) return false;
    if (criterios.tipoProcesso && servico.tipoProcesso !== criterios.tipoProcesso) return false;
    if (criterios.direcaoResponsavelSigla && servico.direcaoResponsavelSigla !== criterios.direcaoResponsavelSigla) return false;
    if (criterios.pago !== undefined && servico.pago !== criterios.pago) return false;
    return true;
  });
}

export function listarServicosPorOrigem(origem: OrigemProcessoGenerico): ServicoMunicipal[] {
  return filtrarServicos({ origem });
}

export function listarServicosPorDirecao(direcaoResponsavelSigla: string): ServicoMunicipal[] {
  return filtrarServicos({ direcaoResponsavelSigla });
}