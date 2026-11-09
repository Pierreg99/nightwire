# NIGHTWIRE v2.0.1 — Asset, Design & Feature Implementation

## Purpose

This implementation turns the documented v2 systems into runnable browser-side modules.

It adds procedural assets, a shared design system and a central feature registry.

## Assets

`proceduralAssets.js` generates PNG data URLs in the browser:

- Dock Street
- Warehouse 09
- Apartment 4B
- Dock Boat
- Heavy Pistol
- Compact SMG
- Tactical Enemy
- Phone Interface

These assets match the viewable game asset links in the root README.

## Design system

`designSystem.js` provides:

- Night-city color tokens.
- Neon, surface, line and text colors.
- Display, body and mono typography.
- Reusable panel, button, HUD and neon styles.
- CSS custom properties for consistent UI.

## Feature registry

`featureRegistry.js` centralizes feature flags for:

- Render foundation.
- Material and weather.
- Combat and enemy AI.
- Story and checkpoints.
- UI, settings and accessibility.
- World systems and streaming.
- Mission spawning and objective coupling.
- Observability.
- Procedural assets and design system.

## Integration

```js
import { createGameAssetLibrary } from './assets/proceduralAssets.js';
import { createDesignSystem } from './design/designSystem.js';
import { createFeatureRegistry } from './features/featureRegistry.js';

const assets = createGameAssetLibrary();
const design = createDesignSystem();
const features = createFeatureRegistry();

const dockStreet = assets['dock-street']();
```

## Status

Implemented and committed as part of NIGHTWIRE v2.0.1.
