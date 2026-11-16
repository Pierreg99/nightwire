# NIGHTWIRE MANIFEST

> **S0 APPROVED 2026-09-17** · Phase 8 freeze after loop 2. A07 PASS WITH NOTES.

| Module | Status | Notes |
|---|---|---|
| Core boot / scene / loop | DONE | Vite + Three.js WebGL2, ACES, PMREM env, fog |
| FPS controller | DONE | walk / sprint / crouch / jump, pointer lock, spawn faces crane |
| Gunplay | DONE | VPR-9, RH-47, Kestrel, knife, recoil, ADS, tracers, decals, casings |
| Viewmodel + FP arms | DONE | jacket / tattoo / charm follow wardrobe; weighted meshes |
| Health / stamina | DONE | regen-lite after cover |
| City slice — Hafen | DONE | crane landmark + cyan key, warehouse 09 (2 aisles + F doors), containers, boat, awning |
| City slice — Neon-Strip | DONE | RHEINLICHT, Nachtimbiss, wet street, 56 m deck + curbs |
| City slice — Plattenbau | DONE | BLOCK 17 **shell** (not solid fill), stairwell, Wohnung 4B |
| Collision | DONE | AABB + step-up; default floor 0; strip widened; 4B hollow |
| Touch controls | DONE | stick, look pad, fire/ADS/reload/jump/crouch/F/veh/phone, **T** toggle |
| Phone NUI | DONE | jobs, map, wardrobe, radio, messages, settings, KITE portrait |
| Skin / wardrobe editor | DONE | 3 loadouts, JSON export, live preview, apply rebuilds gun |
| Map skim editor | DONE | F3/F10, 20-prop cap, heatmap, save, playtest drop |
| Vehicles | DONE | sedan + van, hood-cam (not through body), horn, radio boost in-car |
| NPCs | DONE | civil / crew / security / street + dummies, idle breath, chase/shoot, resolve |
| Heat 0–3 | DONE | strip/hof shots, package +1, security **van** at 2, 4B decay |
| Radio | DONE | Dark Synth FM / Late Night Talk (procedural), louder in vehicle |
| Story COLD CARGO 0–3 | DONE | auto Beat 0 after title, extract VO + Dock-Wear persisted |
| Weather / post | DONE | rain, steam, bloom 0.28, SMAA, vignette, grain, height fog, ripples, damage grade, colour-vision daltonize |
| Humans + animation + city dressing (2nd pass) | DONE | skinned procedural humans, FP hands, GTAO/DOF/motion blur, dressing — `docs/IMMERSIVE.md` |
| Immersive layer | DONE | env probe, light shafts, neon flicker, rim/bounce, impact FX, camera feel, ambience, story cards — `docs/IMMERSIVE.md` |
| Settings / a11y | DONE | mouse + touch look sens, auto-sprint, FOV, HUD, reduced FX, motion, color-assist, colour-vision mode, touch button size, gyro off |
| A07 gate | DONE | PASS WITH NOTES (2026-09-17, loop 2) |

## Current state

Phases 1–8 are frozen. The history of the individual loops has been removed from this file; `git log` keeps it.

- Render: WebGL2, ACES, PMREM env, presets AUTO/ULTRA/HIGH/MEDIUM/MOBILE (`src/core/Quality.js`). Desktop AUTO resolves to ULTRA, phones to MOBILE, strong phones to HIGH.
- Post: bloom, film grade, vignette, grain; ULTRA/HIGH add lens chroma, split tone and rain-on-lens. MOBILE runs half-resolution bloom and adaptive pixel ratio.
- Zones: `z < -16` docks, `z < 96` strip, owned by `src/world/layout.js`. Layout and quality self-tests pass.
- Code: world chain on native `.mjs`; unreachable v2 duplicates removed (branch `immersive-rewrite`).
- Packages: Android APK/AAB (Capacitor 8), Windows NSIS + portable (Electron), Linux AppImage + DEB (Electron). See `docs/BUILDS.md`.

**Still open (not blocking):** box massing; procedural radio; interiors are volumes not scanned rooms; stairwell FP can clip wall thickness. ULTRA can miss 60 fps on a weak GPU — HIGH is the honest mid target. No real-device test on Android or Windows in this environment.

## A07 verdict — PASS WITH NOTES

Honest read vs CoD-lobby / Warzone-night / GTA-rain / FiveM-NUI — not vs a retail binary.

**AAA-adjacent:** zone lighting (cyan crane, magenta RHEINLICHT, BLOCK 17 fluorescents), wet asphalt + puddle env, NUI phone + KITE still, recoil/ADS/hitmarker loop, Beat 0 radio+job with no extra click after title, hood-cam drive, 4B as a real room.

**Still WebGL-slice:** authored box characters (readable silhouette, not photoreal faces), canvas neon for exact text, procedural radio not licensed stems, interiors are volumes not scanned rooms. Headed frames were not captured here — HTTP 200 + module graph verified.

**Checklist after loop 2:** landmark readable on jack-in (crane) · no coplanar double-deck · ground contact planted · bloom 0.28 · film HUD · 1 light idea/zone · instant shot feedback · touch off sightline · 60/30 target in Pause · 4B enterable · fade doors · heat van · compass zones.

**Scores:** Q = 0.90 · PIS = 0.83

**Notes:** Vite resolves `three` from the local `node_modules` first; `~/.grok/nightwire-app/node_modules` stays a fallback for mounts that cannot hold `node_modules`.
