/**
 * Machala Full Vertical Slice QA & Freeze Pass v1
 * Frame-time telemetry collector.
 */

export function createQaTelemetry({ maxSamples = 600 } = {}) {
  const samples = [];
  let lastTime = performance.now();

  function update() {
    const now = performance.now();
    const frameMs = now - lastTime;
    lastTime = now;

    if (frameMs <= 0 || frameMs > 500) return null;

    samples.push(frameMs);

    if (samples.length > maxSamples) {
      samples.shift();
    }

    return getMetrics();
  }

  function getMetrics() {
    if (!samples.length) {
      return {
        averageFrameMs: 0,
        fps: 0,
        p95FrameMs: 0,
        samples: 0
      };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || average;

    return {
      averageFrameMs: average,
      fps: 1000 / average,
      p95FrameMs: p95,
      samples: samples.length
    };
  }

  function reset() {
    samples.length = 0;
    lastTime = performance.now();
  }

  return {
    update,
    getMetrics,
    reset
  };
}
