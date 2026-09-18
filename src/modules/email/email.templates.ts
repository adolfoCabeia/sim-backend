function baseLayout(bodyHtml: string, municipioNome: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="padding: 24px 0; border-bottom: 2px solid #0b5fae;">
        <strong style="font-size: 18px; color: #0b5fae;">SIM-${municipioNome}</strong>
      </div>
      <div style="padding: 24px 0;">
        ${bodyHtml}
      </div>
      <div style="padding: 16px 0; border-top: 1px solid #e2e2e2; font-size: 12px; color: #888;">
        Administração Municipal de ${municipioNome} — esta é uma mensagem automática, não responda a este email.
      </div>
    </div>
  `;
}

export interface EmailContent {
  subject: string;
  html: string;
}

export function confirmationEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  confirmationUrl: string;
  expiresInHours: number;
}): EmailContent {
  return {
    subject: `Bem-vindo ao SIM-${params.municipioNome} — Confirme o seu email`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p><strong>Bem-vindo ao SIM-${params.municipioNome}</strong> — o Sistema Integrado Municipal de ${params.municipioNome}.</p>
      <p>Para activar a sua conta, confirme o seu email:</p>
      <p>
        <a href="${params.confirmationUrl}"
           style="display: inline-block; padding: 10px 20px; background: #0b5fae; color: #fff; text-decoration: none; border-radius: 4px;">
          Confirmar o meu email
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Este link expira em ${params.expiresInHours} horas. Se não foi você que se registou, ignore este email.
      </p>
    `,
      params.municipioNome
    ),
  };
}

export function contaBloqueadaEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  dataHoraBloqueio: Date;
  duracaoBloqueioMinutos: number;
  ipOrigem?: string;
}): EmailContent {
  const dataFormatada = params.dataHoraBloqueio.toLocaleString("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    subject: `SIM-${params.municipioNome} — A sua conta foi temporariamente bloqueada`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>
        A sua conta no SIM-${params.municipioNome} foi temporariamente bloqueada em ${dataFormatada}
        depois de várias tentativas de início de sessão falhadas.
      </p>
      <p>
        O bloqueio dura aproximadamente ${params.duracaoBloqueioMinutos} minutos,
        após os quais pode tentar novamente.
      </p>
      ${
        params.ipOrigem
          ? `<p style="font-size: 13px; color: #666;">Endereço de origem registado: ${params.ipOrigem}</p>`
          : ""
      }
      <p style="font-size: 13px; color: #666;">
        Se não foi você que tentou iniciar sessão, recomendamos que altere a sua
        password assim que conseguir aceder à conta novamente, e contacte a
        Administração Municipal caso suspeite de acesso indevido.
      </p>
    `,
      params.municipioNome
    ),
  };
}
export function passwordResetEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  resetUrl: string;
  expiresInHours: number;
}): EmailContent {
  return {
    subject: `SIM-${params.municipioNome} — Recuperação de password`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>Recebemos um pedido para redefinir a password da sua conta no SIM-${params.municipioNome}.</p>
      <p>
        <a href="${params.resetUrl}"
           style="display: inline-block; padding: 10px 20px; background: #0b5fae; color: #fff; text-decoration: none; border-radius: 4px;">
          Redefinir a minha password
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Este link expira em ${params.expiresInHours} hora(s). Se não foi você que pediu esta
        recuperação, ignore este email — a sua password actual continua válida.
      </p>
    `,
      params.municipioNome
    ),
  };
}

export function contaInternaCriadaEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  email: string;
  password: string;
  loginUrl: string;
  direcaoSigla: string;
}): EmailContent {
  return {
    subject: `SIM-${params.municipioNome} — A sua conta interna foi criada`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>
        A sua conta interna no SIM-${params.municipioNome} foi criada com sucesso, associada à
        direcção <strong>${params.direcaoSigla}</strong>. Ficam registados abaixo os seus dados de acesso:
      </p>
      <p style="font-size: 14px;">
        Email: <strong>${params.email}</strong><br/>
        Password: <span style="font-size: 18px; font-weight: bold; letter-spacing: 1px; background: #f2f2f2; padding: 4px 10px; border-radius: 4px; display: inline-block;">${params.password}</span>
      </p>
      <p>
        A sua conta fica com o estado <strong>PENDENTE_VALIDAÇÃO</strong> até que a sua identidade
        seja confirmada por um administrador. Guarde esta password em local seguro e não a
        partilhe com ninguém.
      </p>
      <p>
        <a href="${params.loginUrl}"
           style="display: inline-block; padding: 10px 20px; background: #0b5fae; color: #fff; text-decoration: none; border-radius: 4px;">
          Iniciar sessão
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Se não foi o(a) autor(a) deste registo, contacte imediatamente o Administrador Municipal.
      </p>
    `,
      params.municipioNome
    ),
  };
}

export function temporaryPasswordEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  temporaryPassword: string;
  loginUrl: string;
  redefinidoPorNome: string;
}): EmailContent {
  return {
    subject: `SIM-${params.municipioNome} — A sua password foi redefinida`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>
        ${params.redefinidoPorNome} redefiniu a password da sua conta no SIM-${params.municipioNome}.
        A sua password temporária é:
      </p>
      <p style="font-size: 18px; font-weight: bold; letter-spacing: 1px; background: #f2f2f2; padding: 10px 16px; border-radius: 4px; display: inline-block;">
        ${params.temporaryPassword}
      </p>
      <p>
        Por segurança, esta password é <strong>temporária</strong> — ao iniciar sessão com ela,
        vai ser-lhe pedido de imediato para escolher uma password nova antes de poder usar o
        sistema.
      </p>
      <p>
        <a href="${params.loginUrl}"
           style="display: inline-block; padding: 10px 20px; background: #0b5fae; color: #fff; text-decoration: none; border-radius: 4px;">
          Iniciar sessão
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Se não esperava esta alteração, contacte imediatamente o Recursos Humanos ou o
        Administrador Municipal.
      </p>
    `,
      params.municipioNome
    ),
  };
}

export function processoConcluidoEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  numeroProcesso: string;
  assunto: string;
  resultado?: string | null | undefined;
}): EmailContent {
  return {
    subject: `SIM-${params.municipioNome} — O seu processo ${params.numeroProcesso} foi concluído`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>
        Informamos que o seu processo / documento <strong>N.º ${params.numeroProcesso}</strong> com o assunto
        <em>"${params.assunto}"</em> foi concluído.
      </p>
      <div style="background: #f9f9f9; padding: 16px; border-left: 4px solid #0b5fae; margin: 16px 0; border-radius: 4px;">
        <strong style="color: #333;">Resultado / Despacho:</strong>
        <p style="margin: 8px 0 0 0; color: #555;">${params.resultado ?? "O seu processo foi concluído com sucesso."}</p>
      </div>
      <p>
        Pode aceder ao portal do <strong>SIM-${params.municipioNome}</strong> para consultar todos os detalhes e descarregar os documentos associados.
      </p>
    `,
      params.municipioNome
    ),
  };
}

export function processoAtualizadoEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  numeroProcesso: string;
  assunto: string;
  titulo: string;
  mensagem: string;
  observacao?: string | null | undefined;
}): EmailContent {
  return {
    subject: `SIM-${params.municipioNome} — Processo N.º ${params.numeroProcesso}: ${params.titulo}`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>Existe uma atualização no processo / documento <strong>N.º ${params.numeroProcesso}</strong> (Assunto: <em>"${params.assunto}"</em>):</p>
      <div style="background: #f9f9f9; padding: 16px; border-left: 4px solid #0b5fae; margin: 16px 0; border-radius: 4px;">
        <strong style="color: #0b5fae; font-size: 15px;">${params.titulo}</strong>
        <p style="margin: 8px 0 0 0; color: #333;">${params.mensagem}</p>
        ${
          params.observacao
            ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #666; font-style: italic;">Observação: ${params.observacao}</p>`
            : ""
        }
      </div>
      <p>Pode aceder ao portal do <strong>SIM-${params.municipioNome}</strong> para acompanhar a evolução do processo.</p>
    `,
      params.municipioNome
    ),
  };

  
}

export function comissaoCredenciaisEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  email: string;
  password: string;
  loginUrl: string;
}): EmailContent {
  return {
    subject: `SIM-${params.municipioNome} — Conta da Comissão de Moradores criada`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>
        Foi criada uma conta de acesso para a Comissão de Moradores no
        SIM-${params.municipioNome}, por um funcionário municipal. Seguem os dados de acesso:
      </p>
      <p style="font-size: 14px;">
        Email: <strong>${params.email}</strong><br/>
        Password: <span style="font-size: 18px; font-weight: bold; letter-spacing: 1px; background: #f2f2f2; padding: 4px 10px; border-radius: 4px; display: inline-block;">${params.password}</span>
      </p>
      <p>
        Por segurança, ao iniciar sessão pela primeira vez vai ser-lhe pedido para escolher
        uma password nova. Guarde esta password provisória em local seguro até lá.
      </p>
      <p>
        <a href="${params.loginUrl}"
           style="display: inline-block; padding: 10px 20px; background: #0b5fae; color: #fff; text-decoration: none; border-radius: 4px;">
          Iniciar sessão
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Se não esperava esta conta, contacte imediatamente a Administração Municipal.
      </p>
    `,
      params.municipioNome
    ),
  };
}

export function sessaoTerminadaPorNovoLoginEmailTemplate(params: {
  nomeCompleto: string;
  municipioNome: string;
  dataHora: Date;
  ipNovoLogin?: string;
}): EmailContent {
  const dataFormatada = params.dataHora.toLocaleString("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    subject: `SIM-${params.municipioNome} — Nova sessão iniciada na sua conta`,
    html: baseLayout(
      `
      <p>Olá ${params.nomeCompleto},</p>
      <p>
        A sua sessão anterior no SIM-${params.municipioNome} foi terminada porque foi iniciado
        um novo login na sua conta em ${dataFormatada}, a partir de outro dispositivo.
      </p>
      ${
        params.ipNovoLogin
          ? `<p style="font-size: 13px; color: #666;">Endereço de origem do novo login: ${params.ipNovoLogin}</p>`
          : ""
      }
      <p style="font-size: 13px; color: #666;">
        Se foi você, pode ignorar este email. Se não reconhece este acesso, altere a sua
        password imediatamente e contacte a Administração Municipal.
      </p>
    `,
      params.municipioNome
    ),
  };
}