# Machala Render Foundation v1

## Purpose

This foundation upgrades NIGHTWIRE from a basic WebGL scene into a controllable, multi-platform render pipeline.

It prioritizes:

- Night-city readability
- Wet asphalt and neon response
- Stable mobile performance
- Adaptive quality
- Cinematic but restrained post-processing
- Clear separation between rendering and gameplay

## Modules

| Module | Responsibility |
|---|---|
| `quality.js` | Quality tiers, adaptive render scale, manual override |
| `renderer.js` | WebGL2 renderer, ACES tone mapping, exposure, resolution |
| `postfx.js` | Bloom, vignette, grain, FXAA, night grade |
| `lighting.js` | Moonlight, ambient fill, neon, fog, light budget |
| `performance.js` | Frame-time sampling, adaptive degradation, thermal-safe response |
| `materials.js` | PBR presets for wet, dirty and neon-lit surfaces |
| `renderBridge.js` | Single integration API for the game loop |

## Quality tiers

| Tier | Target | Render scale | Shadows | Dynamic lights | Post-FX |
|---|---:|---:|---:|---:|---|
| `low` | 30 FPS | 0.65x | Off | 1 | Tone mapping, minimal FX |
| `medium` | 30 FPS | 0.8x | 1024 | 2 | Bloom, vignette, FXAA |
| `high` | 60 FPS | 1.0x | 2048 | 4 | Bloom, SSAO-ready, full grade |

## Integration

```js
import { createRenderFoundation } from './core/renderBridge.js';

const foundation = createRenderFoundation({
  canvas: document.querySelector('#game-canvas'),
  scene,
  camera
});

function animate() {
  const delta = clock.getDelta();
  foundation.update(delta);
  requestAnimationFrame(animate);
}
```

## Mobile rules

- Target 30 FPS before chasing 60 FPS.
- Reduce resolution before reducing gameplay readability.
- Use baked or probe-based lighting for static environments.
- Limit dynamic lights to player-relevant areas.
- Avoid screen-space reflections on mobile.
- Use compressed textures and atlases.
- Reduce particles, shadow distance and bloom before dropping entire systems.

## Visual direction

NIGHTWIRE should feel like a wet Neo-Duisburg night district:

- Cold moonlight
- Neon spill and colored bounce
- Reflective puddles
- Industrial fog
- Dirty concrete and rusted metal
- Strong silhouettes
- Controlled bloom

The goal is not to imitate a retail AAA title. The goal is a shipping-quality browser FPS vertical slice with credible material response, readable combat spaces and stable cross-platform performance.
