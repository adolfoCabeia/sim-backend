import { randomBytes, createHash } from "node:crypto";
import { prismaAuthBypass, withTenantTransaction, readOnlyComRetry } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { verifyMfaToken } from "./mfa.service.js";
import { issueRefreshToken } from "./jwt.service.js";
import { sendConfirmationEmail, sendContaBloqueadaEmail, sendPasswordResetEmail, sendContaInternaCriadaEmail } from "../email/email.service.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";
import {
  verificarJanelaDeAcesso,
  MENSAGEM_FORA_DO_HORARIO_DE_ACESSO,
} from "../../modules/rh/ponto/ponto.service.js";

const MAX_TENTATIVAS_FALHADAS = 5;
const DURACAO_BLOQUEIO_MS = 15 * 60 * 1000;
const TIPOS_QUE_EXIGEM_CONFIRMACAO_EMAIL = ["CIDADAO", "EMPRESA", "INSTITUICAO"] as const;
const TIPOS_COM_RECOVERY_DE_PASSWORD = ["CIDADAO", "EMPRESA", "INSTITUICAO", "COMISSAO_MORADORES"] as const;

export class CredenciaisInvalidasError extends Error { }
export class ContaBloqueadaError extends Error { }
export class ContaNaoActivaError extends Error { }
export class EmailNaoConfirmadoError extends Error { }
export class MfaObrigatorioError extends Error { }
export class MfaTokenInvalidoError extends Error { }
export class EmailJaExisteError extends Error { }
export class DocumentoJaExisteError extends Error { }
export class DirecaoNaoEncontradaError extends Error { }
export class RegistoInternoNaoPermitidoError extends Error { }
export class TokenConfirmacaoInvalidoError extends Error { }
export class TokenRedefinicaoInvalidoError extends Error { }
export class ForaDoHorarioDeAcessoError extends Error {}


function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUser(input: RegisterInput) {
  if (input.tipoConta === "INTERNO") {
    throw new RegistoInternoNaoPermitidoError(
      "Contas internas não podem ser criadas pelo registo público. Contacta o Administrador Municipal ou o RH."
    );
  }

  const existente = await prismaAuthBypass.utilizador.findUnique({
    where: { email: input.email },
  });

  if (existente) {
    throw new EmailJaExisteError("Já existe uma conta com este email.");
  }

  if (input.documentoNumero) {
    const documentoExistente = await prismaAuthBypass.utilizador.findUnique({
      where: { documentoNumero: input.documentoNumero },
    });
    if (documentoExistente) {
      throw new DocumentoJaExisteError("Já existe uma conta registada com este número de documento.");
    }
  }

  const passwordHash = await hashPassword(input.password);
  const exigeConfirmacaoEmail = (
    TIPOS_QUE_EXIGEM_CONFIRMACAO_EMAIL as readonly string[]
  ).includes(input.tipoConta);

  let direcaoId: string | undefined;
  if (input.direcaoSigla) {
    const direcao = await prismaAuthBypass.direcao.findUnique({
      where: { municipioId_sigla: { municipioId: input.municipioId, sigla: input.direcaoSigla } },
      select: { id: true },
    });
    if (!direcao) {
      throw new DirecaoNaoEncontradaError(
        `A direcção "${input.direcaoSigla}" não existe neste município.`
      );
    }
    direcaoId = direcao.id;
  }

  const utilizador = await prismaAuthBypass.utilizador.create({
    data: {
      municipioId: input.municipioId,
      nomeCompleto: input.nomeCompleto,
      email: input.email,
      passwordHash,
      tipoConta: input.tipoConta,
      ...(direcaoId !== undefined && { direcaoId }),
      emailConfirmado: !exigeConfirmacaoEmail,
      ...(input.areaResponsabilidade !== undefined && { areaResponsabilidade: input.areaResponsabilidade }),
      ...(input.telefone !== undefined && { telefone: input.telefone }),
      ...(input.endereco !== undefined && { endereco: input.endereco }),
      ...(input.documentoTipo !== undefined && { documentoTipo: input.documentoTipo }),
      ...(input.documentoNumero !== undefined && { documentoNumero: input.documentoNumero }),
      ...(input.nomeEmpresa !== undefined && { nomeEmpresa: input.nomeEmpresa }),
      ...(input.nifEmpresa !== undefined && { nifEmpresa: input.nifEmpresa }),
      ...(input.nomeInstituicao !== undefined && { nomeInstituicao: input.nomeInstituicao }),
      ...(input.nipcInstituicao !== undefined && { nipcInstituicao: input.nipcInstituicao }),
      ...(input.nomeComissao !== undefined && { nomeComissao: input.nomeComissao }),
      ...(input.bairroZona !== undefined && { bairroZona: input.bairroZona }),
    },
  });
  {
    const perfilCorrespondente = await prismaAuthBypass.perfil.findFirst({
      where: { nome: input.tipoConta, activo: true },
      select: { id: true },
    });
    if (perfilCorrespondente) {
      await prismaAuthBypass.utilizadorPerfil.create({
        data: { utilizadorId: utilizador.id, perfilId: perfilCorrespondente.id },
      });
    } else {
      console.error(
        `Perfil "${input.tipoConta}" não encontrado no catálogo, a conta ${utilizador.id} ficou sem permissões.`
      );
    }
  }

  await prismaAuthBypass.logAuditoria.create({
    data: {
      municipioId: input.municipioId,
      utilizadorId: utilizador.id,
      accao: "REGISTO_CONTA",
      entidade: "Utilizador",
      entidadeId: utilizador.id,
    },
  });

  if (exigeConfirmacaoEmail) {
    const municipio = await prismaAuthBypass.municipio.findUniqueOrThrow({
      where: { id: input.municipioId },
      select: { nome: true },
    });
    await enviarEmailDeConfirmacao(utilizador.id, utilizador.email, utilizador.nomeCompleto, municipio.nome);
  }

  return utilizador;
}

async function enviarEmailDeConfirmacao(
  utilizadorId: string,
  email: string,
  nomeCompleto: string,
  municipioNome: string
): Promise<void> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiraEm = new Date(
    Date.now() + env.EMAIL_CONFIRMATION_EXPIRES_IN_HOURS * 60 * 60 * 1000
  );

  await prismaAuthBypass.emailConfirmationToken.create({
    data: { utilizadorId, tokenHash, expiraEm },
  });

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

  const tokenRecord = await prismaAuthBypass.emailConfirmationToken.findUnique({
    where: { tokenHash },
  });

  if (!tokenRecord) {
    throw new TokenConfirmacaoInvalidoError("Token de confirmação inválido.");
  }

  if (tokenRecord.usadoEm) {
    throw new TokenConfirmacaoInvalidoError("Este link de confirmação já foi usado.");
  }

  if (tokenRecord.expiraEm < new Date()) {
    throw new TokenConfirmacaoInvalidoError("Este link de confirmação expirou.");
  }

  await prismaAuthBypass.$transaction([
    prismaAuthBypass.emailConfirmationToken.update({
      where: { id: tokenRecord.id },
      data: { usadoEm: new Date() },
    }),
    prismaAuthBypass.utilizador.update({
      where: { id: tokenRecord.utilizadorId },
      data: { emailConfirmado: true, emailConfirmadoEm: new Date() },
    }),
  ]);

  const utilizador = await prismaAuthBypass.utilizador.findUniqueOrThrow({
    where: { id: tokenRecord.utilizadorId },
  });

  await prismaAuthBypass.logAuditoria.create({
    data: {
      municipioId: utilizador.municipioId,
      utilizadorId: utilizador.id,
      accao: "EMAIL_CONFIRMADO",
      entidade: "Utilizador",
      entidadeId: utilizador.id,
    },
  });
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
  context: { ipOrigem?: string; userAgent?: string }
): Promise<LoginResult> {
  const utilizador = await readOnlyComRetry(
    () =>
      prismaAuthBypass.utilizador.findFirst({
        where: {
          OR: [
            { email: input.identificador },
            { documentoNumero: input.identificador },
            { nifEmpresa: input.identificador },
            { nipcInstituicao: input.identificador },
          ],
        },
      }),
    "loginUser: procurar utilizador por identificador"
  );

  if (!utilizador) {
    throw new CredenciaisInvalidasError("Credenciais incorrectas.");
  }

  const bloqueioActivo = utilizador.bloqueadoAte && utilizador.bloqueadoAte > new Date();

  if (bloqueioActivo) {
    const minutosRestantes = Math.ceil(
      (utilizador.bloqueadoAte!.getTime() - Date.now()) / 60000
    );
    throw new ContaBloqueadaError(
      `Conta temporariamente bloqueada. Tenta novamente em ${minutosRestantes} minuto(s).`
    );
  }
  const bloqueioJaExpirou = utilizador.bloqueadoAte !== null;

  if (bloqueioJaExpirou) {
    await prismaAuthBypass.utilizador.update({
      where: { id: utilizador.id },
      data: { tentativasLoginFalhadas: 0, bloqueadoAte: null },
    });
    utilizador.tentativasLoginFalhadas = 0;
    utilizador.bloqueadoAte = null;
  }

  const passwordValida = await verifyPassword(utilizador.passwordHash, input.password);

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
      "Confirme o seu email antes de iniciar sessão. Verifique a sua caixa de entrada."
    );
  }
  if (utilizador.estado === "SUSPENSA" || utilizador.estado === "BLOQUEADA") {
    throw new ContaNaoActivaError(
      `Conta com estado "${utilizador.estado}" — não pode iniciar sessão.`
    );
  }

  if (utilizador.mfaActivo) {
    if (!input.mfaToken) {
      throw new MfaObrigatorioError("Esta conta requer código de autenticação (MFA).");
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
  }
  const [refreshToken] = await Promise.all([
    issueRefreshToken({
      utilizadorId: utilizador.id,
      ...(context.ipOrigem !== undefined && { ipOrigem: context.ipOrigem }),
      ...(context.userAgent !== undefined && { userAgent: context.userAgent }),
    }),
    prismaAuthBypass.logAuditoria.create({
      data: {
        municipioId: utilizador.municipioId,
        utilizadorId: utilizador.id,
        accao: "LOGIN_SUCESSO",
        entidade: "Utilizador",
        entidadeId: utilizador.id,
        ...(context.ipOrigem !== undefined && { ipOrigem: context.ipOrigem }),
      },
    }),
  ]);

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
  const bloqueadoAte = new Date(dataHoraBloqueio.getTime() + DURACAO_BLOQUEIO_MS);

  const utilizador = await prismaAuthBypass.utilizador.update({
    where: { id: params.utilizadorId },
    data: {
      tentativasLoginFalhadas: novasTentativas,
      ...(atingiuLimite && { bloqueadoAte }),
    },
  });

  await prismaAuthBypass.logAuditoria.create({
    data: {
      municipioId: utilizador.municipioId,
      utilizadorId: utilizador.id,
      accao: atingiuLimite ? "CONTA_BLOQUEADA_FORCA_BRUTA" : "LOGIN_FALHADO",
      entidade: "Utilizador",
      entidadeId: utilizador.id,
    },
  });

  if (atingiuLimite && params.emailConfirmado) {
    try {
      const municipio = await prismaAuthBypass.municipio.findUniqueOrThrow({
        where: { id: utilizador.municipioId },
        select: { nome: true },
      });
      await sendContaBloqueadaEmail({
        to: params.email,
        toName: params.nomeCompleto,
        municipioNome: municipio.nome,
        dataHoraBloqueio,
        duracaoBloqueioMinutos: Math.round(DURACAO_BLOQUEIO_MS / 60000),
        ...(params.ipOrigem !== undefined && { ipOrigem: params.ipOrigem }),
      });
    } catch (error) {
      console.error("Falha ao enviar email de alerta de conta bloqueada:", error);
    }
  }
}

export async function initiateMfaSetup(params: { utilizadorId: string; municipioId: string }) {
  const { generateMfaSecret, generateMfaQrCodeUri, generateMfaQrCodeDataUrl } = await import(
    "./mfa.service.js"
  );

  return withTenantTransaction(params.municipioId, async (tx) => {
    const utilizador = await tx.utilizador.findUniqueOrThrow({
      where: { id: params.utilizadorId },
    });

    const secret = generateMfaSecret();
    const otpUri = generateMfaQrCodeUri({ secret, accountEmail: utilizador.email });
    const qrCodeDataUrl = await generateMfaQrCodeDataUrl(otpUri);

    await tx.utilizador.update({
      where: { id: params.utilizadorId },
      data: { mfaSecret: secret },
    });

    return { qrCodeDataUrl, secret };
  });
}

export async function confirmMfaSetup(params: {
  utilizadorId: string;
  municipioId: string;
  token: string;
}): Promise<void> {
  await withTenantTransaction(params.municipioId, async (tx) => {
    const utilizador = await tx.utilizador.findUniqueOrThrow({
      where: { id: params.utilizadorId },
    });

    if (!utilizador.mfaSecret) {
      throw new Error("Configuração de MFA não foi iniciada para esta conta.");
    }

    const valido = await verifyMfaToken({ secret: utilizador.mfaSecret, token: params.token });
    if (!valido) {
      throw new MfaTokenInvalidoError("Código MFA inválido — verifica a app de autenticação.");
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
  });
}

export type PasswordResetRequestResult =
  | { estado: "CONTA_NAO_ENCONTRADA" }
  | { estado: "CONTA_NAO_ELEGIVEL" }
  | { estado: "EMAIL_ENVIADO" };

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  const utilizador = await prismaAuthBypass.utilizador.findUnique({ where: { email } });

  if (!utilizador) {
    return { estado: "CONTA_NAO_ENCONTRADA" };
  }

  if (!(TIPOS_COM_RECOVERY_DE_PASSWORD as readonly string[]).includes(utilizador.tipoConta)) {
    // Contas INTERNO não usam recovery por email — são redefinidas pelo
    // Administrador Municipal/RH via POST /utilizadores/:id/redefinir-password.
    return { estado: "CONTA_NAO_ELEGIVEL" };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiraEm = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_IN_HOURS * 60 * 60 * 1000);

  await prismaAuthBypass.passwordResetToken.create({
    data: { utilizadorId: utilizador.id, tokenHash, expiraEm },
  });

  const resetUrl = `${env.FRONTEND_URL}/redefinir-password?token=${rawToken}`;
  prismaAuthBypass.municipio
    .findUniqueOrThrow({ where: { id: utilizador.municipioId }, select: { nome: true } })
    .then((municipio) =>
      sendPasswordResetEmail({
        to: utilizador.email,
        toName: utilizador.nomeCompleto,
        municipioNome: municipio.nome,
        resetUrl,
        expiresInHours: env.PASSWORD_RESET_EXPIRES_IN_HOURS,
      })
    )
    .catch((error) => {
      console.error("Falha ao enviar email de recuperação de password:", error);
    });

  await prismaAuthBypass.logAuditoria.create({
    data: {
      municipioId: utilizador.municipioId,
      utilizadorId: utilizador.id,
      accao: "PASSWORD_RECOVERY_SOLICITADO",
      entidade: "Utilizador",
      entidadeId: utilizador.id,
    },
  });

  return { estado: "EMAIL_ENVIADO" };
}

export async function resetPassword(rawToken: string, novaPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const tokenRecord = await prismaAuthBypass.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!tokenRecord) {
    throw new TokenRedefinicaoInvalidoError("Token de redefinição inválido.");
  }
  if (tokenRecord.usadoEm) {
    throw new TokenRedefinicaoInvalidoError("Este link de redefinição já foi usado.");
  }
  if (tokenRecord.expiraEm < new Date()) {
    throw new TokenRedefinicaoInvalidoError("Este link de redefinição expirou. Pede um novo.");
  }

  const passwordHash = await hashPassword(novaPassword);

  await prismaAuthBypass.$transaction([
    prismaAuthBypass.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usadoEm: new Date() },
    }),
    prismaAuthBypass.utilizador.update({
      where: { id: tokenRecord.utilizadorId },
      data: {
        passwordHash,
        deveTrocarPassword: false,
        tentativasLoginFalhadas: 0,
        bloqueadoAte: null,
      },
    }),
    prismaAuthBypass.refreshToken.updateMany({
      where: { utilizadorId: tokenRecord.utilizadorId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    }),
  ]);

  const utilizador = await prismaAuthBypass.utilizador.findUniqueOrThrow({
    where: { id: tokenRecord.utilizadorId },
  });

  await prismaAuthBypass.logAuditoria.create({
    data: {
      municipioId: utilizador.municipioId,
      utilizadorId: utilizador.id,
      accao: "PASSWORD_REDEFINIDA_POR_RECOVERY",
      entidade: "Utilizador",
      entidadeId: utilizador.id,
    },
  });
}