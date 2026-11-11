import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

import { parseJsonRecord } from './pipeline.service';

describe('parseJsonRecord', () => {
  describe('пустые значения', () => {
    it('null → {}', () => {
      expect(parseJsonRecord(null)).toEqual({});
    });

    it('undefined → {}', () => {
      expect(parseJsonRecord(undefined)).toEqual({});
    });
  });

  describe('невалидные типы', () => {
    it('массив → {}', () => {
      expect(parseJsonRecord([1, 2, 3])).toEqual({});
    });

    it('строка → {}', () => {
      expect(parseJsonRecord('строка')).toEqual({});
    });

    it('число → {}', () => {
      expect(parseJsonRecord(42)).toEqual({});
    });

    it('boolean → {}', () => {
      expect(parseJsonRecord(true)).toEqual({});
    });
  });

  describe('объекты', () => {
    it('пустой объект → {}', () => {
      expect(parseJsonRecord({})).toEqual({});
    });

    it('пропускает только строковые значения', () => {
      expect(
        parseJsonRecord({
          a: 'x',
          b: 123,
          c: true,
          d: null,
        }),
      ).toEqual({ a: 'x' });
    });

    it('вложенный объект игнорируется', () => {
      expect(
        parseJsonRecord({
          a: { nested: 'value' },
          b: 'keep',
        }),
      ).toEqual({ b: 'keep' });
    });

    it('вложенный массив игнорируется', () => {
      expect(
        parseJsonRecord({
          a: [1, 2, 3],
          b: 'ok',
        }),
      ).toEqual({ b: 'ok' });
    });

    it('сохраняет все строковые поля', () => {
      expect(
        parseJsonRecord({
          Город: 'Москва',
          VIN: 'ABC123',
          Телефон: '+7 999 123-45-67',
        }),
      ).toEqual({
        Город: 'Москва',
        VIN: 'ABC123',
        Телефон: '+7 999 123-45-67',
      });
    });

    it('сохраняет пустые строки как значения', () => {
      expect(parseJsonRecord({ key: '', other: 'val' })).toEqual({
        key: '',
        other: 'val',
      });
    });

    it('сохраняет юникод и спецсимволы в ключах', () => {
      expect(
        parseJsonRecord({
          'Дата рождения': '01.01.1990',
          'Email (рабочий)': 'a@b.ru',
        }),
      ).toEqual({
        'Дата рождения': '01.01.1990',
        'Email (рабочий)': 'a@b.ru',
      });
    });

    it('не падает на глубокой вложенности', () => {
      const deep = {
        a: 'yes',
        b: { c: { d: { e: { f: 'deep' } } } },
      };
      expect(parseJsonRecord(deep)).toEqual({ a: 'yes' });
    });
  });
});