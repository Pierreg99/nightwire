/**
 * NIGHTWIRE v2.0.1 — WebGL2 Renderer (.mjs)
 * Canvas presentation, tone mapping, exposure and dynamic resolution.
 */

import * as THREE from 'three';

export function createRenderer({ canvas, quality }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    stencil: false
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  let disposed = false;

  function applyQuality(settings) {
    const dpr = Math.min(
      settings.maxPixelRatio,
      window.devicePixelRatio || 1
    );

    const width = Math.max(1, Math.floor(window.innerWidth * dpr * settings.effectiveRenderScale));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr * settings.effectiveRenderScale));

    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = settings.shadowMapSize > 0;

    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }

  function render(scene, camera) {
    if (disposed) return;
    renderer.render(scene, camera);
  }

  function setExposure(value) {
    renderer.toneMappingExposure = Math.max(0.25, Math.min(2.5, value));
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.dispose();
  }

  const unsubscribe = quality.onChange(applyQuality);

  return {
    webglRenderer: renderer,
    render,
    applyQuality,
    setExposure,
    dispose: () => {
      unsubscribe();
      dispose();
    }
  };
}
