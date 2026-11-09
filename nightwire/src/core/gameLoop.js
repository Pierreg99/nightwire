/**
 * Machala Integration & Wiring Pass v1
 * Game loop with telemetry and update order.
 */

export function createGameLoop({ bootstrap }) {
  let running = false;
  let lastTime = performance.now();
  let frameId = null;

  function tick(now) {
    if (!running) return;

    const deltaTime = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    bootstrap.update(deltaTime);
    frameId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;

    running = true;
    lastTime = performance.now();
    frameId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  return {
    start,
    stop,
    get isRunning() {
      return running;
    }
  };
}
