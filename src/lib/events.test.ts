import { describe, it, expect, vi } from 'vitest';
import { events } from './events';

const uid = () => `test.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

describe('EventBus', () => {
  it('вызывает подписчика при emit', async () => {
    const eventName = uid();
    const handler = vi.fn();
    events.on(eventName, handler);

    await events.emit(eventName, { foo: 'bar' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('несколько подписчиков — все вызываются', async () => {
    const eventName = uid();
    const h1 = vi.fn();
    const h2 = vi.fn();
    const h3 = vi.fn();
    events.on(eventName, h1);
    events.on(eventName, h2);
    events.on(eventName, h3);

    await events.emit(eventName, {});

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
    expect(h3).toHaveBeenCalledOnce();
  });

  it('отписка работает', async () => {
    const eventName = uid();
    const handler = vi.fn();
    const off = events.on(eventName, handler);
    off();

    await events.emit(eventName, {});

    expect(handler).not.toHaveBeenCalled();
  });


  it('после отписки Map не накапливает пустые Sets', () => {
    const eventName = uid();
    const off = events.on(eventName, vi.fn());
    off();

    const handlersMap = (
      events as unknown as { handlers: Map<string, Set<unknown>> }
    ).handlers;
    expect(handlersMap.has(eventName)).toBe(false);
  });

  it('после отписки последнего из нескольких — Map очищается', () => {
    const eventName = uid();
    const off1 = events.on(eventName, vi.fn());
    const off2 = events.on(eventName, vi.fn());
    const handlersMap = (
      events as unknown as { handlers: Map<string, Set<unknown>> }
    ).handlers;

    off1();
    expect(handlersMap.has(eventName)).toBe(true);  

    off2();
    expect(handlersMap.has(eventName)).toBe(false);
  });


  it('once — вызывает только один раз', async () => {
    const eventName = uid();
    const handler = vi.fn();
    events.once(eventName, handler);

    await events.emit(eventName, {});
    await events.emit(eventName, {});
    await events.emit(eventName, {});

    expect(handler).toHaveBeenCalledOnce();
  });

  it('once снимает handler даже если тот бросил', async () => {
    const eventName = uid();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = vi.fn(() => {
      throw new Error('boom');
    });
    events.once(eventName, handler);

    await events.emit(eventName, {});
    await events.emit(eventName, {});

    expect(handler).toHaveBeenCalledOnce();
    spy.mockRestore();
  });


  it('sync throw в одном handler не ломает других', async () => {
    const eventName = uid();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    events.on(eventName, bad);
    events.on(eventName, good);

    await events.emit(eventName, {});

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('async rejection в handler не ломает других', async () => {
    const eventName = uid();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const bad = vi.fn(async () => {
      throw new Error('async boom');
    });
    const good = vi.fn(async () => {});
    events.on(eventName, bad);
    events.on(eventName, good);

    await events.emit(eventName, {});

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
    spy.mockRestore();
  });


  it('emit без подписчиков не падает', async () => {
    const eventName = uid();
    await expect(events.emit(eventName, {})).resolves.not.toThrow();
  });

  it('события разных имён изолированы', async () => {
    const nameA = uid();
    const nameB = uid();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    events.on(nameA, handlerA);
    events.on(nameB, handlerB);

    await events.emit(nameA, {});

    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).not.toHaveBeenCalled();
  });


  it('async handler дожидается завершения', async () => {
    vi.useFakeTimers();
    const eventName = uid();
    let resolved = false;

    events.on(eventName, async () => {
      await new Promise((r) => setTimeout(r, 20));
      resolved = true;
    });

    const promise = events.emit(eventName, {});
    await vi.advanceTimersByTimeAsync(20);
    await promise;

    expect(resolved).toBe(true);
    vi.useRealTimers();
  });


  it('handler может менять payload', async () => {
    const eventName = uid();
    const payload = { count: 0 };

    events.on(eventName, (p: { count: number }) => {
      p.count++;
    });

    await events.emit(eventName, payload);
    expect(payload.count).toBe(1);
  });

  it('мутация payload видна следующему handler', async () => {
    const eventName = uid();
    const payload = { count: 0 };
    const first = vi.fn((p: { count: number }) => {
      p.count = 42;
    });
    const second = vi.fn();

    events.on(eventName, first);
    events.on(eventName, second);
    await events.emit(eventName, payload);

    expect(second).toHaveBeenCalledWith({ count: 42 });
  });
});