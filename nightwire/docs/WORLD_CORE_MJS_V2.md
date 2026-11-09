# NIGHTWIRE v2.0.1 — World Core MJS

## Purpose

This migration converts the world core modules to native ES modules.

## Native modules

- collision.mjs
- layout.mjs
- streamingManager.mjs
- zoneLoader.mjs
- World.mjs

## Import chain

```js
import { World } from './World.mjs';
import { Collision } from './collision.mjs';
import { zoneOf } from './layout.mjs';
import { createStreamingManager } from './streamingManager.mjs';
```

## Status

The world core is now native `.mjs`.
