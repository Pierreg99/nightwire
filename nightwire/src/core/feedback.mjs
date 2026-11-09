/**
 * NIGHTWIRE v2.0.1 — Feedback System (.mjs)
 * Feedback collection and local persistence.
 */

const STORAGE_KEY = 'nightwire.feedback.v1';

export function createFeedbackSystem() {
  const entries = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          entries.push(...parsed);
        }
      }
    } catch (error) {
      // Storage may be unavailable in private mode.
    }

    return entries;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      // Storage may be unavailable in private mode.
    }
  }

  function addFeedback({ type = 'general', message = '', rating = null, context = {} }) {
    const entry = {
      id: 'feedback-' + Date.now(),
      type,
      message,
      rating,
      context,
      time: Date.now()
    };

    entries.push(entry);
    save();
    return entry;
  }

  function getFeedback(limit = 50) {
    return entries.slice(-limit);
  }

  function clear() {
    entries.length = 0;
    save();
  }

  load();

  return {
    entries,
    addFeedback,
    getFeedback,
    clear
  };
}
