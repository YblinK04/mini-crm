import { ApiError } from './api';

export function validateBaseUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return 'Укажите URL';
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:') return 'Telegram принимает только HTTPS';
    return null;
  } catch {
    return 'Некорректный URL';
  }
}

export function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Сессия истекла — обновите страницу';
    if (err.status === 403) return 'Недостаточно прав';
    return err.details ? `${err.message}: ${err.details}` : err.message;
  }
  return err instanceof Error ? err.message : 'Неизвестная ошибка';
}