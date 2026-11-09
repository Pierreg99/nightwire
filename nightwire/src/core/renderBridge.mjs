/**
 * NIGHTWIRE v2.0.1 — Render Bridge (.mjs)
 * Connects quality, renderer, post-processing, lighting and performance guard.
 */

import { createQualitySystem } from '../render/quality.js';
import { createRenderer } from '../render/renderer.js';
import { createPostFX } from '../render/postfx.js';
import { createLighting } from '../render/lighting.js';
import { createPerformanceGuard } from '../render/performance.js';

export function createRenderFoundation({ canvas, scene, camera, initialTier }) {
  const quality = createQualitySystem({ initialTier });
  const renderer = createRenderer({ canvas, quality });
  const postfx = createPostFX({ renderer, scene, camera, quality });
  const lighting = createLighting({ scene, quality });
  const performance = createPerformanceGuard({ quality });

  function update(deltaTime) {
    const metrics = performance.update();
    renderer.render(scene, camera);
    postfx.update(deltaTime);
    lighting.update(deltaTime);
    return metrics;
  }

  function setQualityTier(tier, options) {
    quality.setTier(tier, options);
  }

  function setExposure(value) {
    renderer.setExposure(value);
  }

  function dispose() {
    lighting.dispose();
    postfx.dispose();
    renderer.dispose();
    performance.dispose();
  }

  return {
    quality,
    renderer,
    postfx,
    lighting,
    performance,
    update,
    setQualityTier,
    setExposure,
    dispose
  };
}
