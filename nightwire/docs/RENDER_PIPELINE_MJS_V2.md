# NIGHTWIRE v2.0.1 — Native MJS Render Pipeline

## Purpose

This migration converts the complete render and material pipeline to native ES modules.

## Native modules

- quality.mjs
- renderer.mjs
- postfx.mjs
- lighting.mjs
- performance.mjs
- materials.mjs
- nightCityMaterials.mjs
- surfaceDetail.mjs
- textureLibrary.mjs

## Import chain

```js
import { createRenderFoundation } from '../core/renderBridge.mjs';
import { createQualitySystem } from '../render/quality.mjs';
import { createSurfaceDetail } from '../render/surfaceDetail.mjs';
```

## Status

The render pipeline is now fully native `.mjs`.

The material modules use `.mjs` imports internally.
