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

## Second pass — people, animation, lens, city dressing

All procedural, Three.js r170 + Vite only, no new dependencies, `assets/` untouched.

### Humans (`src/characters/HumanBody.mjs`, `humanTextures.mjs`)
- One `SkinnedMesh` rig with 19 bones (hips → spine → chest → neck → head, clavicle/upper/fore arm/hand, thigh/shin/foot), smooth two-bone weights at every joint.
- Sculpted head: displaced sphere with occiput, eye sockets, brow ridge, nose bridge/tip/alae, cheekbones, lips, mouth line, jaw angle and chin; ears; eyeballs with painted iris and clearcoat cornea; upper/lower lids that blink.
- Face detail map painted in sphere UV: socket shading, lid crease, blush, stroked brows, nostrils, lip colour, stubble, buzz-cut hairline. Hair is a shell of the same skull sculpt.
- Hands with palm, four two-segment fingers, knuckles and thumb (curl parameter).
- Clothing: lathe torso with trapezius slope and stand-up collar, sleeves, trousers, shoes with soles, hood or vest; fabric normal map (weave + folds) and sheen. Skin is `MeshPhysicalMaterial` with red sheen (a cheap subsurface look), pore normal map and a light clearcoat; MOBILE uses `MeshStandardMaterial`.
- NPC looks per type (civil variants, crew, security with helmet and visor, street with hood/mask) with varied skin tone, eye/hair colour, build and height.

### Animation (`HumanAnimator.mjs`)
- Procedural idle/walk/run blended by the measured ground speed: stride, knee bend, foot roll, pelvis bob/sway/twist, spine counter-rotation, arm swing, breathing and weight shift.
- Aim pose blend, head/neck look-at toward the player (40/60 split, limits), blinking.
- Hit reaction spring (body or head), death as an inverted-pendulum fall along the shot direction with limbs going limp.
- Animation LOD: every frame within 22 m, every 2nd up to 45 m, every 4th beyond.

### First-person arms (`src/weapons/FPArms.mjs`)
- Gloved hands from the same hand sculpt hold the grip and the fore-grip (C-clamp). Includes a wrist skin band, the wardrobe tattoo, a watch, and sleeves solved between wrist and elbow every frame.
- Spring look sway, figure-8 bob, sprint carry, reload (support hand travels to the magazine) and inspect (`I`). A short-range viewmodel fill light keeps them readable.

### Lens (`src/fx/PostFX.js`)
- GTAO contact AO on ULTRA/HIGH.
- Bokeh DOF only while aiming down sights (focus by raycast), during the jack-in card and in portrait photo mode.
- Optional camera motion blur from yaw/pitch velocity (ULTRA 0.5, HIGH 0.35).
- Both can be switched off in Pause → Settings.
- Shadow camera follows the player with texel snapping, so shadows do not swim.

### City dressing (`src/world/dressing.mjs`, `city.json` unchanged)
- 3-layer skyline ring with depth tint, window lights, harbour cranes and chimneys, and blinking aviation lights.
- Balconies, railings, AC units and vertical neon signs on the strip facades. NeonFX now also flickers multi-material signs.
- Cables and string lights over the lane, gullies, vent grates at the steam spots, manholes, litter, graffiti decals, weeds and courtyard trees.
- Per-zone fog/hemisphere grade: HAFEN cold cyan, STRIP magenta, HOF sodium green.
- No new collision. Counts scale with `profile.dressing` / `profile.skyline`.

| Preset | charDetail | AO | DOF | motion blur | dressing | skyline layers |
|---|---|---|---|---|---|---|
| ULTRA | 1 | GTAO | yes | 0.5 | 1 | 3 |
| HIGH | 1 | GTAO | yes | 0.35 | 1 | 3 |
| MEDIUM | 1 | – | – | – | 0.7 | 2 |
| MOBILE | 0 (Standard skin, fewer segments) | – | – | – | 0.45 | 1 |

### Tools
`window.__nightwire.photo('face'|'body'|'hands'|'inspect'|'strip'|'hof'|'docks'|'off', type)` opens photo-mode cameras with a portrait key + rim lamp. `npm run smoke -- --shot face --type civil` captures them, and `--eval <expr>` prints a devtools expression.

### Honest limits
"Hyperrealistic" is not reachable with procedural Three.js primitives alone. Faces read as sculpted mannequins, not as people. Real realism needs photogrammetry or scanned heads with 4K albedo/normal/roughness maps, hair cards or strands, mocap animation, and screen-space subsurface scattering, none of which exist in this repo.

Other gaps:
- There is no physics ragdoll (it is a scripted pendulum fall).
- Shadows are a single follow-cascade with snapping, not true CSM.
- GTAO, DOF and motion blur cost noticeable GPU time on ULTRA/HIGH.
