import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from './rate-limiter';

const uid = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    
    rateLimiter = new RateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('пропускает первые N запросов', () => {
    const key = uid();
    for (let i = 0; i < 10; i++) {
      expect(rateLimiter.check(key, 10, 60_000).limited).toBe(false);
    }
  });

  it('блокирует на N+1 запросе', () => {
    const key = uid();
    for (let i = 0; i < 10; i++) rateLimiter.check(key, 10, 60_000);
    expect(rateLimiter.check(key, 10, 60_000).limited).toBe(true);
  });

  it('возвращает retryAfterSec при блокировке', () => {
    const key = uid();
    const WINDOW_MS = 60_000;
    for (let i = 0; i < 5; i++) rateLimiter.check(key, 5, WINDOW_MS);
    const status = rateLimiter.check(key, 5, WINDOW_MS);
    expect(status.limited).toBe(true);
    if (status.limited) {
      expect(status.retryAfterSec).toBeGreaterThan(0);
      expect(status.retryAfterSec).toBeLessThanOrEqual(
        Math.ceil(WINDOW_MS / 1000),
      );
    }
  });

  it('разные ключи не мешают друг другу', () => {
    const keyA = uid();
    const keyB = uid();
    for (let i = 0; i < 5; i++) rateLimiter.check(keyA, 5, 60_000);
    expect(rateLimiter.check(keyA, 5, 60_000).limited).toBe(true);
    expect(rateLimiter.check(keyB, 5, 60_000).limited).toBe(false);
  });


  it('после истечения окна лимит сбрасывается', () => {
    const key = uid();
    for (let i = 0; i < 3; i++) rateLimiter.check(key, 3, 50);
    expect(rateLimiter.check(key, 3, 50).limited).toBe(true);

    vi.advanceTimersByTime(60);   

    expect(rateLimiter.check(key, 3, 50).limited).toBe(false);
  });

  it('внутри окна лимит не сбрасывается', () => {
    const key = uid();
    for (let i = 0; i < 3; i++) rateLimiter.check(key, 3, 1000);
    vi.advanceTimersByTime(500);  
    expect(rateLimiter.check(key, 3, 1000).limited).toBe(true);
  });

  it('лимит 1 — блокирует на втором запросе', () => {
    const key = uid();
    expect(rateLimiter.check(key, 1, 60_000).limited).toBe(false);
    expect(rateLimiter.check(key, 1, 60_000).limited).toBe(true);
  });


  it('remaining уменьшается с каждым запросом', () => {
    const key = uid();
    expect(rateLimiter.check(key, 5, 60_000).remaining).toBe(4);
    expect(rateLimiter.check(key, 5, 60_000).remaining).toBe(3);
    expect(rateLimiter.check(key, 5, 60_000).remaining).toBe(2);
  });

  it('remaining = 0 при блокировке', () => {
    const key = uid();
    for (let i = 0; i < 3; i++) rateLimiter.check(key, 3, 60_000);
    const blocked = rateLimiter.check(key, 3, 60_000);
    expect(blocked.limited).toBe(true);
    expect(blocked.remaining).toBe(0);
  });


  it('повторные заблокированные запросы не увеличивают счётчик', () => {
    const key = uid();
    const WINDOW_MS = 60_000;
    for (let i = 0; i < 3; i++) rateLimiter.check(key, 3, WINDOW_MS);

    for (let i = 0; i < 10; i++) {
      expect(rateLimiter.check(key, 3, WINDOW_MS).limited).toBe(true);
    }

    const status = rateLimiter.check(key, 3, WINDOW_MS);
    expect(status.retryAfterSec).toBeLessThanOrEqual(
      Math.ceil(WINDOW_MS / 1000),
    );
  });


  it('isLimited() возвращает то же, что check().limited', () => {
    const key = uid();
    for (let i = 0; i < 3; i++) rateLimiter.check(key, 3, 60_000);
    expect(rateLimiter.isLimited(key, 3, 60_000)).toBe(true);
    expect(rateLimiter.check(key, 3, 60_000).limited).toBe(true);
  });
});