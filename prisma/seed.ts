import "dotenv/config";
import argon2 from "argon2";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type Perfil,
  type Municipio,
} from "../src/generated/prisma/client.js";
import { DIRECOES_TEMPLATE, DEPARTAMENTOS_POR_DIRECAO } from "../src/config/organograma.js";
import { CATALOGO_SERVICOS_MUNICIPAIS } from "../src/config/catalogo-servicos.js";

const sslActivo = process.env.DATABASE_SSL !== undefined
  ? process.env.DATABASE_SSL === "true"
  : process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
  ssl: sslActivo ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  console.log("PostgreSQL: conexão estabelecida");
});
pool.on("acquire", () => {
  console.log("PostgreSQL: conexão adquirida");
});

pool.on("remove", () => {
  console.log("PostgreSQL: conexão removida do pool");
});

pool.on("error", (err) => {
  console.error("PostgreSQL Pool:", err);
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});
async function withMunicipio<T>(municipioId: string, fn: (tx: any) => Promise<T>, tentativas = 3): Promise<T> {
  for (let i = 1; i <= tentativas; i++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_municipio_id', ${municipioId}, true)`;
          return fn(tx);
        },
        { timeout: 300_000, maxWait: 30_000 }
      );
    } catch (err: any) {
      const transitorio = /Connection terminated|ECONNRESET|ETIMEDOUT/.test(String(err?.message));
      if (!transitorio || i === tentativas) throw err;
      console.warn(` Ligação caiu (tentativa ${i}/${tentativas}), a repetir...`);
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  throw new Error("unreachable");
}

const MUNICIPIOS_DATA = [
  { nome: "Viana", codigo: "AO-LUA-VIANA", provincia: "Luanda" },
  { nome: "Talatona", codigo: "AO-LUA-TALATONA", provincia: "Luanda" },
];

const PERFIS_DATA = [
  {
    nome: "SUPER_ADMIN",
    sistemico: true,
    descricao:
      "Administrador da Plataforma (técnico/sistema). Perfil SINGULAR: só pode existir UM utilizador com este perfil em todo o sistema (reforçado por índice único parcial — ver prisma/singleton_super_admin.sql — e por guarda em rbac.service.ts). É o único perfil que pode criar funcionários em qualquer município.",
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
    descricao:
      "Director do Gabinete de Recursos Humanos - SEM permissão de criar utilizadores/perfis ou aceder a pareceres jurídicos (segregação de funções, secção 5.1)",
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
  // Utilizadores
  {
    nome: "UTILIZADORES_CRIAR",
    recurso: "utilizadores",
    accao: "criar",
  },
  {
    nome: "UTILIZADORES_EDITAR",
    recurso: "utilizadores",
    accao: "editar",
  },
  {
    nome: "UTILIZADORES_DESACTIVAR",
    recurso: "utilizadores",
    accao: "desactivar",
  },
  {
    nome: "UTILIZADORES_ATRIBUIR_PERFIL",
    recurso: "utilizadores",
    accao: "atribuir_perfil",
  },
  {
    nome: "UTILIZADORES_REDEFINIR_PASSWORD",
    recurso: "utilizadores",
    accao: "redefinir_password",
  },

  // Validação de identidade
  {
    nome: "VALIDACAO_APROVAR_NIVEL_1",
    recurso: "validacao_identidade",
    accao: "aprovar_nivel_1",
  },
  {
    nome: "VALIDACAO_APROVAR_NIVEL_2",
    recurso: "validacao_identidade",
    accao: "aprovar_nivel_2",
  },

  // Documentos
  {
    nome: "CRIAR_DOCUMENTO",
    recurso: "documentos",
    accao: "criar",
  },
  {
    nome: "EDITAR_DOCUMENTO",
    recurso: "documentos",
    accao: "editar",
  },
  {
    nome: "ELIMINAR_DOCUMENTO",
    recurso: "documentos",
    accao: "eliminar",
  },
  {
    nome: "CONSULTAR_DOCUMENTO",
    recurso: "documentos",
    accao: "consultar",
  },
  {
    nome: "APROVAR_DOCUMENTO",
    recurso: "documentos",
    accao: "aprovar",
  },

  // Auditoria
  {
    nome: "CONSULTAR_LOGS_AUDITORIA",
    recurso: "auditoria",
    accao: "consultar",
  },
  {
    nome: "EXPORTAR_LOGS",
    recurso: "auditoria",
    accao: "exportar",
  },

  // Sistema
  {
    nome: "CONFIGURAR_SISTEMA",
    recurso: "sistema",
    accao: "configurar",
  },

  // Direções
  {
    nome: "GERIR_DIREÇÕES",
    recurso: "direcoes",
    accao: "gerir",
  },

  // Perfis
  {
    nome: "GERIR_PERFIS",
    recurso: "perfis",
    accao: "gerir",
  },

  // Recursos Humanos
  {
    nome: "GERIR_ASSIDUIDADE",
    recurso: "recursos_humanos",
    accao: "gerir",
  },

  // Jurídico
  {
    nome: "EMITIR_PARECER_JURIDICO",
    recurso: "juridico",
    accao: "criar",
  },
  {
    nome: "BIBLIOTECA_JURIDICA_CONSULTAR",
    recurso: "juridico",
    accao: "consultar",
  },
  {
    nome: "BIBLIOTECA_JURIDICA_GERIR",
    recurso: "juridico",
    accao: "editar",
  },

  // GEPE
  {
    nome: "GEPE_CONSULTAR",
    recurso: "gepe",
    accao: "consultar",
  },
  {
    nome: "GEPE_GERIR",
    recurso: "gepe",
    accao: "criar",
  },
  {
    nome: "GEPE_APROVAR_PLANO",
    recurso: "gepe",
    accao: "aprovar",
  },

  // Receitas
  {
    nome: "LANCAR_RECEITA",
    recurso: "receitas",
    accao: "criar",
  },
  {
    nome: "CONSULTAR_RECEITA",
    recurso: "receitas",
    accao: "consultar",
  },

  // Serviços
  {
    nome: "CATALOGO_SERVICOS_GERIR",
    recurso: "servicos",
    accao: "gerir",
  },
  {
    nome: "CATALOGO_SERVICOS_CONSULTAR",
    recurso: "servicos",
    accao: "consultar",
  },

  // Intercâmbio intermunicipal
  {
    nome: "GERIR_INTERCAMBIO_INTERMUNICIPAL",
    recurso: "intercambio",
    accao: "gerir",
  },

  // Processos
  {
    nome: "PROCESSOS_DESPACHAR",
    recurso: "processos",
    accao: "despachar",
  },
  {
    nome: "PROCESSOS_EXPEDIR",
    recurso: "processos",
    accao: "expedir",
  },
  {
    nome: "PROCESSOS_TRAMITAR_GABINETE",
    recurso: "processos",
    accao: "tramitar_gabinete",
  },
  {
    nome: "PROCESSOS_TRATAR",
    recurso: "processos",
    accao: "tratar",
  },

  // Processos genéricos
  {
    nome: "PROCESSOS_GENERICOS_CRIAR",
    recurso: "processos_genericos",
    accao: "criar",
  },
  {
    nome: "PROCESSOS_GENERICOS_CONSULTAR",
    recurso: "processos_genericos",
    accao: "consultar",
  },
  {
    nome: "PROCESSOS_GENERICOS_ANEXAR",
    recurso: "processos_genericos",
    accao: "anexar",
  },
  {
    nome: "PROCESSOS_GENERICOS_TRANSICIONAR",
    recurso: "processos_genericos",
    accao: "transicionar",
  },
  {
    nome: "PROCESSOS_GENERICOS_DESPACHO_FINAL",
    recurso: "processos_genericos",
    accao: "despacho_final",
  },
  {
    nome: "PROCESSOS_GENERICOS_APRESENTAR_ADMINISTRADOR",
    recurso: "processos_genericos",
    accao: "apresentar_administrador",
  },
  {
    nome: "PROCESSOS_GENERICOS_SOLICITAR_PARECER",
    recurso: "processos_genericos",
    accao: "solicitar_parecer",
  },
  {
    nome: "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO",
    recurso: "processos_genericos",
    accao: "despachar_encaminhamento",
  },
  {
    nome: "PROCESSOS_GENERICOS_TRAMITAR_GABINETE",
    recurso: "processos_genericos",
    accao: "tramitar_gabinete",
  },
  {
    nome: "PROCESSOS_GENERICOS_EXPEDIR",
    recurso: "processos_genericos",
    accao: "expedir",
  },
  {
    nome: "PROCESSOS_GENERICOS_VER_TODOS_GABINETE",
    recurso: "processos_genericos",
    accao: "ver_todos_gabinete",
  },
  {
    nome: "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL",
    recurso: "processos_genericos",
    accao: "atribuir_responsavel",
  },
  {
    nome: "PROCESSOS_GENERICOS_ARQUIVAR_DIGITAL",
    recurso: "processos_genericos",
    accao: "arquivar_digital",
  },

  // Manutenção
  {
    nome: "MANUTENCAO_CONSULTAR",
    recurso: "manutencao",
    accao: "consultar",
  },
  {
    nome: "MANUTENCAO_GERIR",
    recurso: "manutencao",
    accao: "gerir",
  },

  // Férias
  {
    nome: "FERIAS_APROVAR",
    recurso: "ferias",
    accao: "aprovar",
  },

  // Funcionários
  {
    nome: "FUNCIONARIOS_CONSULTAR",
    recurso: "funcionarios",
    accao: "consultar",
  },
  {
    nome: "FUNCIONARIOS_GERIR",
    recurso: "funcionarios",
    accao: "gerir",
  },

  // Serviços contínuos
  {
    nome: "SERVICOS_CONTINUOS_CONSULTAR",
    recurso: "servicos_continuos",
    accao: "consultar",
  },
  {
    nome: "SERVICOS_CONTINUOS_GERIR",
    recurso: "servicos_continuos",
    accao: "gerir",
  },

  // Stock
  {
    nome: "STOCK_CONSULTAR",
    recurso: "stock",
    accao: "consultar",
  },
  {
    nome: "STOCK_GERIR",
    recurso: "stock",
    accao: "gerir",
  },

  // Ocorrências
  {
    nome: "OCORRENCIAS_CRIAR",
    recurso: "ocorrencias",
    accao: "criar",
  },
  {
    nome: "OCORRENCIAS_CONSULTAR",
    recurso: "ocorrencias",
    accao: "consultar",
  },
  {
    nome: "OCORRENCIAS_GERIR",
    recurso: "ocorrencias",
    accao: "gerir",
  },

  // Património
  {
    nome: "PATRIMONIO_CONSULTAR",
    recurso: "patrimonio",
    accao: "consultar",
  },
  {
    nome: "PATRIMONIO_GERIR",
    recurso: "patrimonio",
    accao: "gerir",
  },
  {
    nome: "PATRIMONIO_JURIDICO",
    recurso: "patrimonio",
    accao: "juridico",
  },

  // Frota
  {
    nome: "FROTA_CONSULTAR",
    recurso: "frota",
    accao: "consultar",
  },
  {
    nome: "FROTA_GERIR",
    recurso: "frota",
    accao: "gerir",
  },

  // Logística
  {
    nome: "LOGISTICA_CONSULTAR",
    recurso: "logistica",
    accao: "consultar",
  },
  {
    nome: "LOGISTICA_GERIR",
    recurso: "logistica",
    accao: "gerir",
  },
  {
    nome: "LOGISTICA_APROVAR",
    recurso: "logistica",
    accao: "aprovar",
  },

  // Agendamentos
  {
    nome: "AGENDAMENTOS_CRIAR",
    recurso: "agendamentos",
    accao: "criar",
  },
  {
    nome: "AGENDAMENTOS_CONSULTAR",
    recurso: "agendamentos",
    accao: "consultar",
  },
  {
    nome: "AGENDAMENTOS_CONFIRMAR",
    recurso: "agendamentos",
    accao: "confirmar",
  },
  {
    nome: "AGENDAMENTOS_GERIR",
    recurso: "agendamentos",
    accao: "gerir",
  },

  // Pagamentos
  {
    nome: "PAGAMENTOS_GERAR_RUPE",
    recurso: "pagamentos",
    accao: "gerar_rupe",
  },
  {
    nome: "PAGAMENTOS_CONSULTAR",
    recurso: "pagamentos",
    accao: "consultar",
  },
  {
    nome: "PAGAMENTOS_CONFIRMAR",
    recurso: "pagamentos",
    accao: "confirmar",
  },
  {
    nome: "PAGAMENTOS_GERIR",
    recurso: "pagamentos",
    accao: "gerir",
  },

  // Arquivo morto
  {
    nome: "ARQUIVO_MORTO_ACEDER",
    recurso: "arquivo_morto",
    accao: "aceder",
  },

  // Portal do munícipe
  {
    nome: "PORTAL_MUNICIPE_CONSULTAR_PROCESSO",
    recurso: "portal_municipe",
    accao: "consultar_processo",
  },

  // Notificações
  {
    nome: "NOTIFICACOES_CONSULTAR",
    recurso: "notificacoes",
    accao: "consultar",
  },
  {
    nome: "NOTIFICACOES_GERIR",
    recurso: "notificacoes",
    accao: "gerir",
  },

  // Conteúdo público
  {
    nome: "CONTEUDO_PUBLICO_GERIR",
    recurso: "conteudo_publico",
    accao: "gerir",
  },
  {
    nome: "CONTEUDO_PUBLICO_CONSULTAR",
    recurso: "conteudo_publico",
    accao: "consultar",
  },

  // Contactos institucionais
  {
    nome: "CONTACTOS_INSTITUCIONAIS_GERIR",
    recurso: "contactos_institucionais",
    accao: "gerir",
  },
  {
    nome: "CONTACTOS_INSTITUCIONAIS_CONSULTAR",
    recurso: "contactos_institucionais",
    accao: "consultar",
  },

  // Intercâmbios
  {
    nome: "INTERCAMBIOS_ENVIAR",
    recurso: "intercambios",
    accao: "enviar",
  },
  {
    nome: "INTERCAMBIOS_CONSULTAR",
    recurso: "intercambios",
    accao: "consultar",
  },
  {
    nome: "INTERCAMBIOS_CONFIRMAR",
    recurso: "intercambios",
    accao: "confirmar",
  },

  // Comissões de moradores
  {
    nome: "COMISSOES_MORADORES_CONSULTAR",
    recurso: "comissoes_moradores",
    accao: "consultar",
  },
  {
    nome: "COMISSOES_MORADORES_GERIR",
    recurso: "comissoes_moradores",
    accao: "gerir",
  },

  // Fiscalização
  {
    nome: "FISCALIZACAO_CONSULTAR",
    recurso: "fiscalizacao",
    accao: "consultar",
  },
  {
    nome: "FISCALIZACAO_GERIR",
    recurso: "fiscalizacao",
    accao: "gerir",
  },
  {
    nome: "FISCALIZACAO_APLICAR_COIMA",
    recurso: "fiscalizacao",
    accao: "aplicar_coima",
  },
] 

const PERFIL_PERMISSOES_MAP: Record<string, string[]> = {
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
    "CATALOGO_SERVICOS_GERIR",
    "CATALOGO_SERVICOS_CONSULTAR",
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
    "COMISSOES_MORADORES_CONSULTAR",
    "COMISSOES_MORADORES_GERIR",
    "FISCALIZACAO_CONSULTAR",
    "FISCALIZACAO_GERIR",
    "FISCALIZACAO_APLICAR_COIMA",
    "BIBLIOTECA_JURIDICA_CONSULTAR",
    "BIBLIOTECA_JURIDICA_GERIR",
    "GEPE_CONSULTAR",
    "GEPE_GERIR",
    "GEPE_APROVAR_PLANO",
    "CONSULTAR_RECEITA",
    "CATALOGO_SERVICOS_GERIR",
    "CATALOGO_SERVICOS_CONSULTAR",
    "PROCESSOS_DESPACHAR",
    "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR",
    "PROCESSOS_GENERICOS_DESPACHO_FINAL",
    "PROCESSOS_GENERICOS_ARQUIVAR_DIGITAL",
    "PROCESSOS_GENERICOS_SOLICITAR_PARECER",
    "PROCESSOS_GENERICOS_TRANSICIONAR",
    "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO",
    "PROCESSOS_GENERICOS_TRAMITAR_GABINETE",
    "PROCESSOS_GENERICOS_VER_TODOS_GABINETE",
    "PAGAMENTOS_GERAR_RUPE",
    "PAGAMENTOS_CONSULTAR",
    "ARQUIVO_MORTO_ACEDER",
    "INTERCAMBIOS_ENVIAR",
    "INTERCAMBIOS_CONSULTAR",
    "INTERCAMBIOS_CONFIRMAR",
    "PROCESSOS_TRATAR",

    "AGENDAMENTOS_CRIAR",
    "AGENDAMENTOS_CONSULTAR",
    "AGENDAMENTOS_CONFIRMAR",
    "AGENDAMENTOS_GERIR",
    "LOGISTICA_APROVAR"
  ],

  ADMINISTRADOR_ADJUNTO_POLITICA: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_DESPACHO_FINAL", "INTERCAMBIOS_ENVIAR", "INTERCAMBIOS_CONSULTAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
  ADMINISTRADOR_ADJUNTO_ECONOMICA: ["CONSULTAR_DOCUMENTO", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_DESPACHO_FINAL", "INTERCAMBIOS_ENVIAR", "INTERCAMBIOS_CONSULTAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
  ADMINISTRADOR_ADJUNTO_TECNICA: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_DESPACHO_FINAL", "INTERCAMBIOS_ENVIAR", "INTERCAMBIOS_CONSULTAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_DESPACHAR_ENCAMINHAMENTO", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],

  SECRETARIO_GERAL: [
    "LANCAR_RECEITA",
    "CONSULTAR_RECEITA",
    "CATALOGO_SERVICOS_GERIR",
    "CATALOGO_SERVICOS_CONSULTAR",
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
    "PROCESSOS_GENERICOS_VER_TODOS_GABINETE",
    "LOGISTICA_CONSULTAR",
    "LOGISTICA_GERIR",
    "PATRIMONIO_GERIR",
    "PATRIMONIO_CONSULTAR",
    "PATRIMONIO_JURIDICO"
  ],
  DIRECTOR_GEPE: ["CONSULTAR_RECEITA", "CATALOGO_SERVICOS_GERIR", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_TRATAR", "GEPE_CONSULTAR", "GEPE_GERIR"],
  DIRECTOR_JURIDICO: [
    "LANCAR_RECEITA",
    "CONSULTAR_RECEITA",
    "CATALOGO_SERVICOS_CONSULTAR",
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
    "COMISSOES_MORADORES_CONSULTAR",
    "COMISSOES_MORADORES_GERIR",
    "BIBLIOTECA_JURIDICA_CONSULTAR",
    "BIBLIOTECA_JURIDICA_GERIR",
  ],

  ASSESSOR_JURIDICO: [
    "EMITIR_PARECER_JURIDICO",
    "CONSULTAR_DOCUMENTO",
    "PROCESSOS_GENERICOS_CONSULTAR",
    "PROCESSOS_GENERICOS_ANEXAR",
    "PROCESSOS_GENERICOS_TRANSICIONAR",
    "BIBLIOTECA_JURIDICA_CONSULTAR",
  ],


  DIRECTOR_RH: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "GERIR_ASSIDUIDADE", "UTILIZADORES_EDITAR", "UTILIZADORES_REDEFINIR_PASSWORD", "VALIDACAO_APROVAR_NIVEL_1", "CONSULTAR_DOCUMENTO"],
  DIRECTOR_COMUNICACAO_SOCIAL: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CRIAR_DOCUMENTO", "CONSULTAR_DOCUMENTO"],
  AUDITOR: ["CONSULTAR_LOGS_AUDITORIA", "EXPORTAR_LOGS", "CONSULTAR_DOCUMENTO", "ARQUIVO_MORTO_ACEDER"],

  DIRECTOR_EDUCACAO: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_SAUDE: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_DESENVOLVIMENTO_ECONOMICO: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_AMBIENTE_SANEAMENTO: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_TRANSPORTES: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_ACCAO_SOCIAL: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
  DIRECTOR_TURISMO_CULTURA: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_TEMPOS_LIVRES: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_ENERGIA_AGUAS: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_INFRAESTRUTURAS: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_AGRICULTURA: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR"],
  DIRECTOR_REGISTOS: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR", "COMISSOES_MORADORES_CONSULTAR", "COMISSOES_MORADORES_GERIR"],

  DIRECTOR_FISCALIZACAO: ["LANCAR_RECEITA", "CONSULTAR_RECEITA", "CATALOGO_SERVICOS_CONSULTAR", "CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRATAR", "FISCALIZACAO_CONSULTAR", "FISCALIZACAO_GERIR"],

  "CHEFE_DIRECÇÃO": ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PROCESSOS_GENERICOS_ATRIBUIR_RESPONSAVEL", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],
  FUNCIONARIO_INTERNO: ["CONSULTAR_DOCUMENTO", "PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_CONSULTAR", "PROCESSOS_GENERICOS_ANEXAR", "PROCESSOS_GENERICOS_TRANSICIONAR", "PAGAMENTOS_GERAR_RUPE", "PAGAMENTOS_CONSULTAR", "PROCESSOS_TRAMITAR_GABINETE", "PROCESSOS_TRATAR", "PROCESSOS_GENERICOS_TRAMITAR_GABINETE", "AGENDAMENTOS_CONSULTAR", "AGENDAMENTOS_CONFIRMAR", "AGENDAMENTOS_GERIR"],


  CIDADAO: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
  EMPRESA: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
  INSTITUICAO: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
  COMISSAO_MORADORES: ["PROCESSOS_GENERICOS_CRIAR", "PROCESSOS_GENERICOS_ANEXAR", "PORTAL_MUNICIPE_CONSULTAR_PROCESSO", "AGENDAMENTOS_CRIAR", "PAGAMENTOS_CONSULTAR"],
};

PERFIL_PERMISSOES_MAP.SUPER_ADMIN!.push(
  "CONTEUDO_PUBLICO_GERIR",
  "CONTEUDO_PUBLICO_CONSULTAR",
  "CONTACTOS_INSTITUCIONAIS_GERIR",
  "CONTACTOS_INSTITUCIONAIS_CONSULTAR"
);
PERFIL_PERMISSOES_MAP.ADMINISTRADOR_MUNICIPAL!.push(
  "CONTEUDO_PUBLICO_GERIR",
  "CONTEUDO_PUBLICO_CONSULTAR",
  "CONTACTOS_INSTITUCIONAIS_GERIR",
  "CONTACTOS_INSTITUCIONAIS_CONSULTAR"
);
PERFIL_PERMISSOES_MAP.DIRECTOR_COMUNICACAO_SOCIAL!.push(
  "CONTEUDO_PUBLICO_GERIR",
  "CONTEUDO_PUBLICO_CONSULTAR",
  "CONTACTOS_INSTITUCIONAIS_GERIR",
  "CONTACTOS_INSTITUCIONAIS_CONSULTAR"
);

PERFIL_PERMISSOES_MAP.SECRETARIO_GERAL!.push(
  "PROCESSOS_GENERICOS_EXPEDIR",
  "PROCESSOS_GENERICOS_TRAMITAR_GABINETE",
  "CONTACTOS_INSTITUCIONAIS_GERIR", "CONTACTOS_INSTITUCIONAIS_CONSULTAR"
);
for (const permissoes of Object.values(PERFIL_PERMISSOES_MAP)) {
  if (permissoes.includes("PAGAMENTOS_GERAR_RUPE")) {
    permissoes.push("PAGAMENTOS_CONFIRMAR", "PAGAMENTOS_GERIR");
  }
}

for (const [perfilNome, permissoes] of Object.entries(PERFIL_PERMISSOES_MAP)) {
  
  const chefiaGabinete =
    perfilNome === "SUPER_ADMIN" ||
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
    const municipiosCriados: Municipio[] = [];
    for (const m of MUNICIPIOS_DATA) {
      const municipio = await prisma.municipio.upsert({
        where: { codigo: m.codigo },
        update: m,
        create: { ...m },
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
            console.log(`      └─ ${departamentosPadrao.length} departamentos`);
          }
        }
      });
    }

    console.log("\nCriando Catálogo de Serviços por município...");
    for (const municipio of municipiosCriados) {
      await withMunicipio(municipio.id, async (tx) => {
        let criados = 0;
        for (const servicoSeed of CATALOGO_SERVICOS_MUNICIPAIS) {
          const direcao = await tx.direcao.findUnique({
            where: { municipioId_sigla: { municipioId: municipio.id, sigla: servicoSeed.direcaoResponsavelSigla } },
            select: { id: true },
          });
          if (!direcao) {
            console.log(`   [${municipio.nome}] direcção "${servicoSeed.direcaoResponsavelSigla}" não encontrada — a saltar serviço ${servicoSeed.codigo}`);
            continue;
          }

          const servico = await tx.servico.upsert({
            where: { municipioId_codigo: { municipioId: municipio.id, codigo: servicoSeed.codigo } },
            update: {
              nome: servicoSeed.nome,
              descricao: servicoSeed.descricao,
              tipoProcesso: servicoSeed.tipoProcesso,
              direcaoResponsavelId: direcao.id,
              origensPermitidas: servicoSeed.origensPermitidas,
              pago: servicoSeed.pago,
              valorReferenciaKz: servicoSeed.valorReferenciaKz ?? null,
              fonte: servicoSeed.fonte,
            },
            create: {
              municipioId: municipio.id,
              codigo: servicoSeed.codigo,
              nome: servicoSeed.nome,
              descricao: servicoSeed.descricao,
              tipoProcesso: servicoSeed.tipoProcesso,
              direcaoResponsavelId: direcao.id,
              origensPermitidas: servicoSeed.origensPermitidas,
              pago: servicoSeed.pago,
              valorReferenciaKz: servicoSeed.valorReferenciaKz ?? null,
              fonte: servicoSeed.fonte,
            },
          });

          await tx.servicoDocumentoExigido.deleteMany({ where: { servicoId: servico.id } });
          if (servicoSeed.documentosExigidos.length > 0) {
            await tx.servicoDocumentoExigido.createMany({
              data: servicoSeed.documentosExigidos.map((doc, indice) => ({
                servicoId: servico.id,
                codigo: doc.codigo,
                nome: doc.nome,
                obrigatorio: doc.obrigatorio,
                ordem: indice,
              })),
            });
          }
          criados++;
        }
        console.log(`   [${municipio.nome}] ${criados} serviços no catálogo`);
      });
    }

    /* ── 3. PERFIS ── */
    console.log("\nCriando Perfis...");
    const perfisCriados: Perfil[] = [];
    for (const perfilData of PERFIS_DATA) {
      const perfil = await prisma.perfil.upsert({
        where: { nome: perfilData.nome },
        update: perfilData,
        create: { ...perfilData },
      });
      perfisCriados.push(perfil);
      console.log(`   ${perfil.nome}`);
    }
     /* ── 3.1 ACESSO ILIMITADO AO PONTO ──
       Antes era a lista fixa PERFIS_ACESSO_ILIMITADO em src/modules/rh/rh.constants.ts;
       passa a ser uma decisão do Administrador (Perfil.acessoIlimitadoPonto, editável via
       PATCH /perfis/:id/acesso-ilimitado-ponto). Isto só define o estado inicial. */
    await prisma.perfil.updateMany({
      where: {
        nome: {
          in: [
            "SUPER_ADMIN",
            "ADMINISTRADOR_MUNICIPAL",
            "ADMINISTRADOR_ADJUNTO_POLITICA",
            "ADMINISTRADOR_ADJUNTO_ECONOMICA",
            "ADMINISTRADOR_ADJUNTO_TECNICA",
            "SECRETARIO_GERAL",
            "DIRECTOR_GEPE",
            "DIRECTOR_JURIDICO",
            "DIRECTOR_RH",
            "DIRECTOR_COMUNICACAO_SOCIAL",
            "DIRECTOR_EDUCACAO",
            "DIRECTOR_SAUDE",
            "DIRECTOR_DESENVOLVIMENTO_ECONOMICO",
            "DIRECTOR_AMBIENTE_SANEAMENTO",
            "DIRECTOR_TRANSPORTES",
            "DIRECTOR_ACCAO_SOCIAL",
            "DIRECTOR_TURISMO_CULTURA",
            "DIRECTOR_TEMPOS_LIVRES",
            "DIRECTOR_ENERGIA_AGUAS",
            "DIRECTOR_INFRAESTRUTURAS",
            "CHEFE_DIRECAO",
          ],
        },
        acessoIlimitadoPonto: false,
      },
      data: { acessoIlimitadoPonto: true },
    });


    /* ── 4. PERMISSÕES ── */
    console.log("\nCriando Permissões...");
    const permissoesCriadas: { nome: string; id: string; chave: string }[] = [];
    for (const permData of PERMISSOES_DATA) {
      const { nome, ...dadosPermissao } = permData;
      const chave = `${dadosPermissao.recurso}:${dadosPermissao.accao}`;
      const perm = await prisma.permissao.upsert({
        where: { chave },
        update: dadosPermissao,
        create: { chave, ...dadosPermissao },
      });
      permissoesCriadas.push({ nome, id: perm.id, chave: perm.chave });
      console.log(`  ${nome}`);
    }

    /* ── 5. VÍNCULOS PERFIL-PERMISSÃO ── */
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
          create: { perfilId: perfil.id, permissaoId: perm.id },
        });
        vinculosCriados++;
      }
      console.log(`   ${perfilNome}: ${permissoesNomes.length} permissões`);
    }

    /* ── 6. SUPER ADMIN ── */
    console.log("\n Verificando SUPER_ADMIN...");
    const perfilSuperAdmin = perfisCriados.find((p) => p.nome === "SUPER_ADMIN")!;
    const municipioSede = municipiosCriados[0]!;

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
        console.warn(
          "   SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD não definidas no .env — a saltar criação do SUPER_ADMIN."
        );
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

    /* ── 7. UTILIZADORES DE TESTE — PROCESSOS GENÉRICOS ── */
    console.log("\n Criando utilizadores de teste para Processos Genéricos...");

    const UTILIZADORES_TESTE = [
      { perfilNome: "ADMINISTRADOR_MUNICIPAL", nome: "Administrador Municipal", envPrefix: "SEED_ADMIN_MUNICIPAL", tipoConta: "INTERNO" as const },
      { perfilNome: "SECRETARIO_GERAL", nome: "Secretário Geral", envPrefix: "SEED_SECRETARIO_GERAL", tipoConta: "INTERNO" as const },
      { perfilNome: "CHEFE_DIRECÇÃO", nome: "Chefe de Direção", envPrefix: "SEED_CHEFE_DIRECAO", tipoConta: "INTERNO" as const },
      { perfilNome: "FUNCIONARIO_INTERNO", nome: "Funcionário Interno", envPrefix: "SEED_FUNCIONARIO_INTERNO", tipoConta: "INTERNO" as const },
      { perfilNome: "ASSESSOR_JURIDICO", nome: "Assessor Jurídico", envPrefix: "SEED_ASSESSOR_JURIDICO", tipoConta: "INTERNO" as const },
      { perfilNome: "DIRECTOR_JURIDICO", nome: "Director Jurídico", envPrefix: "SEED_DIRETOR_JURIDICO", tipoConta: "INTERNO" as const },
      { perfilNome: "AUDITOR", nome: "Auditor", envPrefix: "SEED_AUDITOR", tipoConta: "INTERNO" as const },
      { perfilNome: "CIDADAO", nome: "Cidadão Teste", envPrefix: "SEED_CIDADAO", tipoConta: "CIDADAO" as const },
    ];

    for (const u of UTILIZADORES_TESTE) {
      const email = process.env[`${u.envPrefix}_EMAIL`];
      const password = process.env[`${u.envPrefix}_PASSWORD`];
      if (!email || !password) {
        console.warn(`   ⚠️  ${u.envPrefix}_EMAIL / PASSWORD não definidos — a saltar ${u.nome}.`);
        continue;
      }

      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });

      await withMunicipio(municipioSede.id, async (tx) => {
        const perfil = perfisCriados.find((p) => p.nome === u.perfilNome);
        if (!perfil) {
          console.warn(`   Perfil ${u.perfilNome} não encontrado — a saltar ${u.nome}.`);
          return;
        }

        const utilizador = await tx.utilizador.upsert({
          where: { email },
          update: {},
          create: {
            municipioId: municipioSede.id,
            nomeCompleto: u.nome,
            email,
            passwordHash,
            tipoConta: u.tipoConta,
            estado: "ACTIVA",
            emailConfirmado: true,
          },
        });

        await tx.utilizadorPerfil.upsert({
          where: { utilizadorId_perfilId: { utilizadorId: utilizador.id, perfilId: perfil.id } },
          update: {},
          create: { utilizadorId: utilizador.id, perfilId: perfil.id },
        });

        console.log(`   ✅ ${u.nome} (${u.perfilNome}) → ${email}`);
      });
    }

    /* ── RESUMO ── */
    console.log("\n Seed completada com sucesso!");
    console.log(`   - ${municipiosCriados.length} Municípios`);
    console.log(`   - ${DIRECOES_TEMPLATE.length} Unidades Orgânicas × ${municipiosCriados.length} municípios`);
    console.log(`   - ${perfisCriados.length} Perfis`);
    console.log(`   - ${permissoesCriadas.length} Permissões`);
    console.log(`   - ${vinculosCriados} vínculos Perfil-Permissão`);
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  } finally {
     await prisma.$disconnect();
  await pool.end();
  }
}

main();