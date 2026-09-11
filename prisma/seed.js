import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { DIRECOES_TEMPLATE, DEPARTAMENTOS_POR_DIRECAO } from "../src/config/organograma.js";
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
async function withMunicipio(municipioId, fn) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw `SELECT set_config('app.current_municipio_id', ${municipioId}, true)`;
        return fn(tx);
    }, { timeout: 45_000, maxWait: 10_000 });
}
const MUNICIPIOS_DATA = [
    { nome: "Viana", codigo: "AO-LUA-VIANA", provincia: "Luanda" },
    { nome: "Talatona", codigo: "AO-LUA-TALATONA", provincia: "Luanda" },
];
const PERFIS_DATA = [
    {
        nome: "SUPER_ADMIN",
        sistemico: true,
        descricao: "Administrador da Plataforma (técnico/sistema). Perfil SINGULAR: só pode existir UM utilizador com este perfil em todo o sistema (reforçado por índice único parcial — ver prisma/singleton_super_admin.sql — e por guarda em rbac.service.ts). É o único perfil que pode criar funcionários em qualquer município.",
    },
    { nome: "ADMINISTRADOR_MUNICIPAL", sistemico: true, descricao: "Administrador Municipal - despacho final, visão total, sem configuração global do sistema" },
    { nome: "ADMINISTRADOR_ADJUNTO_POLITICA", sistemico: true, descricao: "Administrador Adjunto - Área Política, Social e Comunidade" },
    { nome: "ADMINISTRADOR_ADJUNTO_ECONOMICA", sistemico: true, descricao: "Administrador Adjunto - Área Económica e Financeira" },
    { nome: "ADMINISTRADOR_ADJUNTO_TECNICA", sistemico: true, descricao: "Administrador Adjunto - Área Técnica, Infra-Estruturas e Serviços" },
    { nome: "SECRETARIO_GERAL", sistemico: true, descricao: "Secretário Geral - Expediente, Património, Logística/Protocolo, Receitas" },
    { nome: "DIRECTOR_GEPE", sistemico: true, descricao: "Director do GEPE - lançamento de receitas apenas em leitura" },
    { nome: "DIRECTOR_JURIDICO", sistemico: true, descricao: "Director do Gabinete Jurídico, Intercâmbio e Apoio às Comissões de Moradores" },
    { nome: "ASSESSOR_JURIDICO", sistemico: true, descricao: "Assessor Jurídico do Administrador Municipal (pessoal, distinto do Gabinete Jurídico)" },
    {
        nome: "DIRECTOR_RH",
        sistemico: true,
        descricao: "Director do Gabinete de Recursos Humanos - SEM permissão de criar utilizadores/perfis ou aceder a pareceres jurídicos (segregação de funções, secção 5.1)",
    },
    { nome: "DIRECTOR_COMUNICACAO_SOCIAL", sistemico: true, descricao: "Director do Gabinete de Comunicação Social" },
    { nome: "DIRECTOR_EDUCACAO", sistemico: true, descricao: "Director Municipal da Educação" },
    { nome: "DIRECTOR_SAUDE", sistemico: true, descricao: "Director Municipal da Saúde" },
    { nome: "DIRECTOR_DESENVOLVIMENTO_ECONOMICO", sistemico: true, descricao: "Director Municipal de Promoção Desenvolvimento Económico" },
    { nome: "DIRECTOR_AMBIENTE_SANEAMENTO", sistemico: true, descricao: "Director Municipal do Ambiente e Saneamento" },
    { nome: "DIRECTOR_TRANSPORTES", sistemico: true, descricao: "Director Municipal dos Transportes, Tráfego e Mobilidade" },
    { nome: "DIRECTOR_ACCAO_SOCIAL", sistemico: true, descricao: "Director Municipal de Ação Social" },
    { nome: "DIRECTOR_TURISMO_CULTURA", sistemico: true, descricao: "Director Municipal do Turismo e Cultura" },
    { nome: "DIRECTOR_TEMPOS_LIVRES", sistemico: true, descricao: "Director Municipal de Tempos Livres" },
    { nome: "DIRECTOR_ENERGIA_AGUAS", sistemico: true, descricao: "Director Municipal de Energia e Águas" },
    { nome: "DIRECTOR_INFRAESTRUTURAS", sistemico: true, descricao: "Director Municipal de Infra-Estruturas" },
    { nome: "DIRECTOR_AGRICULTURA", sistemico: true, descricao: "Director Municipal de Agricultura, Pecuária e Pescas" },
    { nome: "DIRECTOR_REGISTOS", sistemico: true, descricao: "Director Municipal dos Registos" },
    { nome: "DIRECTOR_FISCALIZACAO", sistemico: true, descricao: "Director Municipal de Fiscalização" },
    { nome: "CHEFE_DIRECÇÃO", sistemico: true, descricao: "Chefe de Direcção/Secção" },
    { nome: "FUNCIONARIO_INTERNO", sistemico: true, descricao: "Funcionário Interno" },
    { nome: "AUDITOR", sistemico: true, descricao: "Perfil só-leitura: consulta de logs e relatórios de auditoria, sem qualquer permissão de alteração" },
    { nome: "CIDADAO", sistemico: true, descricao: "Cidadão" },
    { nome: "EMPRESA", sistemico: true, descricao: "Empresa" },
    { nome: "INSTITUICAO", sistemico: true, descricao: "Instituição" },
    { nome: "COMISSAO_MORADORES", sistemico: true, descricao: "Comissão de Moradores" },
];
const PERFIS_CRITICOS = PERFIS_DATA.filter((p) => p.nome !== "SUPER_ADMIN" && !["CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES", "FUNCIONARIO_INTERNO"].includes(p.nome)).map((p) => p.nome);
const PERMISSOES_DATA = [
    { nome: "UTILIZADORES_CRIAR", recurso: "utilizadores", accao: "criar" },
    { nome: "UTILIZADORES_EDITAR", recurso: "utilizadores", accao: "editar" },
    { nome: "UTILIZADORES_DESACTIVAR", recurso: "utilizadores", accao: "desactivar" },
    { nome: "UTILIZADORES_ATRIBUIR_PERFIL", recurso: "utilizadores", accao: "atribuir_perfil" },
    { nome: "UTILIZADORES_REDEFINIR_PASSWORD", recurso: "utilizadores", accao: "redefinir_password" },
    { nome: "VALIDACAO_APROVAR_NIVEL_1", recurso: "validacao_identidade", accao: "aprovar_nivel_1" },
    { nome: "VALIDACAO_APROVAR_NIVEL_2", recurso: "validacao_identidade", accao: "aprovar_nivel_2" },
    { nome: "CRIAR_DOCUMENTO", recurso: "DOCUMENTOS", accao: "CREATE" },
    { nome: "EDITAR_DOCUMENTO", recurso: "DOCUMENTOS", accao: "UPDATE" },
    { nome: "ELIMINAR_DOCUMENTO", recurso: "DOCUMENTOS", accao: "DELETE" },
    { nome: "CONSULTAR_DOCUMENTO", recurso: "DOCUMENTOS", accao: "READ" },
    { nome: "APROVAR_DOCUMENTO", recurso: "DOCUMENTOS", accao: "APPROVE" },
    { nome: "CONSULTAR_LOGS_AUDITORIA", recurso: "AUDITORIA", accao: "READ" },
    { nome: "EXPORTAR_LOGS", recurso: "AUDITORIA", accao: "EXPORT" },
    { nome: "CONFIGURAR_SISTEMA", recurso: "SISTEMA", accao: "CONFIG" },
    { nome: "GERIR_DIREÇÕES", recurso: "DIREÇÕES", accao: "MANAGE" },
    { nome: "GERIR_PERFIS", recurso: "PERFIS", accao: "MANAGE" },
    { nome: "GERIR_ASSIDUIDADE", recurso: "RECURSOS_HUMANOS", accao: "MANAGE" },
    { nome: "EMITIR_PARECER_JURIDICO", recurso: "JURIDICO", accao: "CREATE" },
    { nome: "LANCAR_RECEITA", recurso: "RECEITAS", accao: "CREATE" },
    { nome: "CONSULTAR_RECEITA", recurso: "RECEITAS", accao: "READ" },
    { nome: "GERIR_INTERCAMBIO_INTERMUNICIPAL", recurso: "INTERCAMBIO", accao: "MANAGE" },
    { nome: "PROCESSOS_DESPACHAR", recurso: "processos", accao: "despachar" },
    { nome: "PROCESSOS_EXPEDIR", recurso: "processos", accao: "expedir" },
    { nome: "PROCESSOS_TRAMITAR_GABINETE", recurso: "processos", accao: "tramitar_gabinete" },
    { nome: "PROCESSOS_TRATAR", recurso: "processos", accao: "tratar" },
    { nome: "PROCESSOS_GENERICOS_CRIAR", recurso: "processos_genericos", accao: "criar" },
    { nome: "PROCESSOS_GENERICOS_CONSULTAR", recurso: "processos_genericos", accao: "consultar" },
    { nome: "PROCESSOS_GENERICOS_ANEXAR", recurso: "processos_genericos", accao: "anexar" },
    { nome: "PROCESSOS_GENERICOS_TRANSICIONAR", recurso: "processos_genericos", accao: "transicionar" },
    { nome: "PROCESSOS_GENERICOS_DESPACHO_FINAL", recurso: "processos_genericos", accao: "despacho_final" },
    { nome: "PROCESSOS_GENERICOS_SOLICITAR_PARECER", recurso: "processos_genericos", accao: "solicitar_parecer" },
    { nome: "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO", recurso: "processos_genericos", accao: "despachar_encaminhamento" },
    { nome: "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", recurso: "processos_genericos", accao: "tramitar_gabinete" },
    { nome: "PROCESSOS_GENERICOS_EXPEDIR", recurso: "processos_genericos", accao: "expedir" },
    { nome: "AGENDAMENTOS_CRIAR", recurso: "agendamentos", accao: "criar" },
    { nome: "AGENDAMENTOS_CONSULTAR", recurso: "agendamentos", accao: "consultar" },
    { nome: "AGENDAMENTOS_CONFIRMAR", recurso: "agendamentos", accao: "confirmar" },
    { nome: "AGENDAMENTOS_GERIR", recurso: "agendamentos", accao: "gerir" },
    { nome: "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", recurso: "processos_genericos", accao: "atribuir_responsavel" },
    { nome: "PROCESSOS_GENERICOS_VER_TODOS_GABINETE", recurso: "processos_genericos", accao: "ver_todos_gabinete" },
    { nome: "PAGAMENTOS_GERAR_RUPE", recurso: "pagamentos", accao: "gerar_rupe" },
    { nome: "PAGAMENTOS_CONSULTAR", recurso: "pagamentos", accao: "consultar" },
    { nome: "PAGAMENTOS_CONFIRMAR", recurso: "pagamentos", accao: "confirmar" },
    { nome: "PAGAMENTOS_GERIR", recurso: "pagamentos", accao: "gerir" },
    { nome: "PROCESSOS_GENERICOS_ARQUIVAR_DIGITAL", recurso: "processos_genericos", accao: "arquivar_digital" },
    { nome: "ARQUIVO_MORTO_ACEDER", recurso: "arquivo_morto", accao: "aceder" },
    { nome: "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", recurso: "portal_municipe", accao: "consultar_processo" },
    { nome: "NOTIFICACOES_CONSULTAR", recurso: "notificacoes", accao: "consultar" },
    { nome: "NOTIFICACOES_GERIR", recurso: "notificacoes", accao: "gerir" },
    { nome: "CONTEUDO_PUBLICO_GERIR", recurso: "conteudo_publico", accao: "gerir" },
    { nome: "CONTEUDO_PUBLICO_CONSULTAR", recurso: "conteudo_publico", accao: "consultar" },
    { nome: "CONTACTOS_INSTITUCIONAIS_GERIR", recurso: "contactos_institucionais", accao: "gerir" },
    { nome: "CONTACTOS_INSTITUCIONAIS_CONSULTAR", recurso: "contactos_institucionais", accao: "consultar" },
    { nome: "INTERCAMBIOS_ENVIAR", recurso: "intercambios", accao: "enviar" },
    { nome: "INTERCAMBIOS_CONSULTAR", recurso: "intercambios", accao: "consultar" },
    { nome: "INTERCAMBIOS_CONFIRMAR", recurso: "intercambios", accao: "confirmar" },
];
const PERFIL_PERMISSOES_MAP = {
    SUPER_ADMIN: [
        "UTILIZADORES_CRIAR",
        "UTILIZADORES_EDITAR",
        "UTILIZADORES_DESACTIVAR",
        "UTILIZADORES_ATRIBUIR_PERFIL",
        "UTILIZADORES_REDEFINIR_PASSWORD",
        "VALIDACAO_APROVAR_NIVEL_1",
        "VALIDACAO_APROVAR_NIVEL_2",
        "CONFIGURAR_SISTEMA",
        "GERIR_DIREÇÕES",
        "GERIR_PERFIS",
        "CONSULTAR_LOGS_AUDITORIA",
        "EXPORTAR_LOGS",
        "CRIAR_DOCUMENTO",
        "EDITAR_DOCUMENTO",
        "ELIMINAR_DOCUMENTO",
        "CONSULTAR_DOCUMENTO",
        "APROVAR_DOCUMENTO",
        "GERIR_ASSIDUIDADE",
        "EMITIR_PARECER_JURIDICO",
        "LANCAR_RECEITA",
        "CONSULTAR_RECEITA",
        "PROCESSOS_DESPACHAR",
        "PROCESSOS_EXPEDIR",
        "PROCESSOS_GENERICOS_CRIAR",
        "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR",
        "PROCESSOS_GENERICOS_TRANSICIONAR",
        "PROCESSOS_GENERICOS_DESPACHO_FINAL",
        "PROCESSOS_GENERICOS_ARQUIVAR_DIGITAL",
        "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL",
        "PROCESSOS_GENERICOS_SOLICITAR_PARECER",
        "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO",
        "PAGAMENTOS_GERAR_RUPE",
        "PAGAMENTOS_CONSULTAR",
        "ARQUIVO_MORTO_ACEDER",
        "INTERCAMBIOS_ENVIAR",
        "INTERCAMBIOS_CONSULTAR",
        "INTERCAMBIOS_CONFIRMAR",
        "PROCESSOS_TRAMITAR_GABINETE",
        "PROCESSOS_TRATAR",
        "PROCESSOS_GENERICOS_TRAMITAR_GABINETE",
        "PROCESSOS_GENERICOS_EXPEDIR",
        "AGENDAMENTOS_CRIAR",
        "AGENDAMENTOS_CONSULTAR",
        "AGENDAMENTOS_CONFIRMAR",
        "AGENDAMENTOS_GERIR",
    ],
    ADMINISTRADOR_MUNICIPAL: [
        "UTILIZADORES_CRIAR",
        "UTILIZADORES_EDITAR",
        "UTILIZADORES_DESACTIVAR",
        "UTILIZADORES_ATRIBUIR_PERFIL",
        "UTILIZADORES_REDEFINIR_PASSWORD",
        "VALIDACAO_APROVAR_NIVEL_1",
        "VALIDACAO_APROVAR_NIVEL_2",
        "CONSULTAR_DOCUMENTO",
        "APROVAR_DOCUMENTO",
        "CONSULTAR_LOGS_AUDITORIA",
        "EXPORTAR_LOGS",
        "CONSULTAR_RECEITA",
        "PROCESSOS_DESPACHAR",
        "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR",
        "PROCESSOS_GENERICOS_TRANSICIONAR",
        "PROCESSOS_GENERICOS_DESPACHO_FINAL",
        "PROCESSOS_GENERICOS_ARQUIVAR_DIGITAL",
        "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL",
        "PROCESSOS_GENERICOS_SOLICITAR_PARECER",
        "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO",
        "PAGAMENTOS_GERAR_RUPE",
        "PAGAMENTOS_CONSULTAR",
        "ARQUIVO_MORTO_ACEDER",
        "INTERCAMBIOS_ENVIAR",
        "INTERCAMBIOS_CONSULTAR",
        "INTERCAMBIOS_CONFIRMAR",
        "PROCESSOS_TRAMITAR_GABINETE",
        "PROCESSOS_TRATAR",
        "PROCESSOS_GENERICOS_TRAMITAR_GABINETE",
        "PROCESSOS_GENERICOS_EXPEDIR",
        "AGENDAMENTOS_CRIAR",
        "AGENDAMENTOS_CONSULTAR",
        "AGENDAMENTOS_CONFIRMAR",
        "AGENDAMENTOS_GERIR",
    ],
    ADMINISTRADOR_ADJUNTO_POLITICA: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_DESPACHO_FINAL", "INTERCAMBIOS_ENVIAR", "INTERCAMBIOS_CONSULTAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
    ADMINISTRADOR_ADJUNTO_ECONOMICA: ["CONSULTAR_DOCUMENTO", "CONSULTAR_RECEITA", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_DESPACHO_FINAL", "INTERCAMBIOS_ENVIAR", "INTERCAMBIOS_CONSULTAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
    ADMINISTRADOR_ADJUNTO_TECNICA: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_DESPACHO_FINAL", "INTERCAMBIOS_ENVIAR", "INTERCAMBIOS_CONSULTAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
    SECRETARIO_GERAL: [
        "LANCAR_RECEITA",
        "CONSULTAR_RECEITA",
        "CRIAR_DOCUMENTO",
        "EDITAR_DOCUMENTO",
        "CONSULTAR_DOCUMENTO",
        "PROCESSOS_EXPEDIR",
        "PROCESSOS_GENERICOS_CRIAR",
        "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR",
        "PROCESSOS_GENERICOS_TRANSICIONAR",
        "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL",
        "PAGAMENTOS_GERAR_RUPE",
        "PAGAMENTOS_CONSULTAR",
        "INTERCAMBIOS_CONSULTAR",
        "INTERCAMBIOS_CONFIRMAR",
        "PROCESSOS_TRATAR",
        "PROCESSOS_GENERICOS_EXPEDIR",
    ],
    DIRECTOR_GEPE: ["CONSULTAR_RECEITA", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_JURIDICO: [
        "EMITIR_PARECER_JURIDICO",
        "CRIAR_DOCUMENTO",
        "EDITAR_DOCUMENTO",
        "CONSULTAR_DOCUMENTO",
        "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR",
        "PROCESSOS_GENERICOS_TRANSICIONAR",
        "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL",
        "PROCESSOS_TRATAR",
        "INTERCAMBIOS_CONSULTAR",
        "INTERCAMBIOS_CONFIRMAR",
    ],
    ASSESSOR_JURIDICO: [
        "EMITIR_PARECER_JURIDICO",
        "CONSULTAR_DOCUMENTO",
        "PROCESSOS_GENERICOS_CONSULTAR",
        "PROCESSOS_GENERICOS_ANEXAR",
        "PROCESSOS_GENERICOS_TRANSICIONAR",
    ],
    DIRECTOR_RH: ["GERIR_ASSIDUIDADE", "UTILIZADORES_EDITAR", "UTILIZADORES_REDEFINIR_PASSWORD", "VALIDACAO_APROVAR_NIVEL_1", "CONSULTAR_DOCUMENTO"],
    DIRECTOR_COMUNICACAO_SOCIAL: ["CRIAR_DOCUMENTO", "CONSULTAR_DOCUMENTO"],
    AUDITOR: ["CONSULTAR_LOGS_AUDITORIA", "EXPORTAR_LOGS", "CONSULTAR_DOCUMENTO", "ARQUIVO_MORTO_ACEDER"],
    DIRECTOR_EDUCACAO: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_SAUDE: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_DESENVOLVIMENTO_ECONOMICO: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_AMBIENTE_SANEAMENTO: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_TRANSPORTES: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_ACCAO_SOCIAL: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
    DIRECTOR_TURISMO_CULTURA: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_TEMPOS_LIVRES: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_ENERGIA_AGUAS: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_INFRAESTRUTURAS: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_AGRICULTURA: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_REGISTOS: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    DIRECTOR_FISCALIZACAO: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
    "CHEFE_DIRECÇÃO": ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
    FUNCIONARIO_INTERNO: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
    CIDADAO: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
    EMPRESA: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
    INSTITUICAO: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
    COMISSAO_MORADORES: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
};
PERFIL_PERMISSOES_MAP.SUPER_ADMIN.push("CONTEUDO_PUBLICO_GERIR", "CONTEUDO_PUBLICO_CONSULTAR", "CONTACTOS_INSTITUCIONAIS_GERIR", "CONTACTOS_INSTITUCIONAIS_CONSULTAR");
PERFIL_PERMISSOES_MAP.ADMINISTRADOR_MUNICIPAL.push("CONTEUDO_PUBLICO_GERIR", "CONTEUDO_PUBLICO_CONSULTAR", "CONTACTOS_INSTITUCIONAIS_GERIR", "CONTACTOS_INSTITUCIONAIS_CONSULTAR");
PERFIL_PERMISSOES_MAP.DIRECTOR_COMUNICACAO_SOCIAL.push("CONTEUDO_PUBLICO_GERIR", "CONTEUDO_PUBLICO_CONSULTAR", "CONTACTOS_INSTITUCIONAIS_GERIR", "CONTACTOS_INSTITUCIONAIS_CONSULTAR");
PERFIL_PERMISSOES_MAP.SECRETARIO_GERAL.push("CONTACTOS_INSTITUCIONAIS_GERIR", "CONTACTOS_INSTITUCIONAIS_CONSULTAR");
for (const permissoes of Object.values(PERFIL_PERMISSOES_MAP)) {
    if (permissoes.includes("PAGAMENTOS_GERAR_RUPE")) {
        permissoes.push("PAGAMENTOS_CONFIRMAR", "PAGAMENTOS_GERIR");
    }
}
for (const [perfilNome, permissoes] of Object.entries(PERFIL_PERMISSOES_MAP)) {
    const chefiaGabinete = perfilNome === "SUPER_ADMIN" ||
        perfilNome === "ADMINISTRADOR_MUNICIPAL" ||
        perfilNome.startsWith("ADMINISTRADOR_ADJUNTO_") ||
        perfilNome.startsWith("DIRECTOR_") ||
        perfilNome === "CHEFE_DIRECÇÃO";
    if (chefiaGabinete) {
        permissoes.push("PROCESSOS_GENERICOS_VER_TODOS_GABINETE");
    }
}
for (const permissoes of Object.values(PERFIL_PERMISSOES_MAP)) {
    permissoes.push("NOTIFICACOES_CONSULTAR", "NOTIFICACOES_GERIR");
}
async function main() {
    try {
        console.log("Iniciando seed da base de dados...\n");
        console.log(" Criando Municípios...");
        const municipiosCriados = [];
        for (const m of MUNICIPIOS_DATA) {
            const municipio = await prisma.municipio.upsert({
                where: { codigo: m.codigo },
                update: m,
                create: { id: `mun_${m.codigo.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, ...m },
            });
            municipiosCriados.push(municipio);
            console.log(`   ${municipio.nome} (${municipio.codigo})`);
        }
        console.log("\nCriando Unidades Orgânicas e Departamentos por município...");
        for (const municipio of municipiosCriados) {
            await withMunicipio(municipio.id, async (tx) => {
                for (const direcaoData of DIRECOES_TEMPLATE) {
                    const { permiteIntercambioInterMunicipal, ...resto } = direcaoData;
                    const direcao = await tx.direcao.upsert({
                        where: { municipioId_sigla: { municipioId: municipio.id, sigla: resto.sigla } },
                        update: { ...resto, permiteIntercambioInterMunicipal: permiteIntercambioInterMunicipal ?? false },
                        create: {
                            id: `dir_${municipio.codigo.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${resto.sigla.toLowerCase()}`,
                            municipioId: municipio.id,
                            ...resto,
                            permiteIntercambioInterMunicipal: permiteIntercambioInterMunicipal ?? false,
                        },
                    });
                    console.log(`  [${municipio.nome}] [${direcao.tipo}] ${direcao.nome} (${direcao.sigla})`);
                    const departamentosPadrao = DEPARTAMENTOS_POR_DIRECAO[resto.sigla];
                    if (departamentosPadrao) {
                        for (const nomeDepartamento of departamentosPadrao) {
                            await tx.departamento.upsert({
                                where: { direcaoId_nome: { direcaoId: direcao.id, nome: nomeDepartamento } },
                                update: {},
                                create: { direcaoId: direcao.id, nome: nomeDepartamento },
                            });
                        }
                        console.log(`      \u2514\u2500 ${departamentosPadrao.length} departamentos`);
                    }
                }
            });
        }
        console.log("\nCriando Perfis...");
        const perfisCriados = [];
        for (const perfilData of PERFIS_DATA) {
            const perfil = await prisma.perfil.upsert({
                where: { nome: perfilData.nome },
                update: perfilData,
                create: { id: `perfil_${perfilData.nome.toLowerCase()}`, ...perfilData },
            });
            perfisCriados.push(perfil);
            console.log(`   ${perfil.nome}`);
        }
        console.log("\nCriando Permissões...");
        const permissoesCriadas = [];
        for (const permData of PERMISSOES_DATA) {
            const { nome, ...dadosPermissao } = permData;
            const chave = `${dadosPermissao.recurso}:${dadosPermissao.accao}`;
            const perm = await prisma.permissao.upsert({
                where: { chave },
                update: dadosPermissao,
                create: { id: `perm_${nome.toLowerCase()}`, chave, ...dadosPermissao },
            });
            permissoesCriadas.push({ nome, id: perm.id, chave: perm.chave });
            console.log(`  ${nome}`);
        }
        console.log("\n Atribuindo permissões aos perfis (com segregação de funções)...");
        let vinculosCriados = 0;
        for (const [perfilNome, permissoesNomes] of Object.entries(PERFIL_PERMISSOES_MAP)) {
            const perfil = perfisCriados.find((p) => p.nome === perfilNome);
            if (!perfil) {
                console.warn(`   Perfil ${perfilNome} não encontrado - a saltar.`);
                continue;
            }
            for (const permNome of permissoesNomes) {
                const perm = permissoesCriadas.find((p) => p.nome === permNome);
                if (!perm) {
                    console.warn(`  Permissão ${permNome} não encontrada - a saltar.`);
                    continue;
                }
                await prisma.perfilPermissao.upsert({
                    where: { perfilId_permissaoId: { perfilId: perfil.id, permissaoId: perm.id } },
                    update: {},
                    create: { id: `pp_${perfil.nome.toLowerCase()}_${perm.nome.toLowerCase()}`, perfilId: perfil.id, permissaoId: perm.id },
                });
                vinculosCriados++;
            }
            console.log(`   ${perfilNome}: ${permissoesNomes.length} permissões`);
        }
        console.log("\n Verificando SUPER_ADMIN...");
        const perfilSuperAdmin = perfisCriados.find((p) => p.nome === "SUPER_ADMIN");
        const municipioSede = municipiosCriados[0];
        await withMunicipio(municipioSede.id, async (tx) => {
            const superAdminExistente = await tx.utilizadorPerfil.findFirst({
                where: { perfilId: perfilSuperAdmin.id },
            });
            if (superAdminExistente) {
                console.log("   Já existe um SUPER_ADMIN — a saltar bootstrap (perfil é singular).");
                return;
            }
            const email = process.env.SEED_SUPER_ADMIN_EMAIL;
            const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
            if (!email || !password) {
                console.warn("   SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD não definidas no .env — a saltar criação do SUPER_ADMIN. Define-as e corre o seed novamente.");
                return;
            }
            const passwordHash = await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 1,
            });
            const superAdmin = await tx.utilizador.create({
                data: {
                    municipioId: municipioSede.id,
                    nomeCompleto: "Administrador da Plataforma",
                    email,
                    passwordHash,
                    tipoConta: "INTERNO",
                    estado: "ACTIVA",
                    emailConfirmado: true,
                },
            });
            await tx.utilizadorPerfil.create({
                data: { utilizadorId: superAdmin.id, perfilId: perfilSuperAdmin.id },
            });
            console.log(`  SUPER_ADMIN criado: ${email} (muda a password no primeiro login)`);
        });
        console.log("\n Seed completada com sucesso!");
        console.log(`   - ${municipiosCriados.length} Municípios`);
        console.log(`   - ${DIRECOES_TEMPLATE.length} Unidades Orgânicas × ${municipiosCriados.length} municípios`);
        console.log(`   - ${perfisCriados.length} Perfis`);
        console.log(`   - ${permissoesCriadas.length} Permissões`);
        console.log(`   - ${vinculosCriados} vínculos Perfil-Permissão`);
    }
    catch (error) {
        console.error("Erro ao executar seed:", error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=seed.js.map