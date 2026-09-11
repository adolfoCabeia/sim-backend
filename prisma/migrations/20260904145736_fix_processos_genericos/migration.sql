-- CreateEnum
CREATE TYPE "TipoCentro" AS ENUM ('ACOLHIMENTO_INFANTIL', 'ACOLHIMENTO_IDOSOS', 'COZINHA_SOCIAL', 'MISTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoCentro" AS ENUM ('ATIVO', 'INATIVO', 'EM_MANUTENCAO');

-- CreateEnum
CREATE TYPE "NivelRiscoZona" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "TipoPedidoApoio" AS ENUM ('MICROCREDITO', 'HABITACAO', 'APOIO_IDOSO', 'CESTA_BASICA', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoPedidoApoio" AS ENUM ('EM_ANALISE', 'DEFERIDO', 'INDEFERIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPrograma" AS ENUM ('EMPODERAMENTO_GENERO', 'MICROCREDITO_COLETIVO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoPrograma" AS ENUM ('ATIVO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoCasoSensivel" AS ENUM ('VIOLENCIA_ABUSO', 'SEM_REGISTO_CIVIL', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoCasoSensivel" AS ENUM ('ABERTO', 'EM_ACOMPANHAMENTO', 'ENCAMINHADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "AcaoAuditoriaCaso" AS ENUM ('VISUALIZACAO', 'CRIACAO', 'EDICAO', 'ELIMINACAO', 'RESTAURACAO');

-- CreateEnum
CREATE TYPE "BemCategoria" AS ENUM ('MOVEIS', 'IMOVEL_DOMINIO_PUBLICO', 'IMOVEL_DOMINIO_PRIVADO', 'INTANGIVEIS', 'VEICULO');

-- CreateEnum
CREATE TYPE "BemEstado" AS ENUM ('OPERACIONAL', 'TRANSFERIDO', 'ABATIDO', 'MAU', 'OBSOLETO', 'AVARIADO');

-- CreateEnum
CREATE TYPE "SituacaoJuridica" AS ENUM ('REGULAR', 'IRREGULAR', 'EM_REGULARIZACAO');

-- CreateEnum
CREATE TYPE "EstadoOcupacao" AS ENUM ('LIVRE', 'OCUPADO', 'OCUPADO_ILEGALMENTE');

-- CreateEnum
CREATE TYPE "BemMovimentoTipo" AS ENUM ('AQUISICAO', 'TRANSFERENCIA', 'ABATIMENTO', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "BemHistoricoTipo" AS ENUM ('CRIACAO', 'EDICAO', 'TRANSFERENCIA', 'MANUTENCAO', 'ABATIMENTO', 'REGULARIZACAO_JURIDICA');

-- CreateEnum
CREATE TYPE "TipoMovimentoStock" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoServicoContinuo" AS ENUM ('ENERGIA', 'INTERNET', 'VOZ', 'TELEVISAO');

-- CreateEnum
CREATE TYPE "EstadoServicoContinuo" AS ENUM ('ACTIVO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RequisicaoCategoria" AS ENUM ('BEM', 'SERVICO', 'EMPREITADA');

-- CreateEnum
CREATE TYPE "RequisicaoEstado" AS ENUM ('RASCUNHO', 'SUBMETIDA', 'APROVADA', 'REJEITADA', 'EM_EXECUCAO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('REPARACAO', 'MONTAGEM', 'MELHORIA', 'MANUTENCAO', 'CONSTRUCAO_SOFTWARE');

-- CreateEnum
CREATE TYPE "EstadoObra" AS ENUM ('NAO_INICIADA', 'EM_CURSO', 'PARADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "CategoriaDiplomaLegal" AS ENUM ('LEGISLACAO_MUNICIPAL', 'POSTURA_MUNICIPAL', 'REGULAMENTO_TAXAS', 'PLANO_DIRECTOR_MUNICIPAL', 'CONTENCIOSO', 'DIARIO_REPUBLICA', 'DECRETO_PRESIDENCIAL', 'DESPACHO_MINISTERIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoDiplomaLegal" AS ENUM ('VIGENTE', 'REVOGADO');

-- CreateEnum
CREATE TYPE "TipoPlanoGepe" AS ENUM ('PDM', 'PLANO_ANUAL_ACTIVIDADES');

-- CreateEnum
CREATE TYPE "EstadoPlanoGepe" AS ENUM ('RASCUNHO', 'SUBMETIDO', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "NotificacaoTipo" AS ENUM ('PROCESSO_SUBMETIDO', 'PROCESSO_ATRIBUIDO', 'PROCESSO_ATUALIZADO', 'PROCESSO_CONCLUIDO', 'ACAO_REQUERIDA', 'SISTEMA');

-- CreateEnum
CREATE TYPE "TipoAccaoFiscalizacao" AS ENUM ('AUTO_NOTICIA', 'CONTRA_ORDENACAO', 'VISTORIA');

-- CreateEnum
CREATE TYPE "TipoVinculo" AS ENUM ('QUADRO', 'CONTRATO', 'ESTAGIARIO');

-- CreateEnum
CREATE TYPE "EstadoFuncionario" AS ENUM ('ATIVO', 'EM_FERIAS', 'SUSPENSO', 'OUTRO');

-- CreateEnum
CREATE TYPE "NivelHabilitacao" AS ENUM ('ENSINO_PRIMARIO', 'ENSINO_SECUNDARIO', 'TECNICO_MEDIO', 'BACHARELATO', 'LICENCIATURA', 'POS_GRADUACAO', 'MESTRADO', 'DOUTORAMENTO', 'CERTIFICACAO_PROFISSIONAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoPedidoFerias" AS ENUM ('SOLICITADO', 'APROVADO', 'REJEITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoRegistoPonto" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "MetodoRegistoPonto" AS ENUM ('BIOMETRICO', 'MANUAL');

-- CreateEnum
CREATE TYPE "EstadoComissaoModeradores" AS ENUM ('ACTIVA', 'INACTIVA', 'EM_REGULARIZACAO');

-- CreateEnum
CREATE TYPE "AreaResponsabilidade" AS ENUM ('POLITICA_SOCIAL_COMUNIDADE', 'ECONOMICA_FINANCEIRA', 'TECNICA_INFRAESTRUTURAS_SERVICOS');

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('INTERNO', 'CIDADAO', 'EMPRESA', 'INSTITUICAO', 'COMISSAO_MORADORES');

-- CreateEnum
CREATE TYPE "EstadoUtilizador" AS ENUM ('ACTIVA', 'SUSPENSA', 'BLOQUEADA', 'PENDENTE_VALIDACAO');

-- CreateEnum
CREATE TYPE "TipoOrgao" AS ENUM ('ORGAO_APOIO_CONSULTIVO', 'SERVICO_APOIO_TECNICO', 'SERVICO_APOIO_INSTRUMENTAL', 'DIRECCAO_EXECUTIVA_DESCONCENTRADA');

-- CreateEnum
CREATE TYPE "TipoProcesso" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TipoProcessoGenerico" AS ENUM ('EXPEDIENTE', 'PARECER_JURIDICO', 'REQUISICAO_BEM_SERVICO', 'REQUISICAO_EMPREITADA', 'PEDIDO_AUDIENCIA', 'RECLAMACAO', 'DENUNCIA', 'LICENCIAMENTO', 'SUGESTAO', 'DOACAO', 'AUTO_NOTICIA', 'CONTRA_ORDENACAO', 'VISTORIA');

-- CreateEnum
CREATE TYPE "TipoAnexoProcesso" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "EstadoOfertaAntecipacao" AS ENUM ('PENDENTE', 'ACEITE', 'RECUSADA', 'EXPIRADA', 'SUBSTITUIDA');

-- CreateEnum
CREATE TYPE "OrigemProcessoGenerico" AS ENUM ('CIDADAO', 'EMPRESA', 'INSTITUICAO', 'INTERNO', 'COMISSAO_MORADORES');

-- CreateEnum
CREATE TYPE "EstadoProcessoGenerico" AS ENUM ('RECEBIDO', 'EM_ANALISE', 'EM_PARECER', 'AGUARDANDO_DESPACHO', 'DEFERIDO', 'INDEFERIDO', 'CONCLUIDO', 'DEVOLVIDO');

-- CreateEnum
CREATE TYPE "LocalizacaoProcesso" AS ENUM ('EXPEDIENTE', 'GABINETE_ADMINISTRADOR', 'AGUARDA_DESPACHO_ROTEAMENTO', 'EXPEDIENTE_A_ENVIAR', 'DIRECCAO_COMPETENTE', 'PARECER_ASSESSOR_JURIDICO', 'RESPOSTA_A_SUBIR', 'CONCLUIDO_NOTIFICADO', 'PREPARACAO_SAIDA', 'AGUARDA_DESPACHO_SAIDA', 'EXPEDIENTE_SAIDA_A_FORMALIZAR', 'EXPEDIDO_EXTERNO');

-- CreateEnum
CREATE TYPE "EstadoPagamento" AS ENUM ('PENDENTE', 'PAGO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoAgendamento" AS ENUM ('ADMINISTRADOR', 'ASSISTENTE_SOCIAL');

-- CreateEnum
CREATE TYPE "EstadoAgendamento" AS ENUM ('SOLICITADO', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'FALTA');

-- CreateEnum
CREATE TYPE "EstadoPublicacaoConteudo" AS ENUM ('RASCUNHO', 'PUBLICADO', 'PUBLICADO_PARCIAL', 'RESTRITO');

-- CreateEnum
CREATE TYPE "CategoriaConteudoPublico" AS ENUM ('NOTICIA', 'AVISO', 'SERVICO', 'TRANSPARENCIA', 'LEGISLACAO', 'EVENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoContactoInstitucional" AS ENUM ('INTERNO', 'EXTERNO');

-- CreateTable
CREATE TABLE "municipios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "provincia" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_acolhimento" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCentro" NOT NULL,
    "bairro" TEXT NOT NULL,
    "endereco" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capacidadeMaxima" INTEGER,
    "ocupacaoAtual" INTEGER NOT NULL DEFAULT 0,
    "responsavelNome" TEXT,
    "responsavelContacto" TEXT,
    "estado" "EstadoCentro" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_acolhimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_sensiveis" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "nivelRisco" "NivelRiscoZona" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_sensiveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarios" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "contacto" TEXT,
    "numeroMembrosAgregado" INTEGER,
    "zonaSensivelId" TEXT,
    "criancasSemRegistoCivil" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos_sensiveis" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "beneficiarioId" TEXT,
    "tipo" "TipoCasoSensivel" NOT NULL,
    "descricaoCifrada" TEXT NOT NULL,
    "encaminhadoParaCifrado" TEXT,
    "estado" "EstadoCasoSensivel" NOT NULL DEFAULT 'ABERTO',
    "dataDeteccao" TIMESTAMP(3) NOT NULL,
    "registadoPorId" TEXT NOT NULL,
    "eliminadoEm" TIMESTAMP(3),
    "eliminadoPorId" TEXT,
    "motivoEliminacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_sensiveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acessos_casos_sensiveis" (
    "id" TEXT NOT NULL,
    "casoSensivelId" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "acao" "AcaoAuditoriaCaso" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acessos_casos_sensiveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_apoio" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "tipo" "TipoPedidoApoio" NOT NULL,
    "estado" "EstadoPedidoApoio" NOT NULL DEFAULT 'EM_ANALISE',
    "valorAprovado" DECIMAL(12,2),
    "motivoIndeferimento" TEXT,
    "observacoes" TEXT,
    "resolvidoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),

    CONSTRAINT "pedidos_apoio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribuicoes_kits" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "centroAcolhimentoId" TEXT,
    "quantidadeKits" INTEGER NOT NULL DEFAULT 1,
    "requisicaoId" TEXT,
    "distribuidoPorId" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribuicoes_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_sociais" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoPrograma" NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "estado" "EstadoPrograma" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_sociais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes_programas" (
    "id" TEXT NOT NULL,
    "programaId" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "dataInscricao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,

    CONSTRAINT "participantes_programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bem" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "categoria" "BemCategoria" NOT NULL,
    "designacao" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "estado" "BemEstado" NOT NULL DEFAULT 'OPERACIONAL',
    "tempoVidaUtil" INTEGER,
    "dataAquisicao" TIMESTAMP(3),
    "criadoPorId" TEXT NOT NULL,
    "alteradoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,
    "direcaoId" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "cor" TEXT,
    "observacao" TEXT,
    "extensao" DOUBLE PRECISION,
    "largura" DOUBLE PRECISION,
    "areaImplantada" DOUBLE PRECISION,
    "areaConstruida" DOUBLE PRECISION,
    "numeroCompartimentos" INTEGER,
    "areaInstalada" DOUBLE PRECISION,
    "piso" TEXT,
    "chassi" TEXT,
    "numeroMatricula" TEXT,
    "numeroLugares" INTEGER,
    "tipoCombustivel" TEXT,
    "ticketMarca" TEXT,
    "logotipoUrl" TEXT,
    "numeroRegistoMarca" TEXT,

    CONSTRAINT "Bem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BemFachada" (
    "id" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "direcao" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "descricao" TEXT,

    CONSTRAINT "BemFachada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BemImagem" (
    "id" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "legenda" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BemImagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BemHistorico" (
    "id" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "tipo" "BemHistoricoTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dadosAnteriores" JSONB,

    CONSTRAINT "BemHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BemMovimento" (
    "id" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "tipo" "BemMovimentoTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "direcaoOrigemId" TEXT,
    "direcaoDestinoId" TEXT,
    "utilizadorId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DOUBLE PRECISION,
    "observacao" TEXT,

    CONSTRAINT "BemMovimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BemRegularizacaoJuridica" (
    "id" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "situacaoJuridica" "SituacaoJuridica" NOT NULL DEFAULT 'IRREGULAR',
    "estadoOcupacao" "EstadoOcupacao" NOT NULL DEFAULT 'LIVRE',
    "historicoDocumental" TEXT,
    "alertaIrregularidade" BOOLEAN NOT NULL DEFAULT false,
    "processos" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BemRegularizacaoJuridica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_stock" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "designacao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidadeMedida" TEXT NOT NULL,
    "quantidadeActual" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMinima" INTEGER NOT NULL DEFAULT 0,
    "pontoReposicao" INTEGER NOT NULL DEFAULT 0,
    "cicloReposicaoMeses" INTEGER,
    "fornecedorPadrao" TEXT,
    "ultimoAlertaEnviadoEm" TIMESTAMP(3),
    "ultimoNivelAlertaEnviado" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_stock" (
    "id" TEXT NOT NULL,
    "itemStockId" TEXT NOT NULL,
    "tipo" "TipoMovimentoStock" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "quantidadeAnterior" INTEGER NOT NULL,
    "quantidadePosterior" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "documentoRef" TEXT,
    "utilizadorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos_continuos" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "tipo" "TipoServicoContinuo" NOT NULL,
    "designacao" TEXT NOT NULL,
    "fornecedor" TEXT,
    "numeroContrato" TEXT,
    "estado" "EstadoServicoContinuo" NOT NULL DEFAULT 'ACTIVO',
    "dataUltimoCarregamento" TIMESTAMP(3),
    "valorUltimoCarregamento" DECIMAL(12,2),
    "consumoEstimadoDias" INTEGER,
    "dataPrevistaEsgotamento" TIMESTAMP(3),
    "dataProximoCarregamento" TIMESTAMP(3),
    "alertaDiasAntes" INTEGER NOT NULL DEFAULT 7,
    "ultimoAlertaEnviadoEm" TIMESTAMP(3),
    "ultimoNivelAlertaEnviado" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_continuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes_programadas" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "tipoManutencao" TEXT NOT NULL,
    "periodicidadeMeses" INTEGER NOT NULL,
    "dataUltima" TIMESTAMP(3),
    "dataProxima" TIMESTAMP(3),
    "especificacoesTecnicas" TEXT,
    "responsavelId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "ultimoAlertaEnviadoEm" TIMESTAMP(3),
    "ultimoNivelAlertaEnviado" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manutencoes_programadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frota_operacional" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "alocacaoActual" TEXT,
    "kmActual" INTEGER NOT NULL DEFAULT 0,
    "dataUltimaRevisao" TIMESTAMP(3),
    "kmProximaRevisao" INTEGER,
    "dataProximaRevisao" TIMESTAMP(3),
    "consumoMedio" DECIMAL(5,2),
    "ultimoAbastecimento" TIMESTAMP(3),
    "tipoCombustivel" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frota_operacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direcoes" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoOrgao" NOT NULL DEFAULT 'DIRECCAO_EXECUTIVA_DESCONCENTRADA',
    "areaResponsabilidade" "AreaResponsabilidade",
    "responsavel" TEXT,
    "contacto" TEXT,
    "permiteIntercambioInterMunicipal" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direcoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisicoes_logistica" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "categoria" "RequisicaoCategoria" NOT NULL,
    "estado" "RequisicaoEstado" NOT NULL DEFAULT 'RASCUNHO',
    "designacao" TEXT,
    "destinatario" TEXT,
    "observacao" TEXT,
    "direcaoId" TEXT,
    "requerenteId" TEXT NOT NULL,
    "aprovadoPorId" TEXT,
    "aprovadoEm" TIMESTAMP(3),
    "tipoServico" "TipoServico",
    "dataProximaAccao" TIMESTAMP(3),
    "beneficiarioServico" TEXT,
    "especificacoesTecnicas" TEXT,
    "dataInicioObra" TIMESTAMP(3),
    "estadoObra" "EstadoObra",
    "prazoExecucao" INTEGER,
    "percentagemExecucao" INTEGER DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisicoes_logistica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisicao_itens" (
    "id" TEXT NOT NULL,
    "requisicaoId" TEXT NOT NULL,
    "tipoBem" TEXT NOT NULL,
    "unidadeMedida" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "especificacoes" TEXT,

    CONSTRAINT "requisicao_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisicao_anexos" (
    "id" TEXT NOT NULL,
    "requisicaoId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "direcao" TEXT,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisicao_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "direcaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "acessoIlimitadoPonto" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "sistemico" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "accao" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_permissoes" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfis_permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizador_perfis" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "atribuidoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilizador_perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizadores" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "tipoConta" "TipoConta" NOT NULL,
    "estado" "EstadoUtilizador" NOT NULL DEFAULT 'PENDENTE_VALIDACAO',
    "emailConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "emailConfirmadoEm" TIMESTAMP(3),
    "telefone" TEXT,
    "endereco" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "direcaoId" TEXT,
    "superiorId" TEXT,
    "departamentoId" TEXT,
    "funcao" TEXT,
    "areaResponsabilidade" "AreaResponsabilidade",
    "nomeEmpresa" TEXT,
    "nifEmpresa" TEXT,
    "nomeInstituicao" TEXT,
    "nipcInstituicao" TEXT,
    "nomeComissao" TEXT,
    "bairroZona" TEXT,
    "cargoComissao" TEXT,
    "documentoTipo" TEXT,
    "documentoNumero" TEXT,
    "documentoValidadoEm" TIMESTAMP(3),
    "documentoValidadoPorId" TEXT,
    "mfaActivo" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "deveTrocarPassword" BOOLEAN NOT NULL DEFAULT false,
    "tentativasLoginFalhadas" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilizadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_validacao_identidade" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "documentoTipo" TEXT,
    "documentoNumero" TEXT,
    "documentoStorageKey" TEXT,
    "documentoNomeOriginal" TEXT,
    "perfilSolicitadoId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'AGUARDANDO_DOCUMENTO',
    "motivoRejeicao" TEXT,
    "aprovacaoNivel1PorId" TEXT,
    "aprovacaoNivel1Em" TIMESTAMP(3),
    "aprovacaoNivel2PorId" TEXT,
    "aprovacaoNivel2Em" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_validacao_identidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intercambios" (
    "id" TEXT NOT NULL,
    "direcaoOrigemId" TEXT NOT NULL,
    "municipioDestinoId" TEXT NOT NULL,
    "numeroProtocolo" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ENVIADO',
    "documentoStorageKey" TEXT,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recebidoEm" TIMESTAMP(3),
    "confirmadoEm" TIMESTAMP(3),

    CONSTRAINT "intercambios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_confirmation_tokens" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_confirmation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "ipOrigem" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "utilizadorId" TEXT,
    "accao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "detalhes" JSONB,
    "ipOrigem" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas_eletronicas" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "signatarioId" TEXT NOT NULL,
    "referenciaTipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "tipoAssinatura" TEXT NOT NULL,
    "hashConteudo" TEXT NOT NULL,
    "assinaturaHmac" TEXT NOT NULL,
    "ipOrigem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assinaturas_eletronicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pastas" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "pastaPaiId" TEXT,
    "direcaoId" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pastas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "pastaId" TEXT,
    "direcaoId" TEXT,
    "utilizadorId" TEXT,
    "tipo" TEXT,
    "nome" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "nomeOriginal" TEXT,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diplomas_legais" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "categoria" "CategoriaDiplomaLegal" NOT NULL,
    "numero" TEXT,
    "titulo" TEXT NOT NULL,
    "dataPublicacao" TIMESTAMP(3),
    "estado" "EstadoDiplomaLegal" NOT NULL DEFAULT 'VIGENTE',
    "documentoId" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diplomas_legais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_gepe" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "tipo" "TipoPlanoGepe" NOT NULL,
    "titulo" TEXT NOT NULL,
    "ano" INTEGER,
    "periodoInicio" TIMESTAMP(3),
    "periodoFim" TIMESTAMP(3),
    "objectivos" TEXT,
    "estado" "EstadoPlanoGepe" NOT NULL DEFAULT 'RASCUNHO',
    "documentoId" TEXT,
    "submetidoPorId" TEXT,
    "submetidoEm" TIMESTAMP(3),
    "aprovadoPorId" TEXT,
    "aprovadoEm" TIMESTAMP(3),
    "observacoesAdministrador" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_gepe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "lidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "NotificacaoTipo" NOT NULL DEFAULT 'SISTEMA',

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos_genericos" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "TipoProcessoGenerico" NOT NULL,
    "origem" "OrigemProcessoGenerico" NOT NULL,
    "assunto" TEXT NOT NULL,
    "requerenteUtilizadorId" TEXT,
    "direcaoOrigemId" TEXT,
    "direcaoAtualId" TEXT,
    "direcaoDespachadaId" TEXT,
    "responsavelActualId" TEXT,
    "estado" "EstadoProcessoGenerico" NOT NULL DEFAULT 'RECEBIDO',
    "resultado" TEXT,
    "localizacaoActual" "LocalizacaoProcesso" NOT NULL DEFAULT 'EXPEDIENTE',
    "prazoLegalResposta" TIMESTAMP(3),
    "diasAlertaAntesPrazo" INTEGER NOT NULL DEFAULT 3,
    "alertaEnviadoEm" TIMESTAMP(3),
    "escaladoEm" TIMESTAMP(3),
    "arquivoDigitalEm" TIMESTAMP(3),
    "arquivoMortoEm" TIMESTAMP(3),
    "aguardaPagamento" BOOLEAN NOT NULL DEFAULT false,
    "servicoCodigo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processos_genericos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscalizacao_detalhes" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "tipoAccao" "TipoAccaoFiscalizacao" NOT NULL,
    "estabelecimentoNome" TEXT,
    "estabelecimentoEndereco" TEXT,
    "tipoInfraccao" TEXT,
    "descricaoInfraccao" TEXT,
    "valorCoima" DECIMAL(14,2),
    "coimaAplicadaEm" TIMESTAMP(3),
    "dataVistoria" TIMESTAMP(3),
    "fiscalResponsavelId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscalizacao_detalhes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos_genericos_transicoes" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "estadoAnterior" "EstadoProcessoGenerico",
    "estadoNovo" "EstadoProcessoGenerico" NOT NULL,
    "utilizadorId" TEXT,
    "observacao" TEXT,
    "visivelAoCidadao" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processos_genericos_transicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos_genericos_anexos" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "nomeFicheiro" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "tipoDocumentoCodigo" TEXT,
    "tipoAnexo" "TipoAnexoProcesso" NOT NULL DEFAULT 'ENTRADA',
    "utilizadorUploadId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processos_genericos_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoPagamento" NOT NULL DEFAULT 'PENDENTE',
    "criadoPorId" TEXT,
    "expiraEm" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "metadadosConfirmacao" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "direcaoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "orgaoArrecadador" TEXT NOT NULL,
    "servicoNome" TEXT NOT NULL,
    "servicoCodigo" TEXT,
    "numeroDli" TEXT,
    "valorCobradoDli" DECIMAL(14,2) NOT NULL,
    "numeroDar" TEXT,
    "valorPagoDar" DECIMAL(14,2) NOT NULL,
    "numeroRupe" TEXT,
    "observacao" TEXT,
    "criadoPorId" TEXT,
    "alteradoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipoProcesso" "TipoProcessoGenerico" NOT NULL,
    "direcaoResponsavelId" TEXT NOT NULL,
    "origensPermitidas" "OrigemProcessoGenerico"[],
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "valorReferenciaKz" DECIMAL(12,2),
    "fonte" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" TEXT,
    "alteradoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico_documentos_exigidos" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "servico_documentos_exigidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "utilizadorId" TEXT,
    "tipo" "TipoAgendamento" NOT NULL,
    "atendidoPorId" TEXT,
    "dataHoraInicio" TIMESTAMP(3) NOT NULL,
    "dataHoraFim" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoAgendamento" NOT NULL DEFAULT 'SOLICITADO',
    "observacoes" TEXT,
    "processoGenericoId" TEXT,
    "numeroSenha" TEXT,
    "chegouEm" TIMESTAMP(3),
    "atendimentoIniciadoEm" TIMESTAMP(3),
    "atendimentoConcluidoEm" TIMESTAMP(3),
    "ultimaNotificacaoFilaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "departamentoId" TEXT,
    "cargo" TEXT NOT NULL,
    "contactoTelefone" TEXT,
    "contactoEmail" TEXT,
    "fotografiaUrl" TEXT,
    "cvUrl" TEXT,
    "tipoVinculo" "TipoVinculo" NOT NULL,
    "dataInicioVinculo" TIMESTAMP(3) NOT NULL,
    "dataFimVinculo" TIMESTAMP(3),
    "estado" "EstadoFuncionario" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "ultimaNotificacaoFimVinculoEm" TIMESTAMP(3),
    "ultimaNotificacaoAusenciaPontoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,
    "direcaoId" TEXT,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registos_ponto" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "tipo" "TipoRegistoPonto" NOT NULL,
    "metodo" "MetodoRegistoPonto" NOT NULL DEFAULT 'BIOMETRICO',
    "registadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipOrigem" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "registos_ponto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habilitacao" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "nivel" "NivelHabilitacao" NOT NULL,
    "curso" TEXT NOT NULL,
    "instituicao" TEXT NOT NULL,
    "anoConclusao" INTEGER,
    "comprovativoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habilitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ocorrencia" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "bairroZona" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'REGISTADA',
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "comissaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcorrenciaMensagem" (
    "id" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcorrenciaMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcorrenciaAnexo" (
    "id" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "nomeFicheiro" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcorrenciaAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes_moradores" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "coordenadasLat" DOUBLE PRECISION,
    "coordenadasLng" DOUBLE PRECISION,
    "presidenteNome" TEXT NOT NULL,
    "presidenteContacto" TEXT,
    "documentacaoLegalUrl" TEXT,
    "estado" "EstadoComissaoModeradores" NOT NULL DEFAULT 'EM_REGULARIZACAO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_moradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_comissao" (
    "id" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "contacto" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoFerias" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "diasUteis" INTEGER NOT NULL,
    "motivo" TEXT,
    "estado" "EstadoPedidoFerias" NOT NULL DEFAULT 'SOLICITADO',
    "aprovadoPorId" TEXT,
    "motivoRejeicao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),

    CONSTRAINT "PedidoFerias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfertaAntecipacao" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "dataHoraInicioAntiga" TIMESTAMP(3) NOT NULL,
    "dataHoraFimAntiga" TIMESTAMP(3) NOT NULL,
    "novaDataHoraInicio" TIMESTAMP(3) NOT NULL,
    "novaDataHoraFim" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoOfertaAntecipacao" NOT NULL DEFAULT 'PENDENTE',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),

    CONSTRAINT "OfertaAntecipacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudos_publicos" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT,
    "corpo" TEXT NOT NULL,
    "categoria" "CategoriaConteudoPublico" NOT NULL DEFAULT 'OUTRO',
    "estadoPublicacao" "EstadoPublicacaoConteudo" NOT NULL DEFAULT 'RASCUNHO',
    "gruposComAcesso" "TipoConta"[],
    "criadoPorId" TEXT,
    "publicadoPorId" TEXT,
    "publicadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteudos_publicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactos_institucionais" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "tipo" "TipoContactoInstitucional" NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "instituicao" TEXT,
    "direcaoId" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "notas" TEXT,
    "visivelPublico" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alteradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contactos_institucionais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipios_nome_key" ON "municipios"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_codigo_key" ON "municipios"("codigo");

-- CreateIndex
CREATE INDEX "centros_acolhimento_municipioId_estado_idx" ON "centros_acolhimento"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "centros_acolhimento_municipioId_tipo_idx" ON "centros_acolhimento"("municipioId", "tipo");

-- CreateIndex
CREATE INDEX "zonas_sensiveis_municipioId_nivelRisco_idx" ON "zonas_sensiveis"("municipioId", "nivelRisco");

-- CreateIndex
CREATE INDEX "beneficiarios_municipioId_bairro_idx" ON "beneficiarios"("municipioId", "bairro");

-- CreateIndex
CREATE INDEX "beneficiarios_municipioId_zonaSensivelId_idx" ON "beneficiarios"("municipioId", "zonaSensivelId");

-- CreateIndex
CREATE INDEX "casos_sensiveis_municipioId_estado_idx" ON "casos_sensiveis"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "casos_sensiveis_municipioId_tipo_idx" ON "casos_sensiveis"("municipioId", "tipo");

-- CreateIndex
CREATE INDEX "casos_sensiveis_municipioId_eliminadoEm_idx" ON "casos_sensiveis"("municipioId", "eliminadoEm");

-- CreateIndex
CREATE INDEX "acessos_casos_sensiveis_casoSensivelId_criadoEm_idx" ON "acessos_casos_sensiveis"("casoSensivelId", "criadoEm");

-- CreateIndex
CREATE INDEX "acessos_casos_sensiveis_utilizadorId_criadoEm_idx" ON "acessos_casos_sensiveis"("utilizadorId", "criadoEm");

-- CreateIndex
CREATE INDEX "pedidos_apoio_municipioId_estado_idx" ON "pedidos_apoio"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "pedidos_apoio_municipioId_tipo_idx" ON "pedidos_apoio"("municipioId", "tipo");

-- CreateIndex
CREATE INDEX "pedidos_apoio_municipioId_beneficiarioId_idx" ON "pedidos_apoio"("municipioId", "beneficiarioId");

-- CreateIndex
CREATE INDEX "distribuicoes_kits_municipioId_criadoEm_idx" ON "distribuicoes_kits"("municipioId", "criadoEm");

-- CreateIndex
CREATE INDEX "distribuicoes_kits_municipioId_beneficiarioId_idx" ON "distribuicoes_kits"("municipioId", "beneficiarioId");

-- CreateIndex
CREATE INDEX "programas_sociais_municipioId_estado_idx" ON "programas_sociais"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "programas_sociais_municipioId_tipo_idx" ON "programas_sociais"("municipioId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "participantes_programas_programaId_beneficiarioId_key" ON "participantes_programas"("programaId", "beneficiarioId");

-- CreateIndex
CREATE INDEX "Bem_municipioId_idx" ON "Bem"("municipioId");

-- CreateIndex
CREATE INDEX "Bem_categoria_idx" ON "Bem"("categoria");

-- CreateIndex
CREATE INDEX "Bem_estado_idx" ON "Bem"("estado");

-- CreateIndex
CREATE INDEX "Bem_direcaoId_idx" ON "Bem"("direcaoId");

-- CreateIndex
CREATE UNIQUE INDEX "BemFachada_bemId_direcao_key" ON "BemFachada"("bemId", "direcao");

-- CreateIndex
CREATE UNIQUE INDEX "BemRegularizacaoJuridica_bemId_key" ON "BemRegularizacaoJuridica"("bemId");

-- CreateIndex
CREATE INDEX "itens_stock_municipioId_idx" ON "itens_stock"("municipioId");

-- CreateIndex
CREATE INDEX "itens_stock_quantidadeActual_idx" ON "itens_stock"("quantidadeActual");

-- CreateIndex
CREATE UNIQUE INDEX "itens_stock_municipioId_codigo_key" ON "itens_stock"("municipioId", "codigo");

-- CreateIndex
CREATE INDEX "movimentos_stock_itemStockId_idx" ON "movimentos_stock"("itemStockId");

-- CreateIndex
CREATE INDEX "movimentos_stock_criadoEm_idx" ON "movimentos_stock"("criadoEm");

-- CreateIndex
CREATE INDEX "servicos_continuos_municipioId_idx" ON "servicos_continuos"("municipioId");

-- CreateIndex
CREATE INDEX "servicos_continuos_tipo_idx" ON "servicos_continuos"("tipo");

-- CreateIndex
CREATE INDEX "servicos_continuos_estado_idx" ON "servicos_continuos"("estado");

-- CreateIndex
CREATE INDEX "servicos_continuos_dataPrevistaEsgotamento_idx" ON "servicos_continuos"("dataPrevistaEsgotamento");

-- CreateIndex
CREATE INDEX "manutencoes_programadas_municipioId_idx" ON "manutencoes_programadas"("municipioId");

-- CreateIndex
CREATE INDEX "manutencoes_programadas_bemId_idx" ON "manutencoes_programadas"("bemId");

-- CreateIndex
CREATE INDEX "manutencoes_programadas_dataProxima_idx" ON "manutencoes_programadas"("dataProxima");

-- CreateIndex
CREATE INDEX "manutencoes_programadas_estado_idx" ON "manutencoes_programadas"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "frota_operacional_bemId_key" ON "frota_operacional"("bemId");

-- CreateIndex
CREATE INDEX "frota_operacional_municipioId_idx" ON "frota_operacional"("municipioId");

-- CreateIndex
CREATE INDEX "frota_operacional_alocacaoActual_idx" ON "frota_operacional"("alocacaoActual");

-- CreateIndex
CREATE INDEX "direcoes_tipo_idx" ON "direcoes"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "direcoes_municipioId_sigla_key" ON "direcoes"("municipioId", "sigla");

-- CreateIndex
CREATE UNIQUE INDEX "direcoes_municipioId_nome_key" ON "direcoes"("municipioId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "requisicoes_logistica_numero_key" ON "requisicoes_logistica"("numero");

-- CreateIndex
CREATE INDEX "requisicoes_logistica_municipioId_idx" ON "requisicoes_logistica"("municipioId");

-- CreateIndex
CREATE INDEX "requisicoes_logistica_categoria_idx" ON "requisicoes_logistica"("categoria");

-- CreateIndex
CREATE INDEX "requisicoes_logistica_estado_idx" ON "requisicoes_logistica"("estado");

-- CreateIndex
CREATE INDEX "requisicoes_logistica_direcaoId_idx" ON "requisicoes_logistica"("direcaoId");

-- CreateIndex
CREATE INDEX "requisicao_itens_requisicaoId_idx" ON "requisicao_itens"("requisicaoId");

-- CreateIndex
CREATE INDEX "requisicao_anexos_requisicaoId_idx" ON "requisicao_anexos"("requisicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_direcaoId_nome_key" ON "departamentos"("direcaoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_chave_key" ON "permissoes"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_recurso_accao_key" ON "permissoes"("recurso", "accao");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_permissoes_perfilId_permissaoId_key" ON "perfis_permissoes"("perfilId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "utilizador_perfis_utilizadorId_perfilId_key" ON "utilizador_perfis"("utilizadorId", "perfilId");

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_email_key" ON "utilizadores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_nifEmpresa_key" ON "utilizadores"("nifEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_nipcInstituicao_key" ON "utilizadores"("nipcInstituicao");

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_documentoNumero_key" ON "utilizadores"("documentoNumero");

-- CreateIndex
CREATE INDEX "utilizadores_municipioId_idx" ON "utilizadores"("municipioId");

-- CreateIndex
CREATE INDEX "utilizadores_direcaoId_idx" ON "utilizadores"("direcaoId");

-- CreateIndex
CREATE INDEX "utilizadores_departamentoId_idx" ON "utilizadores"("departamentoId");

-- CreateIndex
CREATE INDEX "utilizadores_superiorId_idx" ON "utilizadores"("superiorId");

-- CreateIndex
CREATE INDEX "pedidos_validacao_identidade_municipioId_idx" ON "pedidos_validacao_identidade"("municipioId");

-- CreateIndex
CREATE INDEX "pedidos_validacao_identidade_utilizadorId_idx" ON "pedidos_validacao_identidade"("utilizadorId");

-- CreateIndex
CREATE INDEX "pedidos_validacao_identidade_estado_idx" ON "pedidos_validacao_identidade"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "intercambios_numeroProtocolo_key" ON "intercambios"("numeroProtocolo");

-- CreateIndex
CREATE INDEX "intercambios_direcaoOrigemId_idx" ON "intercambios"("direcaoOrigemId");

-- CreateIndex
CREATE INDEX "intercambios_municipioDestinoId_idx" ON "intercambios"("municipioDestinoId");

-- CreateIndex
CREATE UNIQUE INDEX "email_confirmation_tokens_tokenHash_key" ON "email_confirmation_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_confirmation_tokens_utilizadorId_idx" ON "email_confirmation_tokens"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_utilizadorId_idx" ON "password_reset_tokens"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_utilizadorId_idx" ON "refresh_tokens"("utilizadorId");

-- CreateIndex
CREATE INDEX "logs_auditoria_utilizadorId_idx" ON "logs_auditoria"("utilizadorId");

-- CreateIndex
CREATE INDEX "logs_auditoria_municipioId_idx" ON "logs_auditoria"("municipioId");

-- CreateIndex
CREATE INDEX "logs_auditoria_criadoEm_idx" ON "logs_auditoria"("criadoEm");

-- CreateIndex
CREATE INDEX "assinaturas_eletronicas_municipioId_referenciaTipo_referenc_idx" ON "assinaturas_eletronicas"("municipioId", "referenciaTipo", "referenciaId");

-- CreateIndex
CREATE INDEX "assinaturas_eletronicas_municipioId_signatarioId_idx" ON "assinaturas_eletronicas"("municipioId", "signatarioId");

-- CreateIndex
CREATE INDEX "pastas_municipioId_pastaPaiId_idx" ON "pastas"("municipioId", "pastaPaiId");

-- CreateIndex
CREATE INDEX "pastas_municipioId_direcaoId_idx" ON "pastas"("municipioId", "direcaoId");

-- CreateIndex
CREATE INDEX "documentos_municipioId_pastaId_idx" ON "documentos"("municipioId", "pastaId");

-- CreateIndex
CREATE INDEX "documentos_direcaoId_idx" ON "documentos"("direcaoId");

-- CreateIndex
CREATE INDEX "documentos_utilizadorId_idx" ON "documentos"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_legais_documentoId_key" ON "diplomas_legais"("documentoId");

-- CreateIndex
CREATE INDEX "diplomas_legais_municipioId_categoria_idx" ON "diplomas_legais"("municipioId", "categoria");

-- CreateIndex
CREATE INDEX "diplomas_legais_municipioId_estado_idx" ON "diplomas_legais"("municipioId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "planos_gepe_documentoId_key" ON "planos_gepe"("documentoId");

-- CreateIndex
CREATE INDEX "planos_gepe_municipioId_tipo_idx" ON "planos_gepe"("municipioId", "tipo");

-- CreateIndex
CREATE INDEX "planos_gepe_municipioId_estado_idx" ON "planos_gepe"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "notificacoes_utilizadorId_idx" ON "notificacoes"("utilizadorId");

-- CreateIndex
CREATE INDEX "processos_genericos_municipioId_idx" ON "processos_genericos"("municipioId");

-- CreateIndex
CREATE INDEX "processos_genericos_estado_idx" ON "processos_genericos"("estado");

-- CreateIndex
CREATE INDEX "processos_genericos_tipo_idx" ON "processos_genericos"("tipo");

-- CreateIndex
CREATE INDEX "processos_genericos_direcaoAtualId_idx" ON "processos_genericos"("direcaoAtualId");

-- CreateIndex
CREATE INDEX "processos_genericos_responsavelActualId_idx" ON "processos_genericos"("responsavelActualId");

-- CreateIndex
CREATE INDEX "processos_genericos_prazoLegalResposta_idx" ON "processos_genericos"("prazoLegalResposta");

-- CreateIndex
CREATE INDEX "processos_genericos_servicoCodigo_idx" ON "processos_genericos"("servicoCodigo");

-- CreateIndex
CREATE INDEX "processos_genericos_localizacaoActual_idx" ON "processos_genericos"("localizacaoActual");

-- CreateIndex
CREATE INDEX "processos_genericos_direcaoDespachadaId_idx" ON "processos_genericos"("direcaoDespachadaId");

-- CreateIndex
CREATE UNIQUE INDEX "processos_genericos_municipioId_tipo_direcaoOrigemId_numero_key" ON "processos_genericos"("municipioId", "tipo", "direcaoOrigemId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "fiscalizacao_detalhes_processoId_key" ON "fiscalizacao_detalhes"("processoId");

-- CreateIndex
CREATE INDEX "fiscalizacao_detalhes_municipioId_estabelecimentoNome_idx" ON "fiscalizacao_detalhes"("municipioId", "estabelecimentoNome");

-- CreateIndex
CREATE INDEX "fiscalizacao_detalhes_municipioId_tipoAccao_idx" ON "fiscalizacao_detalhes"("municipioId", "tipoAccao");

-- CreateIndex
CREATE INDEX "processos_genericos_transicoes_processoId_idx" ON "processos_genericos_transicoes"("processoId");

-- CreateIndex
CREATE INDEX "processos_genericos_anexos_processoId_idx" ON "processos_genericos_anexos"("processoId");

-- CreateIndex
CREATE INDEX "processos_genericos_anexos_processoId_tipoAnexo_idx" ON "processos_genericos_anexos"("processoId", "tipoAnexo");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_referencia_key" ON "pagamentos"("referencia");

-- CreateIndex
CREATE INDEX "pagamentos_municipioId_idx" ON "pagamentos"("municipioId");

-- CreateIndex
CREATE INDEX "pagamentos_processoId_idx" ON "pagamentos"("processoId");

-- CreateIndex
CREATE INDEX "pagamentos_estado_idx" ON "pagamentos"("estado");

-- CreateIndex
CREATE INDEX "receitas_municipioId_idx" ON "receitas"("municipioId");

-- CreateIndex
CREATE INDEX "receitas_direcaoId_idx" ON "receitas"("direcaoId");

-- CreateIndex
CREATE INDEX "receitas_data_idx" ON "receitas"("data");

-- CreateIndex
CREATE INDEX "receitas_municipioId_data_idx" ON "receitas"("municipioId", "data");

-- CreateIndex
CREATE INDEX "receitas_direcaoId_data_idx" ON "receitas"("direcaoId", "data");

-- CreateIndex
CREATE INDEX "servicos_municipioId_idx" ON "servicos"("municipioId");

-- CreateIndex
CREATE INDEX "servicos_direcaoResponsavelId_idx" ON "servicos"("direcaoResponsavelId");

-- CreateIndex
CREATE INDEX "servicos_activo_idx" ON "servicos"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "servicos_municipioId_codigo_key" ON "servicos"("municipioId", "codigo");

-- CreateIndex
CREATE INDEX "servico_documentos_exigidos_servicoId_idx" ON "servico_documentos_exigidos"("servicoId");

-- CreateIndex
CREATE INDEX "agendamentos_municipioId_idx" ON "agendamentos"("municipioId");

-- CreateIndex
CREATE INDEX "agendamentos_tipo_idx" ON "agendamentos"("tipo");

-- CreateIndex
CREATE INDEX "agendamentos_dataHoraInicio_idx" ON "agendamentos"("dataHoraInicio");

-- CreateIndex
CREATE INDEX "agendamentos_estado_idx" ON "agendamentos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_utilizadorId_key" ON "Funcionario"("utilizadorId");

-- CreateIndex
CREATE INDEX "Funcionario_municipioId_estado_idx" ON "Funcionario"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "Funcionario_municipioId_departamentoId_idx" ON "Funcionario"("municipioId", "departamentoId");

-- CreateIndex
CREATE INDEX "Funcionario_municipioId_tipoVinculo_dataFimVinculo_idx" ON "Funcionario"("municipioId", "tipoVinculo", "dataFimVinculo");

-- CreateIndex
CREATE INDEX "registos_ponto_municipioId_funcionarioId_registadoEm_idx" ON "registos_ponto"("municipioId", "funcionarioId", "registadoEm");

-- CreateIndex
CREATE INDEX "registos_ponto_municipioId_registadoEm_idx" ON "registos_ponto"("municipioId", "registadoEm");

-- CreateIndex
CREATE INDEX "Habilitacao_municipioId_funcionarioId_idx" ON "Habilitacao"("municipioId", "funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Ocorrencia_numero_key" ON "Ocorrencia"("numero");

-- CreateIndex
CREATE INDEX "Ocorrencia_comissaoId_idx" ON "Ocorrencia"("comissaoId");

-- CreateIndex
CREATE INDEX "comissoes_moradores_municipioId_estado_idx" ON "comissoes_moradores"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "comissoes_moradores_municipioId_bairro_idx" ON "comissoes_moradores"("municipioId", "bairro");

-- CreateIndex
CREATE INDEX "membros_comissao_comissaoId_idx" ON "membros_comissao"("comissaoId");

-- CreateIndex
CREATE INDEX "PedidoFerias_municipioId_funcionarioId_estado_idx" ON "PedidoFerias"("municipioId", "funcionarioId", "estado");

-- CreateIndex
CREATE INDEX "PedidoFerias_municipioId_estado_idx" ON "PedidoFerias"("municipioId", "estado");

-- CreateIndex
CREATE INDEX "OfertaAntecipacao_municipioId_agendamentoId_estado_idx" ON "OfertaAntecipacao"("municipioId", "agendamentoId", "estado");

-- CreateIndex
CREATE INDEX "OfertaAntecipacao_expiraEm_idx" ON "OfertaAntecipacao"("expiraEm");

-- CreateIndex
CREATE INDEX "conteudos_publicos_municipioId_idx" ON "conteudos_publicos"("municipioId");

-- CreateIndex
CREATE INDEX "conteudos_publicos_estadoPublicacao_idx" ON "conteudos_publicos"("estadoPublicacao");

-- CreateIndex
CREATE INDEX "conteudos_publicos_categoria_idx" ON "conteudos_publicos"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "conteudos_publicos_municipioId_chave_key" ON "conteudos_publicos"("municipioId", "chave");

-- CreateIndex
CREATE INDEX "contactos_institucionais_municipioId_idx" ON "contactos_institucionais"("municipioId");

-- CreateIndex
CREATE INDEX "contactos_institucionais_tipo_idx" ON "contactos_institucionais"("tipo");

-- CreateIndex
CREATE INDEX "contactos_institucionais_visivelPublico_idx" ON "contactos_institucionais"("visivelPublico");

-- CreateIndex
CREATE INDEX "contactos_institucionais_direcaoId_idx" ON "contactos_institucionais"("direcaoId");

-- AddForeignKey
ALTER TABLE "centros_acolhimento" ADD CONSTRAINT "centros_acolhimento_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "direcoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_zonaSensivelId_fkey" FOREIGN KEY ("zonaSensivelId") REFERENCES "zonas_sensiveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos_sensiveis" ADD CONSTRAINT "casos_sensiveis_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acessos_casos_sensiveis" ADD CONSTRAINT "acessos_casos_sensiveis_casoSensivelId_fkey" FOREIGN KEY ("casoSensivelId") REFERENCES "casos_sensiveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_apoio" ADD CONSTRAINT "pedidos_apoio_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_apoio" ADD CONSTRAINT "pedidos_apoio_resolvidoPorId_fkey" FOREIGN KEY ("resolvidoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicoes_kits" ADD CONSTRAINT "distribuicoes_kits_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicoes_kits" ADD CONSTRAINT "distribuicoes_kits_centroAcolhimentoId_fkey" FOREIGN KEY ("centroAcolhimentoId") REFERENCES "centros_acolhimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicoes_kits" ADD CONSTRAINT "distribuicoes_kits_distribuidoPorId_fkey" FOREIGN KEY ("distribuidoPorId") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_programas" ADD CONSTRAINT "participantes_programas_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas_sociais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_programas" ADD CONSTRAINT "participantes_programas_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "beneficiarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bem" ADD CONSTRAINT "Bem_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BemFachada" ADD CONSTRAINT "BemFachada_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BemImagem" ADD CONSTRAINT "BemImagem_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BemHistorico" ADD CONSTRAINT "BemHistorico_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BemMovimento" ADD CONSTRAINT "BemMovimento_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BemRegularizacaoJuridica" ADD CONSTRAINT "BemRegularizacaoJuridica_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_stock" ADD CONSTRAINT "movimentos_stock_itemStockId_fkey" FOREIGN KEY ("itemStockId") REFERENCES "itens_stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes_programadas" ADD CONSTRAINT "manutencoes_programadas_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frota_operacional" ADD CONSTRAINT "frota_operacional_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcoes" ADD CONSTRAINT "direcoes_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicoes_logistica" ADD CONSTRAINT "requisicoes_logistica_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicoes_logistica" ADD CONSTRAINT "requisicoes_logistica_requerenteId_fkey" FOREIGN KEY ("requerenteId") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicao_itens" ADD CONSTRAINT "requisicao_itens_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "requisicoes_logistica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicao_anexos" ADD CONSTRAINT "requisicao_anexos_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "requisicoes_logistica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfis_permissoes" ADD CONSTRAINT "perfis_permissoes_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfis_permissoes" ADD CONSTRAINT "perfis_permissoes_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizador_perfis" ADD CONSTRAINT "utilizador_perfis_atribuidoPorId_fkey" FOREIGN KEY ("atribuidoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizador_perfis" ADD CONSTRAINT "utilizador_perfis_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizador_perfis" ADD CONSTRAINT "utilizador_perfis_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizadores" ADD CONSTRAINT "utilizadores_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizadores" ADD CONSTRAINT "utilizadores_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizadores" ADD CONSTRAINT "utilizadores_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilizadores" ADD CONSTRAINT "utilizadores_superiorId_fkey" FOREIGN KEY ("superiorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_validacao_identidade" ADD CONSTRAINT "pedidos_validacao_identidade_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_validacao_identidade" ADD CONSTRAINT "pedidos_validacao_identidade_perfilSolicitadoId_fkey" FOREIGN KEY ("perfilSolicitadoId") REFERENCES "perfis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_validacao_identidade" ADD CONSTRAINT "pedidos_validacao_identidade_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercambios" ADD CONSTRAINT "intercambios_direcaoOrigemId_fkey" FOREIGN KEY ("direcaoOrigemId") REFERENCES "direcoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercambios" ADD CONSTRAINT "intercambios_municipioDestinoId_fkey" FOREIGN KEY ("municipioDestinoId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_confirmation_tokens" ADD CONSTRAINT "email_confirmation_tokens_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastas" ADD CONSTRAINT "pastas_pastaPaiId_fkey" FOREIGN KEY ("pastaPaiId") REFERENCES "pastas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastas" ADD CONSTRAINT "pastas_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_pastaId_fkey" FOREIGN KEY ("pastaId") REFERENCES "pastas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas_legais" ADD CONSTRAINT "diplomas_legais_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_gepe" ADD CONSTRAINT "planos_gepe_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos" ADD CONSTRAINT "processos_genericos_direcaoAtualId_fkey" FOREIGN KEY ("direcaoAtualId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos" ADD CONSTRAINT "processos_genericos_direcaoDespachadaId_fkey" FOREIGN KEY ("direcaoDespachadaId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos" ADD CONSTRAINT "processos_genericos_direcaoOrigemId_fkey" FOREIGN KEY ("direcaoOrigemId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos" ADD CONSTRAINT "processos_genericos_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos" ADD CONSTRAINT "processos_genericos_requerenteUtilizadorId_fkey" FOREIGN KEY ("requerenteUtilizadorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos" ADD CONSTRAINT "processos_genericos_responsavelActualId_fkey" FOREIGN KEY ("responsavelActualId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscalizacao_detalhes" ADD CONSTRAINT "fiscalizacao_detalhes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos_genericos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos_transicoes" ADD CONSTRAINT "processos_genericos_transicoes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos_genericos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos_transicoes" ADD CONSTRAINT "processos_genericos_transicoes_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos_anexos" ADD CONSTRAINT "processos_genericos_anexos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos_genericos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos_anexos" ADD CONSTRAINT "processos_genericos_anexos_utilizadorUploadId_fkey" FOREIGN KEY ("utilizadorUploadId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos_genericos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_alteradoPorId_fkey" FOREIGN KEY ("alteradoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_direcaoResponsavelId_fkey" FOREIGN KEY ("direcaoResponsavelId") REFERENCES "direcoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_alteradoPorId_fkey" FOREIGN KEY ("alteradoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_documentos_exigidos" ADD CONSTRAINT "servico_documentos_exigidos_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_atendidoPorId_fkey" FOREIGN KEY ("atendidoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_processoGenericoId_fkey" FOREIGN KEY ("processoGenericoId") REFERENCES "processos_genericos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registos_ponto" ADD CONSTRAINT "registos_ponto_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habilitacao" ADD CONSTRAINT "Habilitacao_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "comissoes_moradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaMensagem" ADD CONSTRAINT "OcorrenciaMensagem_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaMensagem" ADD CONSTRAINT "OcorrenciaMensagem_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaAnexo" ADD CONSTRAINT "OcorrenciaAnexo_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_comissao" ADD CONSTRAINT "membros_comissao_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "comissoes_moradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoFerias" ADD CONSTRAINT "PedidoFerias_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaAntecipacao" ADD CONSTRAINT "OfertaAntecipacao_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos_publicos" ADD CONSTRAINT "conteudos_publicos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos_publicos" ADD CONSTRAINT "conteudos_publicos_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos_publicos" ADD CONSTRAINT "conteudos_publicos_publicadoPorId_fkey" FOREIGN KEY ("publicadoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_institucionais" ADD CONSTRAINT "contactos_institucionais_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_institucionais" ADD CONSTRAINT "contactos_institucionais_direcaoId_fkey" FOREIGN KEY ("direcaoId") REFERENCES "direcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_institucionais" ADD CONSTRAINT "contactos_institucionais_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
