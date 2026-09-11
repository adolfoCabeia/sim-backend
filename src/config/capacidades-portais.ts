export type CategoriaPortal = "PORTAL_MUNICIPE" | "PORTAL_EMPRESARIAL" | "PORTAL_INSTITUCIONAL" | "PAINEL_COMISSAO_MORADORES";

export interface FuncionalidadePortal {
  codigo: string;
  nome: string;
  descricao: string;
  metodo: "GET" | "POST";
  endpoint: string;
  servicosCatalogoRelacionados?: string[];
}

export interface CapacidadesPortal {
  portal: CategoriaPortal;
  nome: string;
  tipoConta: string;
  autenticacao: string;
  descricao: string;
  funcionalidades: FuncionalidadePortal[];
}

export const CAPACIDADES_PORTAIS: CapacidadesPortal[] = [
  {
    portal: "PORTAL_MUNICIPE",
    nome: "Portal Munícipe",
    tipoConta: "CIDADAO",
    autenticacao: "Número do Bilhete de Identidade + senha",
    descricao:
      "Portal do cidadão comum: pedir documentos/serviços municipais, acompanhar processos, pagar taxas, " +
      "denunciar problemas, marcar audiência e apresentar reclamações.",
    funcionalidades: [
      {
        codigo: "SOLICITAR_SERVICO",
        nome: "Solicitar serviços/documentos",
        descricao: "Abre um novo processo genérico a partir do catálogo de serviços municipais.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: [
          "CERTIDAO_RESIDENCIA",
          "LICENCIAMENTO_OBRAS_PARTICULARES",
          "ALVARA_COMERCIAL",
          "LICENCA_GAS_BUTANO",
          "CERTIDAO_NASCIMENTO_ENCAMINHAMENTO",
        ],
      },
      {
        codigo: "ACOMPANHAR_PROCESSO",
        nome: "Acompanhar processos pelo Número do Bilhete (estado + timeline)",
        descricao: "Lista os meus processos e consulta a timeline pública (estados visíveis ao cidadão) de cada um.",
        metodo: "GET",
        endpoint: "/portal/processos, /portal/processos/:id, /portal-municipe/processos/:id/timeline",
      },
      {
        codigo: "PAGAR_TAXAS",
        nome: "Pagar taxas",
        descricao:
          "Consulta as referências de pagamento (RUPE/Multicaixa) geradas para os meus processos; o pagamento em " +
          "si é efectuado no banco/Multicaixa e fica confirmado na plataforma pela Tesouraria.",
        metodo: "GET",
        endpoint: "/pagamentos/meus",
      },
      {
        codigo: "DENUNCIAR_PROBLEMA",
        nome: "Denunciar problemas",
        descricao: "Denúncia de problemas de fiscalização, obras clandestinas, ambiente ou via pública.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["DENUNCIA_PROBLEMA"],
      },
      {
        codigo: "MARCAR_AUDIENCIA",
        nome: "Marcar audiência",
        descricao: "Agendamento digital de audiência com o Administrador Municipal/Adjuntos, evitando filas.",
        metodo: "POST",
        endpoint: "/agendamentos",
        servicosCatalogoRelacionados: ["PEDIDO_AUDIENCIA_ADMINISTRADOR"],
      },
      {
        codigo: "RECLAMACOES",
        nome: "Reclamações",
        descricao: "Reclamação sobre serviços municipais, obras, vias públicas ou atendimento.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["RECLAMACAO_MUNICIPE"],
      },
    ],
  },
  {
    portal: "PORTAL_EMPRESARIAL",
    nome: "Portal Empresarial",
    tipoConta: "EMPRESA",
    autenticacao: "Número de Identificação Fiscal (NIF) da empresa + senha",
    descricao:
      "Portal das empresas: registar a empresa junto do município, solicitar licenças, acompanhar processos, " +
      "pagar taxas, reclamações, denúncias, sugestões e doações.",
    funcionalidades: [
      {
        codigo: "REGISTAR_EMPRESA",
        nome: "Registar empresa",
        descricao: "Registo inicial da empresa na plataforma municipal — pré-requisito para pedir licenças/alvarás.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["REGISTO_EMPRESA_MUNICIPAL"],
      },
      {
        codigo: "SOLICITAR_LICENCAS",
        nome: "Solicitar licenças",
        descricao: "Alvará comercial, renovação de alvará, ocupação de via pública, publicidade/outdoor.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: [
          "ALVARA_COMERCIAL",
          "RENOVACAO_ALVARA_COMERCIAL",
          "LICENCA_OCUPACAO_VIA_PUBLICA",
          "LICENCA_PUBLICIDADE_OUTDOOR",
          "LICENCA_GAS_BUTANO",
        ],
      },
      {
        codigo: "ACOMPANHAR_PROCESSOS",
        nome: "Acompanhar processos",
        descricao: "Lista os processos da empresa e consulta o estado/timeline de cada um.",
        metodo: "GET",
        endpoint: "/portal/processos, /portal/processos/:id",
      },
      {
        codigo: "PAGAR_TAXAS",
        nome: "Pagar taxas",
        descricao: "Consulta as referências de pagamento (RUPE) geradas para os processos da empresa.",
        metodo: "GET",
        endpoint: "/pagamentos/meus",
      },
      {
        codigo: "RECLAMACOES",
        nome: "Reclamações",
        metodo: "POST",
        endpoint: "/portal/processos",
        descricao: "Reclamação sobre serviços municipais dirigida por uma empresa.",
        servicosCatalogoRelacionados: ["RECLAMACAO_MUNICIPE"],
      },
      {
        codigo: "DENUNCIAS",
        nome: "Denúncias",
        metodo: "POST",
        endpoint: "/portal/processos",
        descricao: "Denúncia de problemas ligados à actividade económica ou via pública.",
        servicosCatalogoRelacionados: ["DENUNCIA_PROBLEMA"],
      },
      {
        codigo: "SUGESTOES",
        nome: "Sugestões",
        descricao: "Canal de sugestões de melhoria dirigidas à Administração Municipal.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["SUGESTAO_EMPRESARIAL"],
      },
      {
        codigo: "DOACOES",
        nome: "Doações",
        descricao: "Registo formal de doação de bens, serviços ou valores ao Município.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["DOACAO_EMPRESARIAL"],
      },
    ],
  },
  {
    portal: "PORTAL_INSTITUCIONAL",
    nome: "Portal Institucional",
    tipoConta: "INSTITUICAO",
    autenticacao: "E-mail institucional + senha",
    descricao:
      "Portal de instituições (ONG, igrejas, associações, organismos públicos/privados): registo de " +
      "instituições, parcerias institucionais, intercâmbio de documentos, marcação de audiências e solicitação " +
      "de credenciais.",
    funcionalidades: [
      {
        codigo: "REGISTO_INSTITUICOES",
        nome: "Registo de instituições",
        descricao: "Registo formal da instituição na plataforma municipal.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["REGISTO_INSTITUICAO_MUNICIPAL"],
      },
      {
        codigo: "PARCERIAS_INSTITUCIONAIS",
        nome: "Parcerias institucionais",
        descricao: "Proposta de parceria ou protocolo de cooperação com a Administração Municipal.",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["PARCERIA_INSTITUCIONAL_PROTOCOLO"],
      },
      {
        codigo: "INTERCAMBIO_DOCUMENTOS",
        nome: "E-mail institucional + intercâmbio de documentos",
        descricao:
          "Canal formal de troca de documentos com a Administração, com registo de entrada/saída (todos os " +
          "documentos oficiais deste circuito são PDF — ver secção 6.4).",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["INTERCAMBIO_DOCUMENTAL_INSTITUCIONAL"],
      },
      {
        codigo: "MARCACAO_AUDIENCIAS",
        nome: "Marcação de audiências",
        descricao: "Agendamento de audiência entre representantes da instituição e a Administração Municipal.",
        metodo: "POST",
        endpoint: "/agendamentos",
        servicosCatalogoRelacionados: ["PEDIDO_AUDIENCIA_INSTITUCIONAL"],
      },
      {
        codigo: "SOLICITACAO_CREDENCIAIS",
        nome: "Solicitação de credenciais",
        descricao:
          "Pedido de credenciais de acesso para representantes da instituição — fica pendente até validação " +
          "pela Administração (atribuição de perfil no Portal Administrativo).",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["SOLICITACAO_CREDENCIAL_INSTITUCIONAL"],
      },
      {
        codigo: "ACOMPANHAR_PROCESSOS",
        nome: "Acompanhar processos",
        descricao: "Lista os processos da instituição e consulta o estado/timeline de cada um.",
        metodo: "GET",
        endpoint: "/portal/processos, /portal/processos/:id",
      },
    ],
  },
  {
    portal: "PAINEL_COMISSAO_MORADORES",
    nome: "Painel Comissão de Moradores",
    tipoConta: "COMISSAO_MORADORES",
    autenticacao: "Credenciais próprias, atribuídas após certificação/validação de identidade (secção 10.5)",
    descricao:
      "Painel dos membros certificados da Comissão de Moradores: registo de ocorrências e comunicação directa " +
      "com a Administração.",
    funcionalidades: [
      {
        codigo: "REGISTO_OCORRENCIAS",
        nome: "Registo de ocorrências",
        descricao: "Ocorrências no bairro (infra-estruturas, segurança, saneamento, conflitos comunitários).",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["OCORRENCIA_COMISSAO_MORADORES"],
      },
      {
        codigo: "COMUNICACAO_DIRETA_ADMINISTRACAO",
        nome: "Comunicação directa com a Administração",
        descricao: "Reclamações, denúncias e pedidos de audiência apresentados directamente à Administração.",
        metodo: "POST",
        endpoint: "/portal/processos, /agendamentos",
        servicosCatalogoRelacionados: ["RECLAMACAO_MUNICIPE", "DENUNCIA_PROBLEMA", "PEDIDO_AUDIENCIA_ADMINISTRADOR"],
      },
      {
        codigo: "CREDENCIAIS_MEMBROS",
        nome: "Credenciais de membros, atribuídas após certificação",
        descricao:
          "Pedido de credencial para um novo membro da Comissão — só é activada depois de a Administração " +
          "validar a identidade e a acta de eleição/nomeação (secção 10.5).",
        metodo: "POST",
        endpoint: "/portal/processos",
        servicosCatalogoRelacionados: ["SOLICITACAO_CREDENCIAL_COMISSAO"],
      },
      {
        codigo: "ACOMPANHAR_PROCESSOS",
        nome: "Acompanhar processos",
        descricao: "Lista os processos da Comissão e consulta o estado/timeline de cada um.",
        metodo: "GET",
        endpoint: "/portal/processos, /portal/processos/:id",
      },
    ],
  },
];

export function obterCapacidadesPorTipoConta(tipoConta: string): CapacidadesPortal | undefined {
  return CAPACIDADES_PORTAIS.find((c) => c.tipoConta === tipoConta);
}