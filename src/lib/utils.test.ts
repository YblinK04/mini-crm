import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatRelativeTime,
  getRandomColor,
  truncateText,
  getPriorityBadgeVariant,
  getPriorityLabel,
  getStatusColor,
} from './utils';

describe('cn', () => {
  it('склеивает две строки', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('убирает undefined, null, false', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('мержит конфликтующие Tailwind-классы (побеждает последний)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('условные классы через объект', () => {
    expect(cn('base', { active: true, inactive: false })).toBe('base active');
  });

  it('пустой вызов', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('принимает Date', () => {
    const d = new Date(2026, 10, 3);
    const result = formatDate(d);
    expect(result).toMatch(/\b0?3\b/); 
    expect(result).toMatch(/ноя/i);   
  });

  it('принимает строку', () => {
    const result = formatDate('2026-11-03T12:00:00.000Z');
    expect(result).toMatch(/\b0?3\b/);
  });

  it('возвращает строку с годом', () => {
    expect(formatDate('2026-11-03T12:00:00.000Z')).toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  it('"Только что" для свежей даты', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Только что');
  });

  it('"Только что" для будущей даты', () => {
    const future = new Date(Date.now() + 60_000);
    expect(formatRelativeTime(future)).toBe('Только что');
  });

  it('минуты для 5 минут назад', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(d)).toMatch(/5 мин/);
  });

  it('часы для 3 часов назад', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(d)).toMatch(/3 ч/);
  });

  it('дни для 2 дней назад', () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(d)).toMatch(/2 дн/);
  });

  it('для старой даты (>7 дней) возвращает абсолютную', () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const result = formatRelativeTime(d);
    expect(result).not.toMatch(/назад/i);
    expect(result).toMatch(/\d{4}/);
  });

  it('принимает строку как дату', () => {
    const iso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(() => formatRelativeTime(iso)).not.toThrow();
  });
});

describe('getRandomColor', () => {
  it('возвращает строку', () => {
    expect(typeof getRandomColor()).toBe('string');
  });

  it('всегда HEX-формат', () => {
    for (let i = 0; i < 10; i++) {
      expect(getRandomColor()).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('цвет из известной палитры', () => {
    const allowed = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#ec4899', '#06b6d4',
    ];
    for (let i = 0; i < 10; i++) {
      expect(allowed).toContain(getRandomColor());
    }
  });
});

describe('truncateText', () => {
  it('не трогает текст короче лимита', () => {
    expect(truncateText('Привет', 10)).toBe('Привет');
  });

  it('не трогает текст точно по лимиту', () => {
    expect(truncateText('12345', 5)).toBe('12345');
  });

  it('обрезает и добавляет "..."', () => {
    expect(truncateText('12345678', 5)).toBe('12345...');
  });

  it('обрабатывает пустую строку', () => {
    expect(truncateText('', 5)).toBe('');
  });
});

describe('getPriorityBadgeVariant', () => {
  it.each([
    ['URGENT', 'destructive'],
    ['HIGH', 'default'],
    ['MEDIUM', 'secondary'],
    ['LOW', 'outline'],
    ['UNKNOWN', 'outline'],
  ])('%s → %s', (priority, expected) => {
    expect(getPriorityBadgeVariant(priority)).toBe(expected);
  });
});

describe('getPriorityLabel', () => {
  it.each([
    ['URGENT', 'Критично'],
    ['HIGH', 'Высокий'],
    ['MEDIUM', 'Средний'],
    ['LOW', 'Низкий'],
    ['UNKNOWN', 'Низкий'],
  ])('%s → %s', (priority, expected) => {
    expect(getPriorityLabel(priority)).toBe(expected);
  });
});

describe('getStatusColor', () => {
  it('TODO содержит серый', () => {
    expect(getStatusColor('TODO')).toContain('gray');
  });

  it('DONE содержит зелёный', () => {
    expect(getStatusColor('DONE')).toContain('green');
  });

  it('IN_PROGRESS содержит синий', () => {
    expect(getStatusColor('IN_PROGRESS')).toContain('blue');
  });

  it('неизвестный статус → серый по умолчанию', () => {
    expect(getStatusColor('UNKNOWN')).toContain('gray');
  });
});