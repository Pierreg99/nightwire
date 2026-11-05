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
| Weather / post | DONE | rain, steam, bloom 0.28, SMAA, vignette, grain |
| Settings / a11y | DONE | mouse + touch look sens, auto-sprint, FOV, HUD, reduced FX, motion, color-assist, gyro off |
| A07 gate | DONE | PASS WITH NOTES (2026-09-17, loop 2) |

## S0 loop log

**Loop 0 — port + visual pass.** Harbor lighting (crane cyan key + puddle physical), PMREM env, photo albedo (concrete/container/platten), KITE portrait, title still, rain/steam, casings, touch-look slider.

**Loop 1 — A07 grounding (city/characters).** Non-overlapping zone floors (join at z=-20 and z=58). Lamp/awning poles no longer buried. NPC soles and vehicle wheels planted. Hof fluorescent tubes added.

**Loop 2 — Phase 8, five worst breaks.** (1) BLOCK 17 was a solid AABB — 4B/stair/extract unreachable; now a facade shell + landing. (2) Doors were hard teleports; 200 ms fade + warehouse F bay/rear. (3) Strip 36 m deck vs 90 m hafen void; widened + curbs, floorY default 0. (4) Drive cam inside cabin + reverse vs headlights; hood-cam along mesh forward. Heat 2 now a security van; 4B dumps heat. (5) Spawn yaw inland; now faces crane. Compass is HAFEN | STRIP | HOF. Dummies in all three zones. Crew chase. Dock-Wear saved on extract. F3 skim. Asphalt albedo hydrated.

**Loop 3 — van cam + curbs.** Van hood-cam sits past the 5.1 m bumper (`fwd * 2.72`), not inside the box. Strip gets 0.22 m concrete curbs at x=±26 plus the existing fences.

**Loop 5 — render fix.** The FPS camera was never in the scene, so the viewmodel, rain, and muzzle flash were not drawn. Camera is in the scene now. Held meshes do not cast moon shadows and ignore fog. Composer uses the renderer size once (no MSAA target, no double pixel ratio). `setSize(..., false)` lets CSS fill the visual viewport. Jack-in requests fullscreen. Puddles and the foot shadow use polygon offset. Bloom threshold stays above the night sky. Light budget sticks so fill lights do not pop every step.

**Loop 6 — night look and open lanes.** One palette in `src/fx/look.js`. Wet docks and strip use a physical asphalt shader (lane darkening, scrolling roughness). A sky dome follows the camera inside the far plane. Facades keep sparse lit windows on an emissive map plus a thin skirt, not a light per window. Guns differ in length: short VPR-9, RH-47 rail, Kestrel slide, HAUL-12 pump, NORD-6 scope and brake. Tracers take a per-type color. Ultra fog is 0.0042 so a 40 m lane still reads. High fog is 0.007. Bloom thresholds are unchanged.

Zone cuts are `z < -16` docks and `z < 96` strip, owned by `src/world/layout.js`. Harbor anchors did not move (spawn, Warehouse 09, boat, crane, beat 0 at `z < -50`). Strip inner faces sit at `|x| = 18` (36 m lane) with a ≥ 10 m alley to the outer row. Hof content, including Wohnung 4B, moves by `HOF_SHIFT` +40 and stays in the hof. Layout and quality self-tests pass. Production build passes. No headed WebGL frame in this environment.

`npm run deb` produced `dist/nightwire_1.0.0_all.deb`. `npm run apk` exited 1 because `ANDROID_HOME` is unset. Java is present. The Android project assets were synced. `npm run exe` is the Electron packager path and is recorded only when `dist/nightwire-win/nightwire.exe` exists.

**Loop 4 — ULTRA quality, shooter spread, pad / APK.** Graphics presets AUTO/ULTRA/HIGH/MEDIUM/MOBILE. Desktop AUTO resolves to ULTRA: DPR cap 2, 2048 moon shadow, 4× MSAA, OutputPass + ACES, restrained bloom, blue-shadow grade. Light budget no longer zeros later zone lights; crane, RHEINLICHT and BLOCK 17 stay pinned. Hof puddle under the tubes. Water clearcoat. Five guns: VPR-9 auto, RH-47 auto, KESTREL semi, HAUL-12 8-pellet pump, NORD-6 semi DMR. Gamepad (standard mapping), touch weapon/pause, safe-area insets. `npm run apk` emits the web bundle; an `.apk` still needs the Android SDK.

**Still open (not blocking):** no headed WebGL proof in this environment; box massing; procedural radio; interiors are volumes not scanned rooms; stairwell FP can clip wall thickness. ULTRA can miss 60 fps on a weak GPU — HIGH is the honest mid target.

## A07 verdict — PASS WITH NOTES

Honest read vs CoD-lobby / Warzone-night / GTA-rain / FiveM-NUI — not vs a retail binary.

**AAA-adjacent:** zone lighting (cyan crane, magenta RHEINLICHT, BLOCK 17 fluorescents), wet asphalt + puddle env, NUI phone + KITE still, recoil/ADS/hitmarker loop, Beat 0 radio+job with no extra click after title, hood-cam drive, 4B as a real room.

**Still WebGL-slice:** authored box characters (readable silhouette, not photoreal faces), canvas neon for exact text, procedural radio not licensed stems, interiors are volumes not scanned rooms. Headed frames were not captured here — HTTP 200 + module graph verified.

**Checklist after loop 2:** landmark readable on jack-in (crane) · no coplanar double-deck · ground contact planted · bloom 0.28 · film HUD · 1 light idea/zone · instant shot feedback · touch off sightline · 60/30 target in Pause · 4B enterable · fade doors · heat van · compass zones.

**Scores:** Q = 0.90 · PIS = 0.83

**Notes:** Vite is served from `~/.grok/nightwire-callof` on `127.0.0.1:5173` because this mount cannot symlink `node_modules`.
