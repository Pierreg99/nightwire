# Hyperreal assets pass V1 (branch `hyperreal-assets`)

Real CC0 3D assets replace the procedural look where they load; the procedural world, NPCs and
hands stay as the fallback (`?assets=0`, failed downloads, dummies).

## What ships
- **Humans:** 8 MakeHuman characters (4 civilians, dock worker, security in suit, street, player),
  2K skin / cloth / hair textures, eyes with clearcoat, alpha-tested hair cards. 21 Quaternius UAL
  clips retargeted per character (idle, talk, phone, walk, jog, sprint, pistol idle, aim up/down,
  shoot, reload, hit chest/head/knockback, death, crouch, sit, drive). Upper/lower body split,
  phase-synced locomotion, look-at, hit reactions, shot-aligned deaths.
- **Robots:** security android (UAL mannequin, graphite metal with Poly Haven metal normal/roughness,
  visor + chest light strip) alternating with the human guard; patrol drones (own Blender model)
  with spinning rotors, blinking LEDs, pooled searchlights (ULTRA/HIGH) and a soft beam.
- **First person:** hands and jacket sleeves baked from the player character's aim pose, driven by
  the existing FPArms IK (anchors, sway, reload, inspect unchanged).
- **Map:** 10 Poly Haven PBR sets on roads, sidewalks, walls, containers, roofs, courtyard
  (world-metre UVs), HDRI `neuer_zollhof` as IBL, 96 CC0 props (lamps, hydrants, bins, utility boxes,
  barriers, fire escapes, AC units, roller shutters, cameras, pipes, crates, barrels, generator,
  covered cars, ...) with collision boxes for the solid ones.
- **Rendering:** wrap-lighting skin (SSS approximation) via `onBeforeCompile`, hardware MSAA (4×) on
  the composer targets on ULTRA/HIGH, IBL from the HDRI.

## Presets
| Key | ULTRA | HIGH | MEDIUM | MOBILE |
|---|---|---|---|---|
| assets | full (2K) | full (2K) | lod (1K, decimated) | lod |
| pbr / hdri | 2k | 2k | 1k | 1k (walls: albedo only) |
| props | 1 | 1 | 0.7 | 0.45 |
| drones | 3 | 2 | 2 | 1 |
| msaa | 4 | 4 | 0 | 0 |

The asset pass starts after the first two frames (`game.assetsReady`), so the game is playable at once;
the character set is chosen at boot (a preset change applies to characters after a restart).

## Limits (honest)
- MakeHuman figures are good game-ready humans, not photogrammetry scans; no facial animation or lip sync.
- FP hands are a fixed baked grip pose (fingers do not animate); the guns are still the procedural models.
- Skin is a wrap-lighting approximation, not screen-space subsurface scattering.
- No cascaded shadow maps: `three/examples` CSM replaces `onBeforeCompile` on every material and would
  break the wet-asphalt and skin shaders; the existing single shadow map with texel snapping stays.
- The rainy night stays dark by design; the photo textures read most in lit areas (Hof is dim).
- Software-rendered smoke runs (SwiftShader) show ~20 fps vs ~36 fps before; this is not a GPU measurement.
- Build size grows by ~85 MB of assets (APK ~75 MB, Linux deb ~163 MB).
