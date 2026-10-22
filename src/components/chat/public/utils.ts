import type { ChatMessage, MessageGroup } from './types';

export const TEMP_ID_PREFIX = 'temp-';

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    (v.direction === 'IN' || v.direction === 'OUT') &&
    typeof v.content === 'string' &&
    typeof v.createdAt === 'string'
  );
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - messageDay.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString('ru-RU', { weekday: 'long' });
  }
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function groupByDay(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const key = dayKey(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === key) {
      last.messages.push(msg);
    } else {
      groups.push({
        dayKey: key,
        dayLabel: formatDayLabel(msg.createdAt),
        messages: [msg],
      });
    }
  }
  return groups;
}