/**
 * NIGHTWIRE v2.0.1 — Checkpoint System (.mjs)
 * Checkpoint and save-state persistence.
 */

const STORAGE_KEY = 'nightwire.checkpoint.v1';

export function createCheckpointSystem() {
  let checkpoint = null;

  function save(data) {
    checkpoint = {
      ...data,
      savedAt: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoint));
    } catch (error) {
      checkpoint = data;
    }

    return checkpoint;
  }

  function load() {
    if (checkpoint) return checkpoint;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      checkpoint = JSON.parse(raw);
      return checkpoint;
    } catch (error) {
      return null;
    }
  }

  function clear() {
    checkpoint = null;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Storage may be unavailable in private mode.
    }
  }

  return {
    save,
    load,
    clear
  };
}
