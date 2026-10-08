
export const DEFAULT_HOUR = 18;

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateFromInput(value: string, hours: number): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, hours, 0, 0, 0);
}

export function defaultDueDate(): Date {
  const now = new Date();
  const d = new Date(now);
  d.setHours(DEFAULT_HOUR, 0, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}