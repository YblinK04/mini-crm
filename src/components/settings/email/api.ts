import type { EmailFormState, EmailSettingsData } from './types';

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({}));
  const fieldErrors = (err as {
    details?: { fieldErrors?: Record<string, string[]> };
  }).details?.fieldErrors;

  if (fieldErrors) {
    return Object.entries(fieldErrors)
      .flatMap(([field, msgs]) =>
        (msgs as string[]).map((m) => `${field}: ${m}`),
      )
      .join('; ');
  }
  return (err as { error?: string }).error || `Сервер вернул ${res.status}`;
}

export async function fetchEmailSettings(): Promise<EmailSettingsData> {
  const res = await fetch('/api/settings/email');
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function saveEmailSettings(
  form: EmailFormState,
): Promise<void> {
  const payload: Record<string, unknown> = { ...form };
  if (!payload.smtpPassword) delete payload.smtpPassword;

  const res = await fetch('/api/settings/email', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function testSmtp(): Promise<void> {
  const res = await fetch('/api/settings/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'test-connection' }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const result = await res.json();
  if (!result.ok) {
    throw new Error(result.error || 'Ошибка подключения');
  }
}

export async function sendTestEmail(): Promise<void> {
  const res = await fetch('/api/settings/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send-test' }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const result = await res.json();
  if (!result.ok) throw new Error('Не удалось отправить');
}