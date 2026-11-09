# NIGHTWIRE v2.0.1 — World Chain MJS Migration

## Purpose

This migration establishes `.mjs` as the module format for the NIGHTWIRE world chain.

## Native module

- World.mjs is a native ES module.

## Facade modules

- city.mjs
- collision.mjs
- layout.mjs
- props.mjs
- interactions.mjs
- interiors.mjs
- safehouse.mjs
- streamingManager.mjs
- textures.mjs
- zoneLoader.mjs
- zonePolish.mjs
- Heat.mjs

## Import chain

```js
import { World } from './World.mjs';
import { Collision } from './collision.mjs';
import { zoneOf } from './layout.mjs';
```

## Next step

Convert the facade modules to native implementations, starting with collision, layout and streamingManager.
