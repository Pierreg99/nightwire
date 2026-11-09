# Night-City Material & Weather Pass v1

## Purpose

This pass makes NIGHTWIRE read as a wet Neo-Duisburg night district rather than a generic WebGL prototype.

It adds:

- Wet and dirty PBR material variants
- Reflective puddles
- Rain particles
- Industrial fog
- Neon emissive materials
- Decals for impacts, oil, blood, cracks and tire marks
- A dock-street polish helper

## Modules

| Module | Responsibility |
|---|---|
| `nightCityMaterials.js` | Wet/dirty PBR material factory and neon materials |
| `decals.js` | Lightweight surface decals with automatic cleanup |
| `weather.js` | Rain, puddles, fog density, wind and weather intensity |
| `zonePolish.js` | Dock-street ground, containers, neon sign and puddles |

## Material philosophy

Materials must respond to the scene:

- Wet surfaces lower roughness and increase environment reflection.
- Dirt increases roughness and darkens the base color.
- Neon signs use emissive materials and should be paired with nearby lights.
- Puddles use very low roughness and high environment intensity.
- Containers use painted metal with rust and wear variation.

## Weather rules

- Low tier: fewer rain particles, weaker fog, reduced visual density.
- Medium tier: balanced rain and fog.
- High tier: denser rain, stronger atmosphere and more visible neon response.

The weather system intentionally avoids expensive screen-space effects on mobile.

## Integration

```js
import { createWeatherSystem } from './fx/weather.js';
import { polishDockStreet } from './world/zonePolish.js';

const weather = createWeatherSystem({ scene, quality });
const dockStreet = polishDockStreet({ scene, weather, quality });

function animate() {
  const delta = clock.getDelta();
  weather.update(delta);
  foundation.update(delta);
  requestAnimationFrame(animate);
}
```

## Next visual lever

The next highest-impact improvement is texture work:

- Normal maps for asphalt and concrete
- Roughness variation for wet streets
- Rust and edge-wear for containers
- Dirt masks for walls and floors
- Emissive signage with controlled bloom

A single polished dock street is more valuable than ten unfinished systems.
