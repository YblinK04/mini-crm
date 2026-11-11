import { describe, it, expect, beforeEach } from 'vitest';
import { NaiveBayesClassifier } from './classifier';

describe('NaiveBayesClassifier', () => {
  let classifier: NaiveBayesClassifier;

  beforeEach(() => {
    classifier = new NaiveBayesClassifier();
    classifier.train([
      { text: 'Хочу купить сайт', label: 'LEAD' },
      { text: 'Сколько стоит разработка', label: 'LEAD' },
      { text: 'Интересует ваша услуга', label: 'LEAD' },
      { text: 'Хочу заказать консультацию', label: 'LEAD' },
      { text: 'Нужна помощь с проектом', label: 'LEAD' },
      { text: 'Давайте обсудим заказ', label: 'LEAD' },
      { text: 'Заработок 100к в день без вложений', label: 'SPAM' },
      { text: 'Купите наш курс по крипте', label: 'SPAM' },
      { text: 'Подписывайтесь на мой канал', label: 'SPAM' },
      { text: 'Увеличу ваши продажи в 10 раз', label: 'SPAM' },
      { text: 'Займ онлайн без отказа', label: 'SPAM' },
      { text: 'Не работает оплата', label: 'COMPLAINT' },
      { text: 'Вы не отвечаете третий день', label: 'COMPLAINT' },
      { text: 'Когда вы уже доделаете заказ', label: 'COMPLAINT' },
      { text: 'Хочу вернуть деньги за брак', label: 'COMPLAINT' },
      { text: 'Спасибо за работу', label: 'OTHER' },
      { text: 'Хорошего дня', label: 'OTHER' },
      { text: 'Понял, благодарю', label: 'OTHER' },
    ]);
  });

  describe('train()', () => {
    it('обучается без ошибок на валидных данных', () => {
      expect(() => {
        const c = new NaiveBayesClassifier();
        c.train([{ text: 'привет', label: 'OTHER' }]);
      }).not.toThrow();
    });

    it('не падает на пустом массиве', () => {
      const c = new NaiveBayesClassifier();
      expect(() => c.train([])).not.toThrow();
    });

    it('после train([]) модель остаётся в пустом состоянии', () => {
      const c = new NaiveBayesClassifier();
      c.train([]);
      expect(() => c.predict('любой текст')).not.toThrow();
      expect(c.predict('любой текст').label).toBe('OTHER');
    });

    it('train() дважды заменяет данные, а не накапливает', () => {
      const c = new NaiveBayesClassifier();
      c.train([{ text: 'хочу купить сайт', label: 'LEAD' }]);
      c.train([{ text: 'заработок на крипте', label: 'SPAM' }]);
      const result = c.predict('хочу купить сайт');
      expect(result.label).not.toBe('LEAD');
    });
  });

  describe('predict()', () => {
    it('классифицирует лид по ключевым словам', () => {
      const result = classifier.predict('Хочу заказать сайт');
      expect(result.label).toBe('LEAD');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('уверенно распознаёт спам (confidence > 0.6 — порог из handler.ts)', () => {
      const result = classifier.predict('Заработок от 100к без вложений');
      expect(result.label).toBe('SPAM');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('классифицирует жалобу', () => {
      const result = classifier.predict('Оплата не работает третий день');
      expect(result.label).toBe('COMPLAINT');
    });

    it('классифицирует благодарность', () => {
      const result = classifier.predict('Спасибо большое');
      expect(result.label).toBe('OTHER');
    });

    it('возвращает OTHER на пустой модели', () => {
      const empty = new NaiveBayesClassifier();
      const result = empty.predict('любой текст');
      expect(result.label).toBe('OTHER');
      expect(result.confidence).toBe(0);
    });

    it('confidence всегда в диапазоне 0..1', () => {
      const texts = [
        'хочу купить',
        'не работает',
        'спасибо',
        'заработок',
        'непонятный текст который нигде не встречался',
      ];
      for (const text of texts) {
        const result = classifier.predict(text);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('распознаёт похожие формулировки, которых не было в обучении', () => {
      const result = classifier.predict('Хочу заказать разработку');
      expect(result.label).toBe('LEAD');
    });

    it('не путает спам с лидом', () => {
      const result = classifier.predict('Купите крипту и заработайте');
      expect(result.label).toBe('SPAM');
    });


    it('игнорирует регистр', () => {
      const lower = classifier.predict('хочу заказать сайт');
      const upper = classifier.predict('ХОЧУ ЗАКАЗАТЬ САЙТ');
      const mixed = classifier.predict('Хочу Заказать Сайт');
      expect(lower.label).toBe(upper.label);
      expect(lower.label).toBe(mixed.label);
    });

    it('не падает на пустом тексте', () => {
      expect(() => classifier.predict('')).not.toThrow();
    });

    it('не падает на тексте из пробелов', () => {
      expect(() => classifier.predict('   ')).not.toThrow();
    });

    it('на пустом тексте confidence низкий (не мусор)', () => {
      const result = classifier.predict('');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('эмодзи не мешают классификации', () => {
      const result = classifier.predict('🔥💰 заработок 100к 🔥');
      expect(result.label).toBe('SPAM');
    });

    it('амбивалентный "Хочу купить курс" — фиксируем поведение', () => {
      const result = classifier.predict('Хочу купить курс');
      expect(['LEAD', 'SPAM']).toContain(result.label);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('детерминизм: два predict() на одном тексте дают одинаковый результат', () => {
      const a = classifier.predict('хочу заказать сайт');
      const b = classifier.predict('хочу заказать сайт');
      expect(a.label).toBe(b.label);
      expect(a.confidence).toBe(b.confidence);
    });
  });
});