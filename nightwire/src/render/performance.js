/**
 * Machala Render Foundation v1 — frame-time and thermal-aware performance guard.
 */

const HISTORY_SIZE = 45;

export function createPerformanceGuard({ quality }) {
  const frameHistory = [];
  let lastTime = performance.now();
  let lowFpsStreak = 0;
  let disposed = false;

  function pushSample(frameMs) {
    frameHistory.push(frameMs);
    if (frameHistory.length > HISTORY_SIZE) frameHistory.shift();
  }

  function getMetrics() {
    if (!frameHistory.length) {
      return { averageFrameMs: 0, fps: 0, p95FrameMs: 0 };
    }

    const sorted = [...frameHistory].sort((a, b) => a - b);
    const average = frameHistory.reduce((sum, value) => sum + value, 0) / frameHistory.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || average;

    return {
      averageFrameMs: average,
      fps: 1000 / average,
      p95FrameMs: p95
    };
  }

  function update() {
    if (disposed) return;

    const now = performance.now();
    const frameMs = now - lastTime;
    lastTime = now;

    if (frameMs <= 0 || frameMs > 500) return;

    pushSample(frameMs);

    const metrics = getMetrics();
    quality.applyPerformanceSample(metrics);

    const target = quality.get().targetFrameMs;

    if (metrics.averageFrameMs > target * 1.35) {
      lowFpsStreak += 1;
    } else {
      lowFpsStreak = 0;
    }

    if (lowFpsStreak >= 90 && quality.get().id !== 'low') {
      const next = quality.get().id === 'high' ? 'medium' : 'low';
      quality.setTier(next);
      lowFpsStreak = 0;
    }

    return metrics;
  }

  function dispose() {
    disposed = true;
    frameHistory.length = 0;
  }

  return {
    update,
    getMetrics,
    dispose
  };
}
