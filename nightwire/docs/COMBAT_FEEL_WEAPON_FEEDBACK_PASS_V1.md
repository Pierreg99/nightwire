# Combat Feel & Weapon Feedback Pass v1

## Purpose

This pass makes NIGHTWIRE shooting feel physical, readable and satisfying.

It adds weapon identity, recoil, camera response, muzzle feedback, tracers, material-aware impacts and audio feedback.

## Modules

| Module | Responsibility |
|---|---|
| `weaponFeel.js` | Weapon profiles, ammo, fire rate, reload and damage |
| `recoil.js` | Recoil pattern, camera kick, ADS transition and sway |
| `muzzleFX.js` | Muzzle flash and tracers |
| `impactFX.js` | Material-aware impact particles |
| `weaponAudio.js` | WebAudio shots, impacts, hitmarkers and reloads |

## Weapon identity

| Weapon | Role | Feel |
|---|---|---|
| Pistol | Precision sidearm | Fast, controlled, headshot-focused |
| SMG | Mobile aggression | High fire rate, visible spread, close range |
| Rifle | Tactical midpoint | Controlled recoil, strong ADS precision |
| Melee | Risk and pressure | Heavy lunge, stagger and close-range damage |

## Feedback stack

Every successful shot should trigger:

- Muzzle flash
- Tracer
- Camera kick
- Recoil pattern
- Material-aware impact particles
- Impact audio
- Hitmarker
- Headshot pitch variation

## Integration

```js
import { createWeaponFeel } from './weapons/weaponFeel.js';
import { createRecoilSystem } from './weapons/recoil.js';
import { createMuzzleFX } from './fx/muzzleFX.js';
import { createImpactFX } from './fx/impactFX.js';
import { createWeaponAudio } from './audio/weaponAudio.js';

const weaponFeel = createWeaponFeel('rifle');
const recoil = createRecoilSystem({ camera, weaponFeel });
const muzzleFX = createMuzzleFX({ scene, quality });
const impactFX = createImpactFX({ scene, quality });
const weaponAudio = createWeaponAudio({});

function onFire(time, muzzlePosition, hitPosition, hitMaterial) {
  const shot = weaponFeel.fire(time);
  if (!shot) return;

  recoil.applyShot(time);
  muzzleFX.spawnFlash(muzzlePosition);
  muzzleFX.spawnTracer(muzzlePosition, hitPosition);

  const impact = impactFX.spawnImpact({
    position: hitPosition,
    material: hitMaterial
  });

  weaponAudio.playShot({ weaponId: shot.weaponId });
  weaponAudio.playImpact(impact.sound);
  weaponAudio.playHitmarker(false);
}
```

## Mobile rules

- Keep particle count bounded by quality tier.
- Reuse geometries and materials where possible.
- Avoid per-shot material allocation in production.
- Keep audio nodes short-lived and disconnect them after playback.
- Tune recoil and camera kick separately for touch input.

## Next gameplay lever

Add enemy AI states, cover behavior, squad coordination and damage/stagger response. Visual feedback makes shooting feel good; intelligent enemies make it matter.
