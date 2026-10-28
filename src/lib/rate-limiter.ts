interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitStatus {
  limited: boolean;
  remaining: number;
  retryAfterSec: number;
}

const DEFAULT_MAX = 15;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_ENTRIES = 50_000;

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  public check(
    key: string,
    max: number = DEFAULT_MAX,
    windowMs: number = DEFAULT_WINDOW_MS,
  ): RateLimitStatus {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry && this.store.size >= MAX_ENTRIES) {
      return { limited: false, remaining: 0, retryAfterSec: 0 };
    }
    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        limited: false,
        remaining: max - 1,
        retryAfterSec: 0,
      };
    }
    if (entry.count >= max) {
      return {
        limited: true,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }
    entry.count++;
    return {
      limited: false,
      remaining: max - entry.count,
      retryAfterSec: 0,
    };
  }

  public isLimited(
    key: string,
    max: number = DEFAULT_MAX,
    windowMs: number = DEFAULT_WINDOW_MS,
  ): boolean {
    return this.check(key, max, windowMs).limited;
  }

  public peek(key: string): RateLimitStatus {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      return { limited: false, remaining: DEFAULT_MAX, retryAfterSec: 0 };
    }
    if (entry.count >= DEFAULT_MAX) {
      return {
        limited: true,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }
    return {
      limited: false,
      remaining: DEFAULT_MAX - entry.count,
      retryAfterSec: 0,
    };
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

type TimerHandle = ReturnType<typeof setInterval> & { unref?: () => void };

const g = globalThis as typeof globalThis & { __rateLimiterTimer?: TimerHandle };

if (typeof setInterval !== 'undefined' && !g.__rateLimiterTimer) {
  const timer = setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000) as TimerHandle;
  timer.unref?.();
  g.__rateLimiterTimer = timer;
}