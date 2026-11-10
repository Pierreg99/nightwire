# NIGHTWIRE — Immersive pass (branch `immersive-rewrite`)

Built on `builds/multiplatform` (dc9fff7) and the native `.mjs` world migration. Same stack
(Three.js r170 + Vite 6), no new dependencies. Assets in `assets/`, the Electron / Android icons
and splash and the procedural texture look are unchanged.

## Consolidation

- The world chain (`World`, `collision`, `layout`, `city`, `props`, `interiors`, `textures`, `Heat`),
  `fx/look` and `fx/wetAsphalt` run from their `.mjs` files; the `.js` twins are gone.
- 102 unreachable v2 modules (parallel `create*` render/core/AI/UI stacks, re-export shims) and
  `scripts/qaSmoke.js` were removed after an `rg` reachability check. The older `docs/*_PASS_*.md`
  and `*_V2.md` files describe that history; the running code is what `src/core/Game.js` imports.
- `src/ui/settingsMenu.js` (never wired) is folded into the pause menu: colour-vision mode and
  touch button size. `src/render/textureLibrary.mjs` now feeds the wet asphalt micro detail.

## What changed on screen

| Area | Module | ULTRA | HIGH | MEDIUM | MOBILE / APK |
|---|---|---|---|---|---|
| Height fog (denser near the wet ground, thins upward) | `fx/atmosphere.mjs` (fog chunk patch) | ✓ | ✓ | ✓ | ✓ (free) |
| Rain ripples on puddles + wet asphalt | `fx/atmosphere.mjs` | 1.0 | 1.0 | 0.6 | off |
| Wet asphalt micro normals / roughness, wet patches | `fx/wetAsphalt.mjs` | 0.35 | 0.30 | 0.22 | off |
| Live reflection probe (neon in puddles, paint, glass) | `fx/EnvProbe.mjs` | 1 s, 128 px | 2 s, 96 px | static PMREM | static PMREM |
| Light shafts under lamps, awnings, crane key | `fx/LightShafts.mjs` | ✓ | ✓ | ✓ | off |
| Neon hum + faulty tubes, gunfire rattles them | `fx/NeonFX.mjs` | 1.0 | 1.0 | 0.8 | 0.6 |
| Cyan rim + magenta street bounce | `core/Game.js` | 0.42 | 0.38 | 0.32 | 0.26 |
| Impact sparks / grit / blood (pooled Points) | `fx/CombatFX.js` | 28 | 20 | 12 | 6 |
| Zone ambience layers | `audio/AudioEngine.js` | 1.0 | 1.0 | 1.0 | 0.7 |

The probe renders one cube face per frame (never a full 6-face burst) and keeps the viewmodel,
rain and shadow updates out of it. Reduced FX switches probe, shafts, ripples and micro normals off.

## Feel

- **Combat:** recoil now recovers ~55 % once the trigger rests; camera trauma shake per shot
  (scaled by weapon kick) and on damage; muzzle light per weapon (stays allocated, so the first shot
  no longer recompiles shaders); impact particles; damage desaturation + red edge pulse, low-HP heartbeat.
- **Movement:** footsteps land on the head-bob trough, wet splash layer on every step, lateral bob,
  landing dip spring + heavier step, sprint FOV +7°, strafe roll. All camera motion follows the
  *Motion* setting (off = none of it).
- **Story presentation** (`ui/StoryPresenter.mjs`, beats unchanged in `story/Campaign.js`):
  letterbox + card *COLD CARGO · HAFEN · NEO-DUISBURG · 23:41 · REGEN* on jack-in, KITE's first
  line after the card, typewriter subtitles with radio static, objective flash + ping, zone cards.
  The phone clock runs from 23:41 in game.

## UI

- Pause → **Color vision**: standard / deuteranopia / protanopia / tritanopia (daltonize in the
  grade pass). **Touch button size** 0.7–1.5 (CSS `--tbtn-scale`).
- Phone open on touch: stick, look pad and combat buttons hide (inputs released), PH and II stay.
- HUD writes to the DOM only when a value changes.

## Checks

`npm test` (quality self-test covers the new preset fields), `npm run build`, `npm run smoke`,
`npm run smoke -- --mobile`. The smoke script also fails on three.js shader compile errors and
takes `--wait ms`, `--quality mobile` and `--phone`.
