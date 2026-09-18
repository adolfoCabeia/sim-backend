import { dispatchEmail } from "./email.transport.js";
import { env } from "../../config/env.js";
import {
  confirmationEmailTemplate,
  contaBloqueadaEmailTemplate,
  passwordResetEmailTemplate,
  temporaryPasswordEmailTemplate,
  contaInternaCriadaEmailTemplate,
  processoConcluidoEmailTemplate,
  processoAtualizadoEmailTemplate,
  comissaoCredenciaisEmailTemplate,
  sessaoTerminadaPorNovoLoginEmailTemplate,
} from "./email.templates.js";

export async function sendConfirmationEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  confirmationUrl: string;
  expiresInHours: number;
}): Promise<void> {
  const { subject, html } = confirmationEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    confirmationUrl: params.confirmationUrl,
    expiresInHours: params.expiresInHours,
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

export async function sendContaBloqueadaEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  dataHoraBloqueio: Date;
  duracaoBloqueioMinutos: number;
  ipOrigem?: string;
}): Promise<void> {
  const { subject, html } = contaBloqueadaEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    dataHoraBloqueio: params.dataHoraBloqueio,
    duracaoBloqueioMinutos: params.duracaoBloqueioMinutos,
    ...(params.ipOrigem !== undefined && { ipOrigem: params.ipOrigem }),
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  resetUrl: string;
  expiresInHours: number;
}): Promise<void> {
  const { subject, html } = passwordResetEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    resetUrl: params.resetUrl,
    expiresInHours: params.expiresInHours,
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

export async function sendContaInternaCriadaEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  password: string;
  direcaoSigla: string;
}): Promise<void> {
  const { subject, html } = contaInternaCriadaEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    email: params.to,
    password: params.password,
    loginUrl: `${env.FRONTEND_URL}/login`,
    direcaoSigla: params.direcaoSigla,
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

export async function sendTemporaryPasswordEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  temporaryPassword: string;
  loginUrl: string;
  redefinidoPorNome: string;
}): Promise<void> {
  const { subject, html } = temporaryPasswordEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    temporaryPassword: params.temporaryPassword,
    loginUrl: params.loginUrl,
    redefinidoPorNome: params.redefinidoPorNome,
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

export async function sendProcessoConcluidoEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  numeroProcesso: string;
  assunto: string;
  resultado?: string | null | undefined;
}): Promise<void> {
  const { subject, html } = processoConcluidoEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    numeroProcesso: params.numeroProcesso,
    assunto: params.assunto,
    resultado: params.resultado,
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

export async function sendProcessoAtualizadoEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  numeroProcesso: string;
  assunto: string;
  titulo: string;
  mensagem: string;
  observacao?: string | null | undefined;
}): Promise<void> {
  const { subject, html } = processoAtualizadoEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    numeroProcesso: params.numeroProcesso,
    assunto: params.assunto,
    titulo: params.titulo,
    mensagem: params.mensagem,
    observacao: params.observacao,
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

/**
 * NOVO: envia as credenciais de acesso à Comissão de Moradores, criada por
 * um funcionário municipal. Precisamos do municipioNome, por isso quem
 * chama esta função (auth.service.ts) já resolve isso antes de invocar.
 */
export async function sendComissaoCredenciaisEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  password: string;
  loginUrl: string;
}): Promise<void> {
  const { subject, html } = comissaoCredenciaisEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    email: params.to,
    password: params.password,
    loginUrl: params.loginUrl,
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}

/**
 * NOVO: alerta enviado quando uma sessão de INTERNO é terminada à força
 * por um novo login (forcarNovaSessao: true), para que o titular da conta
 * detecte rapidamente uso indevido de credenciais.
 */
export async function sendSessaoTerminadaPorNovoLoginEmail(params: {
  to: string;
  toName: string;
  municipioNome: string;
  dataHora: Date;
  ipNovoLogin?: string;
}): Promise<void> {
  const { subject, html } = sessaoTerminadaPorNovoLoginEmailTemplate({
    nomeCompleto: params.toName,
    municipioNome: params.municipioNome,
    dataHora: params.dataHora,
    ...(params.ipNovoLogin !== undefined && { ipNovoLogin: params.ipNovoLogin }),
  });

  await dispatchEmail({ to: params.to, toName: params.toName, subject, html });
}