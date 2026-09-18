import { randomBytes, createHash } from "node:crypto";
import {
  withAuthBypass,
  withTenantTransaction,
  readOnlyComRetry,
} from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { verifyMfaToken } from "./mfa.service.js";
import { issueRefreshToken } from "./jwt.service.js";
import {
  sendConfirmationEmail,
  sendContaBloqueadaEmail,
  sendPasswordResetEmail,
  sendComissaoCredenciaisEmail, // NOVO — ver nota no fim
  sendSessaoTerminadaPorNovoLoginEmail, // NOVO — ver nota no fim
} from "../email/email.service.js";
import type {
  RegisterInput,
  LoginInput,
  CreateComissaoModeradoresInput,
} from "./auth.schema.js";
import {
  verificarJanelaDeAcesso,
  MENSAGEM_FORA_DO_HORARIO_DE_ACESSO,
} from "../../modules/rh/ponto/ponto.service.js";

const MAX_TENTATIVAS_FALHADAS = 5;
const DURACAO_BLOQUEIO_MS = 15 * 60 * 1000;

const TIPOS_QUE_EXIGEM_CONFIRMACAO_EMAIL = [
  "CIDADAO",
  "EMPRESA",
  "INSTITUICAO",
] as const;

const TIPOS_COM_RECOVERY_DE_PASSWORD = [
  "CIDADAO",
  "EMPRESA",
  "INSTITUICAO",
  "COMISSAO_MORADORES",
] as const;

export class CredenciaisInvalidasError extends Error {}
export class ContaBloqueadaError extends Error {}
export class ContaNaoActivaError extends Error {}
export class EmailNaoConfirmadoError extends Error {}
export class MfaObrigatorioError extends Error {}
export class MfaTokenInvalidoError extends Error {}
export class EmailJaExisteError extends Error {}
export class DocumentoJaExisteError extends Error {}
export class DirecaoNaoEncontradaError extends Error {}
export class RegistoInternoNaoPermitidoError extends Error {}
export class RegistoComissaoNaoPermitidoError extends Error {} // NOVO
export class TokenConfirmacaoInvalidoError extends Error {}
export class TokenRedefinicaoInvalidoError extends Error {}
export class ForaDoHorarioDeAcessoError extends Error {}
export class SessaoActivaExistenteError extends Error {} // NOVO

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUser(input: RegisterInput) {
  if ((input.tipoConta as string) === "COMISSAO_MORADORES") {
    // Defesa em profundidade: o schema Zod já não aceita este valor no
    // registo público, mas mantemos o guard caso o schema mude no futuro.
    throw new RegistoComissaoNaoPermitidoError(
      "Contas de Comissão de Moradores são criadas por um funcionário municipal, não pelo registo público.",
    );
  }

 if ((input.tipoConta as string) === "INTERNO") {
    throw new RegistoInternoNaoPermitidoError(
      "Contas internas não podem ser criadas pelo registo público. Contacta o Administrador Municipal ou o RH.",
    );
  }

  const passwordHash = await hashPassword(input.password);

  const exigeConfirmacaoEmail = (
    TIPOS_QUE_EXIGEM_CONFIRMACAO_EMAIL as readonly string[]
  ).includes(input.tipoConta);

  const { utilizador, municipioNome } = await withAuthBypass(
    async (tx: Prisma.TransactionClient) => {
      const existente = await tx.utilizador.findUnique({
        where: { email: input.email },
      });

      if (existente) {
        throw new EmailJaExisteError("Já existe uma conta com este email.");
      }

      if (input.documentoNumero) {
        const documentoExistente = await tx.utilizador.findUnique({
          where: { documentoNumero: input.documentoNumero },
        });

        if (documentoExistente) {
          throw new DocumentoJaExisteError(
            "Já existe uma conta registada com este número de documento.",
          );
        }
      }

      const utilizadorCriado = await tx.utilizador.create({
        data: {
          municipioId: input.municipioId,
          nomeCompleto: input.nomeCompleto,
          email: input.email,
          passwordHash,
          tipoConta: input.tipoConta,
          emailConfirmado: !exigeConfirmacaoEmail,
          ...(input.telefone !== undefined && { telefone: input.telefone }),
          ...(input.endereco !== undefined && { endereco: input.endereco }),
          ...(input.documentoTipo !== undefined && {
            documentoTipo: input.documentoTipo,
          }),
          ...(input.documentoNumero !== undefined && {
            documentoNumero: input.documentoNumero,
          }),
          ...(input.nomeEmpresa !== undefined && {
            nomeEmpresa: input.nomeEmpresa,
          }),
          ...(input.nifEmpresa !== undefined && {
            nifEmpresa: input.nifEmpresa,
          }),
          ...(input.nomeInstituicao !== undefined && {
            nomeInstituicao: input.nomeInstituicao,
          }),
          ...(input.nipcInstituicao !== undefined && {
            nipcInstituicao: input.nipcInstituicao,
          }),
        },
      });

      const perfilCorrespondente = await tx.perfil.findFirst({
        where: { nome: input.tipoConta, activo: true },
        select: { id: true },
      });

      if (perfilCorrespondente) {
        await tx.utilizadorPerfil.create({
          data: {
            utilizadorId: utilizadorCriado.id,
            perfilId: perfilCorrespondente.id,
          },
        });
      } else {
        console.error(
          `Perfil "${input.tipoConta}" não encontrado no catálogo, a conta ${utilizadorCriado.id} ficou sem permissões.`,
        );
      }

      await tx.logAuditoria.create({
        data: {
          municipioId: input.municipioId,
          utilizadorId: utilizadorCriado.id,
          accao: "REGISTO_CONTA",
          entidade: "Utilizador",
          entidadeId: utilizadorCriado.id,
        },
      });

      let nomeMunicipio: string | undefined;

      if (exigeConfirmacaoEmail) {
        const municipio = await tx.municipio.findUniqueOrThrow({
          where: { id: input.municipioId },
          select: { nome: true },
        });

        nomeMunicipio = municipio.nome;
      }

      return {
        utilizador: utilizadorCriado,
        municipioNome: nomeMunicipio,
      };
    },
  );

  if (exigeConfirmacaoEmail && municipioNome) {
    await enviarEmailDeConfirmacao(
      utilizador.id,
      utilizador.email,
      utilizador.nomeCompleto,
      municipioNome,
    );
  }

  return utilizador;
}

export async function createComissaoModeradores(
  input: CreateComissaoModeradoresInput,
  criadoPor: { utilizadorId: string; municipioId: string },
) {
  const passwordHash = await hashPassword(input.password);

  const { comissao, utilizadorCriado } = await withTenantTransaction(
    criadoPor.municipioId,
    async (tx: Prisma.TransactionClient) => {
      const existente = await tx.utilizador.findUnique({
        where: { email: input.email },
      });

      if (existente) {
        throw new EmailJaExisteError("Já existe uma conta com este email.");
      }

      const utilizadorCriado = await tx.utilizador.create({
        data: {
          municipioId: input.municipioId,
          nomeCompleto: input.nomeComissao ?? input.presidenteNome,
          email: input.email,
          passwordHash,
          tipoConta: "COMISSAO_MORADORES",
          // Foi um funcionário que criou e validou a conta — não passa
          // pelo fluxo de confirmação por email.
          emailConfirmado: true,
          // Força a comissão a definir a sua própria password no
          // primeiro login, em vez de ficar a usar a provisória.
          deveTrocarPassword: true,
        },
      });

      const perfilCorrespondente = await tx.perfil.findFirst({
        where: { nome: "COMISSAO_MORADORES", activo: true },
        select: { id: true },
      });

      if (perfilCorrespondente) {
        await tx.utilizadorPerfil.create({
          data: {
            utilizadorId: utilizadorCriado.id,
            perfilId: perfilCorrespondente.id,
          },
        });
      } else {
        console.error(
          `Perfil "COMISSAO_MORADORES" não encontrado no catálogo, a conta ${utilizadorCriado.id} ficou sem permissões.`,
        );
      }

      const comissaoCriada = await tx.comissaoModeradores.create({
        data: {
          municipioId: input.municipioId,
          utilizadorId: utilizadorCriado.id,
          bairro: input.bairro,
          ...(input.coordenadasLat !== undefined && {
            coordenadasLat: input.coordenadasLat,
          }),
          ...(input.coordenadasLng !== undefined && {
            coordenadasLng: input.coordenadasLng,
          }),
          presidenteNome: input.presidenteNome,
          ...(input.presidenteContacto !== undefined && {
            presidenteContacto: input.presidenteContacto,
          }),
          ...(input.documentacaoLegalUrl !== undefined && {
            documentacaoLegalUrl: input.documentacaoLegalUrl,
          }),
          ...(input.observacoes !== undefined && {
            observacoes: input.observacoes,
          }),
          criadoPorUtilizadorId: criadoPor.utilizadorId,
        },
      });

      await tx.logAuditoria.create({
        data: {
          municipioId: input.municipioId,
          utilizadorId: criadoPor.utilizadorId,
          accao: "COMISSAO_MODERADORES_CRIADA",
          entidade: "ComissaoModeradores",
          entidadeId: comissaoCriada.id,
        },
      });

      return { comissao: comissaoCriada, utilizadorCriado };
    },
  );

  // em createComissaoModeradores, antes de enviar o email:
  const municipio = await withTenantTransaction(
    criadoPor.municipioId,
    (tx: Prisma.TransactionClient) =>
      tx.municipio.findUniqueOrThrow({
        where: { id: input.municipioId },
        select: { nome: true },
      }),
  );

  try {
    await sendComissaoCredenciaisEmail({
      to: utilizadorCriado.email,
      toName: utilizadorCriado.nomeCompleto,
      municipioNome: municipio.nome,
      password: input.password,
      loginUrl: `${env.FRONTEND_URL}/login`,
    });
  } catch (error) {
    console.error("Falha ao enviar email de credenciais da comissão:", error);
  }

  return { comissao, utilizador: utilizadorCriado };
}

async function enviarEmailDeConfirmacao(
  utilizadorId: string,
  email: string,
  nomeCompleto: string,
  municipioNome: string,
): Promise<void> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiraEm = new Date(
    Date.now() + env.EMAIL_CONFIRMATION_EXPIRES_IN_HOURS * 60 * 60 * 1000,
  );

  await withAuthBypass((tx: Prisma.TransactionClient) =>
    tx.emailConfirmationToken.create({
      data: { utilizadorId, tokenHash, expiraEm },
    }),
  );

  const confirmationUrl = `${env.FRONTEND_URL}/confirmar-email?token=${rawToken}`;

  try {
    await sendConfirmationEmail({
      to: email,
      toName: nomeCompleto,
      municipioNome,
      confirmationUrl,
      expiresInHours: env.EMAIL_CONFIRMATION_EXPIRES_IN_HOURS,
    });
  } catch (error) {
    console.error("Falha ao enviar email de confirmação:", error);
  }
}

export async function confirmEmail(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const { tokenRecord, municipioId } = await withAuthBypass(
    async (tx: Prisma.TransactionClient) => {
      const tokenRecord = await tx.emailConfirmationToken.findUnique({
        where: { tokenHash },
      });

      if (!tokenRecord) {
        throw new TokenConfirmacaoInvalidoError(
          "Token de confirmação inválido.",
        );
      }
      if (tokenRecord.usadoEm) {
        throw new TokenConfirmacaoInvalidoError(
          "Este link de confirmação já foi usado.",
        );
      }
      if (tokenRecord.expiraEm < new Date()) {
        throw new TokenConfirmacaoInvalidoError(
          "Este link de confirmação expirou.",
        );
      }

      const utilizador = await tx.utilizador.findUniqueOrThrow({
        where: { id: tokenRecord.utilizadorId },
        select: { municipioId: true },
      });

      return { tokenRecord, municipioId: utilizador.municipioId };
    },
  );

  await withTenantTransaction(
    municipioId,
    async (tx: Prisma.TransactionClient) => {
      await tx.emailConfirmationToken.update({
        where: { id: tokenRecord.id },
        data: { usadoEm: new Date() },
      });

      await tx.utilizador.update({
        where: { id: tokenRecord.utilizadorId },
        data: { emailConfirmado: true, emailConfirmadoEm: new Date() },
      });

      const utilizador = await tx.utilizador.findUniqueOrThrow({
        where: { id: tokenRecord.utilizadorId },
      });

      await tx.logAuditoria.create({
        data: {
          municipioId: utilizador.municipioId,
          utilizadorId: utilizador.id,
          accao: "EMAIL_CONFIRMADO",
          entidade: "Utilizador",
          entidadeId: utilizador.id,
        },
      });
    },
  );
}

interface LoginResult {
  utilizador: {
    id: string;
    nomeCompleto: string;
    email: string;
    municipioId: string;
    tipoConta: string;
    estado: string;
    mfaActivo: boolean;
    deveTrocarPassword: boolean;
  };
  refreshToken: string;
}

export async function loginUser(
  input: LoginInput,
  context: { ipOrigem?: string; userAgent?: string },
): Promise<LoginResult> {
  const utilizador = await readOnlyComRetry(
    () =>
      withAuthBypass((tx: Prisma.TransactionClient) =>
        tx.utilizador.findFirst({
          where: {
            OR: [
              { email: input.identificador },
              { documentoNumero: input.identificador },
              { nifEmpresa: input.identificador },
              { nipcInstituicao: input.identificador },
            ],
          },
        }),
      ),
    "loginUser: procurar utilizador por identificador",
  );

  if (!utilizador) {
    throw new CredenciaisInvalidasError("Credenciais incorrectas.");
  }

  const bloqueioActivo =
    utilizador.bloqueadoAte && utilizador.bloqueadoAte > new Date();

  if (bloqueioActivo) {
    const minutosRestantes = Math.ceil(
      (utilizador.bloqueadoAte!.getTime() - Date.now()) / 60000,
    );
    throw new ContaBloqueadaError(
      `Conta temporariamente bloqueada. Tenta novamente em ${minutosRestantes} minuto(s).`,
    );
  }

  const bloqueioJaExpirou = utilizador.bloqueadoAte !== null;

  if (bloqueioJaExpirou) {
    await withTenantTransaction(
      utilizador.municipioId,
      (tx: Prisma.TransactionClient) =>
        tx.utilizador.update({
          where: { id: utilizador.id },
          data: { tentativasLoginFalhadas: 0, bloqueadoAte: null },
        }),
    );

    utilizador.tentativasLoginFalhadas = 0;
    utilizador.bloqueadoAte = null;
  }

  const passwordValida = await verifyPassword(
    utilizador.passwordHash,
    input.password,
  );

  if (!passwordValida) {
    await registarTentativaFalhada({
      utilizadorId: utilizador.id,
      tentativasActuais: utilizador.tentativasLoginFalhadas,
      email: utilizador.email,
      nomeCompleto: utilizador.nomeCompleto,
      emailConfirmado: utilizador.emailConfirmado,
      ...(context.ipOrigem !== undefined && { ipOrigem: context.ipOrigem }),
    });
    throw new CredenciaisInvalidasError("Credenciais incorrectas.");
  }

  if (!utilizador.emailConfirmado) {
    throw new EmailNaoConfirmadoError(
      "Confirme o seu email antes de iniciar sessão. Verifique a sua caixa de entrada.",
    );
  }

  if (utilizador.estado === "SUSPENSA" || utilizador.estado === "BLOQUEADA") {
    throw new ContaNaoActivaError(
      `Conta com estado "${utilizador.estado}", não pode iniciar sessão.`,
    );
  }

  if (utilizador.mfaActivo) {
    if (!input.mfaToken) {
      throw new MfaObrigatorioError(
        "Esta conta requer código de autenticação (MFA).",
      );
    }

    const mfaValido = await verifyMfaToken({
      secret: utilizador.mfaSecret!,
      token: input.mfaToken,
    });

    if (!mfaValido) {
      await registarTentativaFalhada({
        utilizadorId: utilizador.id,
        tentativasActuais: utilizador.tentativasLoginFalhadas,
        email: utilizador.email,
        nomeCompleto: utilizador.nomeCompleto,
        emailConfirmado: utilizador.emailConfirmado,
        ...(context.ipOrigem !== undefined && { ipOrigem: context.ipOrigem }),
      });
      throw new MfaTokenInvalidoError("Código MFA inválido.");
    }
  }
  if (utilizador.tipoConta === "INTERNO") {
    const { permitido } = await verificarJanelaDeAcesso({
      tipoConta: utilizador.tipoConta,
      utilizadorId: utilizador.id,
      municipioId: utilizador.municipioId,
      isRotaDePonto: false,
    });

    if (!permitido) {
      throw new ForaDoHorarioDeAcessoError(MENSAGEM_FORA_DO_HORARIO_DE_ACESSO);
    }

    if (utilizador.online && !input.forcarNovaSessao) {
      throw new SessaoActivaExistenteError(
        "Esta conta já tem uma sessão activa noutro dispositivo. Confirme para terminar a sessão anterior e continuar.",
      );
    }

    if (utilizador.online && input.forcarNovaSessao) {
      await withTenantTransaction(
        utilizador.municipioId,
        (tx: Prisma.TransactionClient) =>
          tx.refreshToken.updateMany({
            where: { utilizadorId: utilizador.id, revogadoEm: null },
            data: { revogadoEm: new Date() },
          }),
      );

      // em loginUser, no bloco de forcarNovaSessao:
      try {
        const municipio = await withTenantTransaction(
          utilizador.municipioId,
          (tx: Prisma.TransactionClient) =>
            tx.municipio.findUniqueOrThrow({
              where: { id: utilizador.municipioId },
              select: { nome: true },
            }),
        );

        await sendSessaoTerminadaPorNovoLoginEmail({
          to: utilizador.email,
          toName: utilizador.nomeCompleto,
          municipioNome: municipio.nome,
          dataHora: new Date(),
          ...(context.ipOrigem !== undefined && {
            ipNovoLogin: context.ipOrigem,
          }),
        });
      } catch (error) {
        console.error("Falha ao enviar email de alerta de nova sessão:", error);
      }
    }
  }

  const refreshToken = await issueRefreshToken({
    utilizadorId: utilizador.id,
    municipioId: utilizador.municipioId,
    ...(context.ipOrigem !== undefined && { ipOrigem: context.ipOrigem }),
    ...(context.userAgent !== undefined && { userAgent: context.userAgent }),
  });

  await withTenantTransaction(
    utilizador.municipioId,
    async (tx: Prisma.TransactionClient) => {
      await tx.logAuditoria.create({
        data: {
          municipioId: utilizador.municipioId,
          utilizadorId: utilizador.id,
          accao: "LOGIN_SUCESSO",
          entidade: "Utilizador",
          entidadeId: utilizador.id,
          ...(context.ipOrigem !== undefined && { ipOrigem: context.ipOrigem }),
        },
      });
      await tx.utilizador.update({
        where: { id: utilizador.id },
        data: {
          online: true,
          ultimoLoginEm: new Date(),
          ...(context.ipOrigem !== undefined && {
            ultimoIpLogin: context.ipOrigem,
          }),
        },
      });
    },
  );

  return {
    utilizador: {
      id: utilizador.id,
      nomeCompleto: utilizador.nomeCompleto,
      email: utilizador.email,
      municipioId: utilizador.municipioId,
      tipoConta: utilizador.tipoConta,
      estado: utilizador.estado,
      mfaActivo: utilizador.mfaActivo,
      deveTrocarPassword: utilizador.deveTrocarPassword,
    },
    refreshToken,
  };
}

export async function marcarUtilizadorOffline(
  utilizadorId: string,
  municipioId: string,
): Promise<void> {
  await withTenantTransaction(municipioId, (tx: Prisma.TransactionClient) =>
    tx.utilizador.update({
      where: { id: utilizadorId },
      data: { online: false, ultimoLogoutEm: new Date() },
    }),
  );
}

async function registarTentativaFalhada(params: {
  utilizadorId: string;
  tentativasActuais: number;
  email: string;
  nomeCompleto: string;
  emailConfirmado: boolean;
  ipOrigem?: string;
}): Promise<void> {
  const novasTentativas = params.tentativasActuais + 1;
  const atingiuLimite = novasTentativas >= MAX_TENTATIVAS_FALHADAS;
  const dataHoraBloqueio = new Date();
  const bloqueadoAte = new Date(
    dataHoraBloqueio.getTime() + DURACAO_BLOQUEIO_MS,
  );

  const municipioId = await withAuthBypass((tx: Prisma.TransactionClient) =>
    tx.utilizador.findUniqueOrThrow({
      where: { id: params.utilizadorId },
      select: { municipioId: true },
    }),
  );

  const utilizador = await withTenantTransaction(
    municipioId.municipioId,
    async (tx: Prisma.TransactionClient) => {
      const actualizado = await tx.utilizador.update({
        where: { id: params.utilizadorId },
        data: {
          tentativasLoginFalhadas: novasTentativas,
          ...(atingiuLimite && { bloqueadoAte }),
        },
      });

      await tx.logAuditoria.create({
        data: {
          municipioId: actualizado.municipioId,
          utilizadorId: actualizado.id,
          accao: atingiuLimite
            ? "CONTA_BLOQUEADA_FORCA_BRUTA"
            : "LOGIN_FALHADO",
          entidade: "Utilizador",
          entidadeId: actualizado.id,
        },
      });

      return actualizado;
    },
  );

  if (atingiuLimite && params.emailConfirmado) {
    try {
      const municipio = await withTenantTransaction(
        utilizador.municipioId,
        (tx: Prisma.TransactionClient) =>
          tx.municipio.findUniqueOrThrow({
            where: { id: utilizador.municipioId },
            select: { nome: true },
          }),
      );

      await sendContaBloqueadaEmail({
        to: params.email,
        toName: params.nomeCompleto,
        municipioNome: municipio.nome,
        dataHoraBloqueio,
        duracaoBloqueioMinutos: Math.round(DURACAO_BLOQUEIO_MS / 60000),
        ...(params.ipOrigem !== undefined && { ipOrigem: params.ipOrigem }),
      });
    } catch (error) {
      console.error(
        "Falha ao enviar email de alerta de conta bloqueada:",
        error,
      );
    }
  }
}

export async function initiateMfaSetup(params: {
  utilizadorId: string;
  municipioId: string;
}) {
  const { generateMfaSecret, generateMfaQrCodeUri, generateMfaQrCodeDataUrl } =
    await import("./mfa.service.js");

  const utilizador = await withTenantTransaction(
    params.municipioId,
    (tx: Prisma.TransactionClient) =>
      tx.utilizador.findUniqueOrThrow({ where: { id: params.utilizadorId } }),
  );

  const secret = generateMfaSecret();
  const otpUri = generateMfaQrCodeUri({
    secret,
    accountEmail: utilizador.email,
  });
  const qrCodeDataUrl = await generateMfaQrCodeDataUrl(otpUri);

  await withTenantTransaction(
    params.municipioId,
    (tx: Prisma.TransactionClient) =>
      tx.utilizador.update({
        where: { id: params.utilizadorId },
        data: { mfaSecret: secret },
      }),
  );

  return { qrCodeDataUrl, secret };
}

export async function confirmMfaSetup(params: {
  utilizadorId: string;
  municipioId: string;
  token: string;
}): Promise<void> {
  await withTenantTransaction(
    params.municipioId,
    async (tx: Prisma.TransactionClient) => {
      const utilizador = await tx.utilizador.findUniqueOrThrow({
        where: { id: params.utilizadorId },
      });

      if (!utilizador.mfaSecret) {
        throw new Error(
          "Configuração de MFA não foi iniciada para esta conta.",
        );
      }

      const valido = await verifyMfaToken({
        secret: utilizador.mfaSecret,
        token: params.token,
      });

      if (!valido) {
        throw new MfaTokenInvalidoError(
          "Código MFA inválido — verifica a app de autenticação.",
        );
      }

      await tx.utilizador.update({
        where: { id: params.utilizadorId },
        data: { mfaActivo: true },
      });

      await tx.logAuditoria.create({
        data: {
          municipioId: utilizador.municipioId,
          utilizadorId: utilizador.id,
          accao: "MFA_ACTIVADO",
          entidade: "Utilizador",
          entidadeId: utilizador.id,
        },
      });
    },
  );
}

export type PasswordResetRequestResult =
  | { estado: "CONTA_NAO_ENCONTRADA" }
  | { estado: "CONTA_NAO_ELEGIVEL" }
  | { estado: "EMAIL_ENVIADO" };

type ResultadoInternoPasswordReset =
  | { estado: "CONTA_NAO_ENCONTRADA" }
  | { estado: "CONTA_NAO_ELEGIVEL" }
  | {
      estado: "EMAIL_ENVIADO";
      utilizador: {
        id: string;
        email: string;
        nomeCompleto: string;
        municipioId: string;
      };
      rawToken: string;
    };

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetRequestResult> {
  const resultado = await withAuthBypass<ResultadoInternoPasswordReset>(
    async (tx: Prisma.TransactionClient) => {
      const utilizador = await tx.utilizador.findUnique({ where: { email } });

      if (!utilizador) {
        return { estado: "CONTA_NAO_ENCONTRADA" };
      }

      if (
        !(TIPOS_COM_RECOVERY_DE_PASSWORD as readonly string[]).includes(
          utilizador.tipoConta,
        )
      ) {
        return { estado: "CONTA_NAO_ELEGIVEL" };
      }

      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiraEm = new Date(
        Date.now() + env.PASSWORD_RESET_EXPIRES_IN_HOURS * 60 * 60 * 1000,
      );

      await tx.passwordResetToken.create({
        data: { utilizadorId: utilizador.id, tokenHash, expiraEm },
      });

      await tx.logAuditoria.create({
        data: {
          municipioId: utilizador.municipioId,
          utilizadorId: utilizador.id,
          accao: "PASSWORD_RECOVERY_SOLICITADO",
          entidade: "Utilizador",
          entidadeId: utilizador.id,
        },
      });

      return { estado: "EMAIL_ENVIADO", utilizador, rawToken };
    },
  );

  if (resultado.estado === "EMAIL_ENVIADO") {
    const resetUrl = `${env.FRONTEND_URL}/redefinir-password?token=${resultado.rawToken}`;

    try {
      const municipio = await withTenantTransaction(
        resultado.utilizador.municipioId,
        (tx: Prisma.TransactionClient) =>
          tx.municipio.findUniqueOrThrow({
            where: { id: resultado.utilizador.municipioId },
            select: { nome: true },
          }),
      );

      await sendPasswordResetEmail({
        to: resultado.utilizador.email,
        toName: resultado.utilizador.nomeCompleto,
        municipioNome: municipio.nome,
        resetUrl,
        expiresInHours: env.PASSWORD_RESET_EXPIRES_IN_HOURS,
      });
    } catch (error) {
      console.error("Falha ao enviar email de recuperação de password:", error);
    }
  }

  return { estado: resultado.estado };
}

export async function resetPassword(
  rawToken: string,
  novaPassword: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const passwordHash = await hashPassword(novaPassword);

  const tokenData = await withAuthBypass(
    async (tx: Prisma.TransactionClient) => {
      const tokenRecord = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
      });

      if (!tokenRecord) {
        throw new TokenRedefinicaoInvalidoError(
          "Token de redefinição inválido.",
        );
      }
      if (tokenRecord.usadoEm) {
        throw new TokenRedefinicaoInvalidoError(
          "Este link de redefinição já foi usado.",
        );
      }
      if (tokenRecord.expiraEm < new Date()) {
        throw new TokenRedefinicaoInvalidoError(
          "Este link de redefinição expirou. Pede um novo.",
        );
      }

      const utilizador = await tx.utilizador.findUniqueOrThrow({
        where: { id: tokenRecord.utilizadorId },
        select: { municipioId: true },
      });

      return { tokenRecord, municipioId: utilizador.municipioId };
    },
  );

  await withTenantTransaction(
    tokenData.municipioId,
    async (tx: Prisma.TransactionClient) => {
      await tx.passwordResetToken.update({
        where: { id: tokenData.tokenRecord.id },
        data: { usadoEm: new Date() },
      });

      await tx.utilizador.update({
        where: { id: tokenData.tokenRecord.utilizadorId },
        data: {
          passwordHash,
          deveTrocarPassword: false,
          tentativasLoginFalhadas: 0,
          bloqueadoAte: null,
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          utilizadorId: tokenData.tokenRecord.utilizadorId,
          revogadoEm: null,
        },
        data: { revogadoEm: new Date() },
      });

      const utilizador = await tx.utilizador.findUniqueOrThrow({
        where: { id: tokenData.tokenRecord.utilizadorId },
      });

      await tx.logAuditoria.create({
        data: {
          municipioId: utilizador.municipioId,
          utilizadorId: utilizador.id,
          accao: "PASSWORD_REDEFINIDA_POR_RECOVERY",
          entidade: "Utilizador",
          entidadeId: utilizador.id,
        },
      });
    },
  );
}
