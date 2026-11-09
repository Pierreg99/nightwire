/**
 * Machala Integration & Wiring Pass v1
 * Lightweight event bus for cross-system communication.
 */

export function createEventBus() {
  const listeners = new Map();

  function on(event, listener) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(listener);

    return () => {
      listeners.get(event)?.delete(listener);
    };
  }

  function once(event, listener) {
    const unsubscribe = on(event, (payload) => {
      listener(payload);
      unsubscribe();
    });

    return unsubscribe;
  }

  function emit(event, payload = {}) {
    const eventListeners = listeners.get(event);

    if (!eventListeners) return;

    eventListeners.forEach((listener) => listener(payload));
  }

  function clear() {
    listeners.clear();
  }

  return {
    on,
    once,
    emit,
    clear
  };
}
