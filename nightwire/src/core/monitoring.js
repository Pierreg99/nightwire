/**
 * Machala Monitoring & Feedback Pass v1
 * Error tracking, event buffer and performance monitoring.
 */

const MAX_EVENTS = 200;

export function createMonitoring() {
  const events = [];
  const errors = [];
  const performanceSamples = [];

  function track(event, payload = {}) {
    events.push({
      event,
      payload,
      time: Date.now()
    });

    if (events.length > MAX_EVENTS) {
      events.shift();
    }
  }

  function captureError(error, context = {}) {
    const entry = {
      message: error?.message || String(error),
      stack: error?.stack || '',
      context,
      time: Date.now()
    };

    errors.push(entry);

    if (errors.length > MAX_EVENTS) {
      errors.shift();
    }

    return entry;
  }

  function trackPerformance(frameMs) {
    performanceSamples.push(frameMs);

    if (performanceSamples.length > MAX_EVENTS) {
      performanceSamples.shift();
    }
  }

  function getPerformanceMetrics() {
    if (!performanceSamples.length) {
      return {
        averageFrameMs: 0,
        fps: 0,
        p95FrameMs: 0,
        samples: 0
      };
    }

    const sorted = [...performanceSamples].sort((a, b) => a - b);
    const average = performanceSamples.reduce((sum, value) => sum + value, 0) / performanceSamples.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || average;

    return {
      averageFrameMs: average,
      fps: 1000 / average,
      p95FrameMs: p95,
      samples: performanceSamples.length
    };
  }

  function getRecentEvents(limit = 20) {
    return events.slice(-limit);
  }

  function getRecentErrors(limit = 20) {
    return errors.slice(-limit);
  }

  function clear() {
    events.length = 0;
    errors.length = 0;
    performanceSamples.length = 0;
  }

  return {
    track,
    captureError,
    trackPerformance,
    getPerformanceMetrics,
    getRecentEvents,
    getRecentErrors,
    clear
  };
}
