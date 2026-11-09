# NIGHTWIRE v2.0.1 — Native MJS Story Chain

## Purpose

This migration converts the story chain to native ES modules.

## Native modules

- objectives.mjs
- missionManager.mjs
- checkpoints.mjs
- heatSystem.mjs
- missionSpawn.mjs
- missionZones.mjs
- objectiveCoupling.mjs
- coldCargo.mjs

## Import chain

```js
import { createColdCargoCampaign } from './coldCargo.mjs';
import { createObjectiveSystem } from './objectives.mjs';
import { createMissionManager } from './missionManager.mjs';
```

## Status

The story chain is now fully native `.mjs`.
