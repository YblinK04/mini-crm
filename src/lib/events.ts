
type Handler<T = unknown> = (payload: T) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<Handler>>();

  on<T = unknown>(event: string, handler: Handler<T>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler);

    return () => {
      set!.delete(handler as Handler);
    };
  }

  once<T = unknown>(event: string, handler: Handler<T>): () => void {
    const off = this.on<T>(event, async (payload) => {
      off();
      await handler(payload);
    });
    return off;
  }

  async emit<T = unknown>(event: string, payload: T): Promise<void> {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;

    const snapshot = Array.from(set);

    for (const handler of snapshot) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[eventbus] handler for "${event}" failed:`, error);
      }
    }
  }
}

export const events = new EventBus();