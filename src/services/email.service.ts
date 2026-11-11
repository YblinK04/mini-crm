import nodemailer, { type Transporter } from 'nodemailer';
import { getSettings } from '@/lib/settings';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

const TIMEOUT_MS = 10_000;

function buildConfig(
  settings: NonNullable<Awaited<ReturnType<typeof getSettings>>>,
): SmtpConfig | null {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
    return null;
  }

  const port = settings.smtpPort ?? 465;
  const secure =
    (settings as { smtpSecure?: boolean }).smtpSecure ?? port === 465;

  return {
    host: settings.smtpHost,
    port,
    secure,
    user: settings.smtpUser,
    pass: settings.smtpPassword,
    from: settings.smtpFrom || settings.smtpUser,
  };
}

function createTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,

    requireTLS: !config.secure,

    auth: {
      user: config.user,
      pass: config.pass,
    },

    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const settings = await getSettings();
  const config = settings ? buildConfig(settings) : null;

  if (!config) {
    console.warn('[email] SMTP не настроен — пропускаем отправку');
    return false;
  }

  try {
    const transporter = createTransporter(config);
    await transporter.sendMail({
      from: config.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    console.log(`✅ [email] Отправлено на ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error('[email] Ошибка отправки:', error);
    return false;
  }
}

export async function testSmtpConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const settings = await getSettings();
  const config = settings ? buildConfig(settings) : null;

  if (!config) {
    return { ok: false, error: 'SMTP не настроен' };
  }

  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}