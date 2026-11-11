import type { DealPriority } from './types';

export const PRIORITY_DOT: Record<DealPriority, string> = {
  URGENT: 'bg-red-500 shadow-sm shadow-red-500/40',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

export const PRIORITY_LABEL: Record<DealPriority, string> = {
  URGENT: 'Срочный',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
};