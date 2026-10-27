export function formatTaskTime(dueAt: string): string {
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return '—';

  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday) {
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}