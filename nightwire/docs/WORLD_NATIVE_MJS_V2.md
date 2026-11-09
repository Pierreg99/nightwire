# NIGHTWIRE v2.0.1 — Native MJS World Chain

## Purpose

This migration advances the world chain to native ES modules.

## Native modules

- World.mjs
- collision.mjs
- layout.mjs
- streamingManager.mjs
- zoneLoader.mjs
- interactions.mjs
- safehouse.mjs
- zonePolish.mjs
- Heat.mjs

## Facade modules

- city.mjs
- props.mjs
- interiors.mjs
- textures.mjs

## Import chain

```js
import { World } from './World.mjs';
import { Collision } from './collision.mjs';
import { createStreamingManager } from './streamingManager.mjs';
import { createWorldInteractions } from './interactions.mjs';
```

## Next step

Convert city, props, interiors and textures to native implementations.
