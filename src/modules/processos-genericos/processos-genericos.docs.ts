const TIPOS_PROCESSO_GENERICO = [
  "EXPEDIENTE",
  "PARECER_JURIDICO",
  "REQUISICAO_BEM_SERVICO",
  "REQUISICAO_EMPREITADA",
  "PEDIDO_AUDIENCIA",
  "RECLAMACAO",
  "DENUNCIA",
  "LICENCIAMENTO",
  "SUGESTAO",
  "DOACAO",
];

const ORIGENS_PROCESSO = ["CIDADAO", "EMPRESA", "INSTITUICAO", "INTERNO", "COMISSAO_MORADORES"];

const ESTADOS_PROCESSO_GENERICO = [
  "RECEBIDO",
  "EM_ANALISE",
  "EM_PARECER",
  "AGUARDANDO_DESPACHO",
  "DEFERIDO",
  "INDEFERIDO",
  "CONCLUIDO",
  "DEVOLVIDO",
];

const processoObject = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string", format: "uuid" },
    municipioId: { type: "string", format: "uuid" },
    numero: { type: "string" },
    tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
    origem: { type: "string", enum: ORIGENS_PROCESSO },
    assunto: { type: "string" },
    estado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
    localizacaoActual: { type: "string" },
    direcaoAtualId: { type: "string", format: "uuid", nullable: true },
    direcaoDespachadaId: { type: "string", format: "uuid", nullable: true },
    responsavelActualId: { type: "string", format: "uuid", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
    alteradoEm: { type: "string", format: "date-time" },
  },
};

const anexoObject = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string", format: "uuid" },
    processoId: { type: "string", format: "uuid" },
    nomeFicheiro: { type: "string" },
    storageKey: { type: "string" },
    tipoAnexo: { type: "string", enum: ["ENTRADA", "SAIDA"] },
    tipoDocumentoCodigo: { type: "string", nullable: true },
    utilizadorUploadId: { type: "string", format: "uuid" },
    criadoEm: { type: "string", format: "date-time" },
  },
};

const paginado = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: processoObject },
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
};

export const idParam = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid", description: "Id do processo genérico" } },
};

const observacaoOpcionalBody = {
  type: "object",
  properties: { observacao: { type: "string", maxLength: 2000 } },
};

export const errorResponse = (description: string) => ({
  type: "object",
  description,
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
});


export const criarProcessoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Criar um processo genérico",
    description:
      "Abre um novo processo genérico do tipo indicado, com a origem correspondente ao requerente (cidadão, " +
      "empresa, instituição, interno ou comissão de moradores). Requer a permissão processos_genericos:criar.",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["tipo", "origem", "assunto"],
      properties: {
        tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
        origem: { type: "string", enum: ORIGENS_PROCESSO },
        assunto: { type: "string", minLength: 5, maxLength: 300 },
        direcaoOrigemSigla: { type: "string" },
        servicoCodigo: { type: "string" },
      },
    },
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      400: errorResponse("Serviço incompatível com o tipo de processo indicado"),
      404: errorResponse("Direcção ou serviço não encontrados"),
    },
  },
};

export const obterAnexoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Obter/download de um anexo",
    description:
      "Stream do ficheiro anexado a um processo. Valida que o utilizador tem acesso ao processo " +
      "e que o anexo pertence efectivamente a ele. Retorna o ficheiro com Content-Disposition inline.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id", "anexoId"],
      properties: {
        id: { type: "string", format: "uuid", description: "Id do processo" },
        anexoId: { type: "string", format: "uuid", description: "Id do anexo" },
      },
    },
    response: {
      200: {
        description: "Stream do ficheiro",
        content: {
          "application/pdf": { schema: { type: "string", format: "binary" } },
          "image/*": { schema: { type: "string", format: "binary" } },
        },
      },
      403: errorResponse("Não tem acesso a este processo"),
      404: errorResponse("Processo ou anexo não encontrado"),
    },
  },
};

export const transicionarProcessoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Transicionar o estado de um processo",
    description:
      "Muda o processo para um novo estado do fluxo (ex.: EM_ANALISE, DEFERIDO, INDEFERIDO), opcionalmente " +
      "registando uma observação visível ou não ao cidadão. Requer a permissão processos_genericos:transicionar.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["novoEstado"],
      properties: {
        novoEstado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
        observacao: { type: "string", maxLength: 2000 },
        visivelAoCidadao: { type: "boolean" },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Transição de estado não permitida a partir do estado actual"),
    },
  },
};

export const listarProcessosDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Listar processos genéricos",
    description:
      "Lista os processos do município, com filtros por tipo, estado, origem, departamento e restrição aos " +
      "atribuídos ao próprio utilizador. Por omissão, a listagem já é limitada aos processos a que o " +
      "utilizador tem acesso. Requer a permissão processos_genericos:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
        estado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
        origem: { type: "string", enum: ORIGENS_PROCESSO },
        atribuidosAMim: { type: "boolean" },
        departamentoId: { type: "string", format: "uuid" },
        direcaoId: { type: "string", format: "uuid", description: "Filtra pela Direcção actual do processo (distinto de departamentoId)" },
      },
    },
    response: { 200: paginado },
  },
};

export const listarAtribuidosAMimDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Listar processos atribuídos a mim",
    description:
      "Atalho equivalente a GET /processos-genericos?atribuidosAMim=true — lista apenas os processos " +
      "actualmente atribuídos ao utilizador autenticado. Requer a permissão processos_genericos:consultar.",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
        estado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
      },
    },
    response: { 200: paginado },
  },
};

export const obterProcessoInternoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Obter um processo (vista interna/staff)",
    description: "Devolve os detalhes completos de um processo, incluindo campos internos, para o staff do município. Requer a permissão processos_genericos:consultar.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const obterTimelineCidadaoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Obter a timeline de um processo (vista do cidadão)",
    description:
      "Devolve o estado actual e a timeline de acções marcadas como visíveis ao cidadão, para o portal do " +
      "munícipe, incluindo a lista dos documentos de saída (resultado final tratado) já anexados ao processo " +
      "em 'documentosSaida' — usa GET /portal-municipe/processos/:id/documentos-saida/:anexoId para descarregar " +
      "cada um. Requer a permissão portal_municipe:consultar_processo.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
      403: errorResponse("O processo não pertence ao utilizador autenticado"),
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const obterAnexoSaidaCidadaoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Obter/download do documento de saída (vista do cidadão)",
    description:
      "Stream do documento de saída (resultado final tratado) de um processo, para o portal do munícipe. " +
      "Só o requerente do processo consegue aceder, e apenas a anexos do tipo SAIDA — a lista destes anexos " +
      "vem em GET /portal-municipe/processos/:id/timeline, no campo 'documentosSaida'. Retorna o ficheiro com " +
      "Content-Disposition inline. Requer a permissão portal_municipe:consultar_processo.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id", "anexoId"],
      properties: {
        id: { type: "string", format: "uuid", description: "Id do processo" },
        anexoId: { type: "string", format: "uuid", description: "Id do anexo de saída" },
      },
    },
    response: {
      200: {
        description: "Stream do ficheiro",
        content: {
          "application/pdf": { schema: { type: "string", format: "binary" } },
          "image/*": { schema: { type: "string", format: "binary" } },
        },
      },
      403: errorResponse("O processo não pertence ao utilizador autenticado"),
      404: errorResponse("Processo ou documento de saída não encontrado"),
    },
  },
};

export const arquivarDigitalDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Arquivar digitalmente um processo",
    description: "Move um processo concluído para o arquivo digital. Requer a permissão processos_genericos:arquivar_digital.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita arquivo"),
    },
  },
};

export const arquivarMortoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Enviar um processo para o arquivo morto",
    description: "Move um processo já arquivado digitalmente para o arquivo morto (retenção de longo prazo). Requer a permissão arquivo_morto:aceder.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita arquivo morto"),
    },
  },
};

const acaoDisponivelObject = {
  type: "object",
  properties: {
    id: { type: "string" },
    disponivel: { type: "boolean" },
    motivo: { type: "string" },
  },
};

export const listarAcoesDisponiveisDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Listar acções disponíveis para o utilizador neste processo",
    description:
      "Calcula, com as mesmas regras usadas para validar a execução (permissão, estado, localização no " +
      "circuito administrativo, atribuição pessoal), quais acções o utilizador autenticado pode efectivamente " +
      "executar sobre este processo neste momento. Serve apenas para a interface decidir que botões mostrar — " +
      "a autorização real continua a ser sempre revalidada em cada endpoint de acção; chamar directamente a API " +
      "de uma acção marcada aqui como indisponível continua a ser rejeitado. Requer a permissão " +
      "processos_genericos:consultar.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              acoes: { type: "array", items: acaoDisponivelObject },
              processo: {
                type: "object",
                properties: {
                  estado: { type: "string", enum: ESTADOS_PROCESSO_GENERICO },
                  localizacaoActual: { type: "string" },
                },
              },
            },
          },
        },
      },
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const atribuirResponsavelDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Atribuir o responsável actual de um processo",
    description:
      "Define qual o funcionário responsável por tratar o processo neste momento (ex.: um chefe de " +
      "departamento distribui trabalho pela equipa). Requer a permissão processos_genericos:atribuir_responsavel.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["novoResponsavelActualId"],
      properties: { novoResponsavelActualId: { type: "string", format: "uuid" } },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo ou utilizador não encontrados"),
    },
  },
};

export const listarFuncionariosParaAtribuicaoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Listar funcionários de uma direcção, com carga de trabalho",
    description:
      "Devolve os funcionários activos da direcção indicada, cada um com a contagem de processos genéricos " +
      "actualmente atribuídos a si (excluindo os já em Arquivo Morto), usado para escolher a quem distribuir " +
      "um processo com conhecimento da carga de trabalho de cada um. Requer a permissão " +
      "processos_genericos:atribuir_responsavel.",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["direcaoId"],
      properties: { direcaoId: { type: "string", format: "uuid", description: "Id da direcção" } },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                nomeCompleto: { type: "string" },
                email: { type: "string" },
                processosAtribuidos: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
};

export const anexarDocumentoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Anexar um documento ao processo",
    description:
      "Faz upload de um ficheiro (multipart/form-data) e associa-o ao processo como anexo de ENTRADA ou " +
      "SAIDA. Campos do formulário: 'documento' (ficheiro, obrigatório), 'tipoDocumentoCodigo' (opcional, código " +
      "do tipo de documento exigido pelo serviço) e 'tipoAnexo' (opcional, ENTRADA ou SAIDA — por omissão " +
      "ENTRADA para requerentes externos e conforme o contexto para utilizadores internos). Requer a permissão processos_genericos:anexar.",
    security: [{ bearerAuth: [] }],
    consumes: ["multipart/form-data"],
    params: idParam,
    response: {
      201: { type: "object", properties: { success: { type: "boolean" }, data: anexoObject } },
      400: errorResponse("Ficheiro em falta ou tipo de ficheiro inválido"),
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const listarDocumentosEmFaltaDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Listar documentos em falta para um processo",
    description: "Compara os documentos já anexados com os exigidos pelo serviço associado ao processo e devolve a lista dos que ainda faltam. Requer a permissão processos_genericos:consultar.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: { type: "object", additionalProperties: true } },
        },
      },
      404: errorResponse("Processo não encontrado"),
    },
  },
};

export const listarServicosMunicipaisDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "[Obsoleto] Listar o catálogo de serviços municipais — use GET /servicos/publico",
    description:
      "Mantido por compatibilidade. O catálogo passou a ser por município (tabela `servicos`, cadastrável via " +
      "/servicos), por isso este endpoint agora exige municipioId. Prefira GET /servicos/publico.",
    querystring: {
      type: "object",
      required: ["municipioId"],
      properties: {
        municipioId: { type: "string", format: "uuid" },
        origem: { type: "string", enum: ORIGENS_PROCESSO },
        tipo: { type: "string", enum: TIPOS_PROCESSO_GENERICO },
        direcaoSigla: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: { type: "object", additionalProperties: true } },
        },
      },
    },
  },
};

export const apresentarAoAdministradorDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Apresentar processo ao administrador",
    description: "Encaminha o processo do gabinete de expediente para o Administrador, para despacho. Requer a permissão processos_genericos:tramitar_gabinete.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: observacaoOpcionalBody,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const despacharParaDireccaoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Despachar processo para uma direcção",
    description: "O Administrador despacha o processo para a direcção municipal indicada (pela sigla), para tratamento. Requer a permissão processos_genericos:despachar_encaminhamento.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["direcaoDespachadaSigla"],
      properties: {
        direcaoDespachadaSigla: { type: "string", minLength: 2 },
        observacao: { type: "string", maxLength: 2000 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo ou direcção não encontrados"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const despacharParaAssessorJuridicoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Despachar processo para um assessor jurídico",
    description: "O Administrador despacha o processo directamente para um assessor jurídico específico, para parecer. Requer a permissão processos_genericos:despachar_encaminhamento.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["assessorUtilizadorId"],
      properties: {
        assessorUtilizadorId: { type: "string", format: "uuid" },
        observacao: { type: "string", maxLength: 2000 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo ou assessor não encontrados"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const expedirParaDireccaoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Expedir processo para a direcção despachada",
    description: "O gabinete de expediente formaliza o envio físico/digital do processo para a direcção já despachada pelo Administrador. Requer a permissão processos_genericos:expedir.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: observacaoOpcionalBody,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const subirRespostaDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Subir a resposta da direcção",
    description:
      "A direcção que tratou o processo devolve a resposta/parecer para o gabinete. 'viaExpediente' indica " +
      "se deve voltar a passar pelo expediente ou seguir directamente para o gabinete de origem. Requer a " +
      "permissão processos_genericos:expedir ou processos_genericos:tramitar_gabinete.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["viaExpediente"],
      properties: {
        viaExpediente: { type: "boolean" },
        observacao: { type: "string", maxLength: 2000 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const prepararSaidaDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Preparar a saída de um processo",
    description: "Inicia a fase de saída de um processo já respondido, preparando-o para submissão a despacho de saída. Requer a permissão processos_genericos:transicionar.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: observacaoOpcionalBody,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const submeterParaDespachoSaidaDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Submeter para despacho de saída",
    description: "Submete o processo preparado para saída ao despacho de autorização do Administrador. Requer a permissão processos_genericos:transicionar.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: observacaoOpcionalBody,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const despacharSaidaDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Despachar a saída de um processo",
    description: "O Administrador autoriza (ou não) a saída/expedição externa do processo. Requer a permissão processos_genericos:despachar_encaminhamento.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["autorizar"],
      properties: {
        autorizar: { type: "boolean" },
        observacao: { type: "string", maxLength: 2000 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};

export const formalizarEnvioExternoDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Formalizar o envio externo de um processo",
    description: "Regista o destino externo (entidade fora do município) para onde o processo autorizado foi efectivamente enviado, concluindo o fluxo de saída. Requer a permissão processos_genericos:expedir.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: {
      type: "object",
      required: ["destinoExterno"],
      properties: {
        destinoExterno: { type: "string", minLength: 2, maxLength: 300 },
        observacao: { type: "string", maxLength: 2000 },
      },
    },
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está num estado que permita esta transição"),
    },
  },
};


export const receberRespostaSubidaDocs = {
  schema: {
    tags: ["Processos Genéricos"],
    summary: "Receber resposta subida ao Gabinete",
    description:
      "Recebe no Gabinete do Administrador um processo que foi subido pela direcção " +
      "(via 'subir-resposta' directo ao GAM). Move a localização de RESPOSTA_A_SUBIR " +
      "para GABINETE_ADMINISTRADOR. Requer processos_genericos:tramitar_gabinete ou " +
      "processos_genericos:despachar_encaminhamento.",
    security: [{ bearerAuth: [] }],
    params: idParam,
    body: observacaoOpcionalBody,
    response: {
      200: { type: "object", properties: { success: { type: "boolean" }, data: processoObject } },
      404: errorResponse("Processo não encontrado"),
      409: errorResponse("Processo não está em 'Resposta a subir'"),
    },
  },
};