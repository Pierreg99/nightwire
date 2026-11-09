# Texture & Surface Detail Pass v1

## Purpose

This pass adds material believability to NIGHTWIRE without requiring large external texture downloads.

It creates procedural PBR texture layers for the night-city surfaces and gives materials a credible response to rain, grime, wear and neon light.

## Modules

| Module | Responsibility |
|---|---|
| `textureLibrary.js` | Procedural albedo, roughness, normal, dirt, wetness and emissive textures |
| `surfaceDetail.js` | Applies texture detail and wetness response to materials |
| `surfaceDecals.js` | Canvas-generated decal atlas and surface storytelling decals |

## Surface types

| Surface | Base response | Wet response |
|---|---|---|
| Asphalt | High roughness, subtle normal detail | Low roughness, strong reflection |
| Concrete | Matte, dusty, worn | Partially reflective, stained |
| Metal | Rusty, rough, high metalness | Darker, more reflective |

## Decal atlas

The atlas contains procedural representations for:

- Impact damage
- Blood
- Oil slicks
- Cracks
- Tire marks

These are intentionally lightweight and can later be replaced by higher-quality authored texture atlases.

## Integration

```js
import { createSurfaceDetail } from './render/surfaceDetail.js';
import { createSurfaceDecalSystem } from './fx/surfaceDecals.js';

const surface = createSurfaceDetail({
  material,
  surfaceType: 'asphaltWet',
  options: {
    wetness: 0.75,
    grime: 0.35,
    wear: 0.45
  }
});

const decals = createSurfaceDecalSystem({ scene });

decals.addOilSlick(new THREE.Vector3(2, 0.01, -8));
decals.addCrack(new THREE.Vector3(-3, 0.01, -14));
```

## Mobile rules

- Generate textures once and cache them.
- Use 256-pixel procedural textures by default.
- Avoid runtime texture regeneration during gameplay.
- Keep decal count bounded.
- Replace procedural textures with compressed authored atlases when art production begins.

## Next visual lever

Add authored texture atlases for the dock street, then improve normal-map strength, puddle masks and container edge-wear. This will make the first playable zone feel materially finished rather than procedurally generic.
