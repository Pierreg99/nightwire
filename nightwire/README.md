# NIGHTWIRE

> **S0 APPROVED 2026-09-17** · Player-facing start/controls plan.

Tactical FPS × GTA / FiveM city slice. Neo-Duisburg, Rhein-Ruhr night district.
Three.js + Vite. Original world, no licensed maps, logos, or music.

SafeMode L2: best-in-class *browser* vertical slice — not a retail Call of Duty binary.

## Start

```bash
cd nightwire
npm install
npm run dev
```

Open `http://127.0.0.1:5173` (Vite, not a raw `index.html` file). Click **JACK IN**.
If the canvas stays black, a red **BOOT FAILED** line will show the reason. Hard-refresh after updates.

Vite uses `node_modules` in this folder. If `~/.grok/nightwire-app/node_modules` exists, that copy is used instead.

## Controls

| Action | Desktop | Gamepad | Touch |
|---|---|---|---|
| Move | WASD | Left stick | Left stick |
| Look | Mouse (pointer lock) | Right stick | Right look pad |
| Sprint | Shift | L3 / stick threshold | Stick past auto-sprint threshold |
| Crouch | Ctrl / C | B | CR |
| Jump | Space | A | JMP |
| Fire | LMB | RT | FIRE |
| ADS | RMB | LT | ADS |
| Reload | R | X | R |
| Melee | G / V | R3 | — |
| Interact / enter vehicle | F | Y | F / VEH |
| Weapons | 1–5 / wheel | LB / RB | WPN |
| Phone | Tab / B / P | Back | PH |
| Pause / settings | Esc / ` cycles graphics | Start | II |
| Skim editor | F3 (F10 alias) | — | Map app → SKIM |
| Touch layout | T | — | Pause checkbox |
| Horn (in vehicle) | H | — | — |
| Drive | WASD | Left stick | Stick |

Force the touch layout with **T** or Pause even on desktop. Pause → *Touch button size* scales the buttons; while the phone is open only PH and II stay on screen. Touch tracks every finger separately, so stick, look pad and FIRE work at the same time. If the browser refuses pointer lock, hold the left mouse button on the game view and drag to look.

## Editors

- **Wardrobe** (phone app): live FP arms + mannequin, 3 loadouts, JSON export, apply instant.
- **Skim** (F3, F10 alias): orbit/top-down, zone toggles, place cover/light/vehicle/NPC/trigger/landmark, path heatmap, save JSON, **DROP** playtest into FPS. Cap 20 props.

## Story — COLD CARGO

Beat 0 starts after the title (radio + phone job). Warehouse 09 intercept, heat, extract via Wohnung 4B or the dock boat. Handler: KITE. Ending unlocks **DOCK-WEAR**.

## Graphics

Pause → Graphics. **AUTO** on desktop is **ULTRA** (2× pixel ratio cap, 2048 shadows, full zone lights, wet asphalt shader, longer fog, rain on the lens, light chromatic edge, teal/sodium split tone). **HIGH** is the 60 fps fallback (FXAA, denser fog, same lens effects a little softer). **MEDIUM** and **MOBILE / APK** drop lens rain and chroma, render bloom at 3/4 and 1/2 resolution and lower the render scale on their own when the frame rate falls under 30 fps. Phones and the Android app resolve AUTO to MOBILE (HIGH on strong phones); the desktop app always counts as desktop. `` ` `` cycles the preset. Reduced FX forces the mobile profile.

Immersive layer (details and per-preset table: [docs/IMMERSIVE.md](docs/IMMERSIVE.md)): height fog, rain ripples in puddles and on the wet asphalt, a live reflection probe on ULTRA/HIGH so the neon shows in the puddles, light shafts under lamps, flickering neon that reacts to gunfire, rim + bounce light, impact particles, camera shake / landing / sprint FOV, zone ambience and a jack-in title card. MOBILE / APK keeps only the cheap parts. Second pass: procedural skinned humans with sculpted faces, blinking, look-at, gait/hit/fall animation, first-person gloved hands with reload/inspect (`I`), GTAO, ADS depth of field, optional motion blur, and city dressing (skyline layers, signs, balconies, cables, litter, graffiti, vegetation, zone grades).

The three zones are one night with one light idea each: sodium on the harbor, magenta RHEINLICHT on the strip (cyan KAI LINE is emissive only), cold fluorescent on the hof. The strip lane is about 36 m between building faces.

## Packages

Full guide: [docs/BUILDS.md](docs/BUILDS.md).

| Platform | Command | Output in `release/` |
|---|---|---|
| Android debug APK | `npm run apk` | `nightwire-<v>-debug.apk` |
| Android release APK / AAB | `npm run apk:release` / `npm run aab` | `nightwire-<v>-release[-unsigned].apk/.aab` |
| Windows x64 | `npm run exe` | portable `.exe` + `.zip` (`npm run exe:setup` for the NSIS installer, needs Windows or wine) |
| Linux x64 | `npm run linux` | `.AppImage` + `.deb` |

Android needs JDK 21 and the Android SDK; release signing comes only from environment variables. Desktop packages use an Electron shell (`electron/main.cjs`). Every script exits 1 with the reason if a tool is missing; none of them writes a fake package. `?apk=1` forces the phone quality path in a browser.

## Performance

Target 60 fps on HIGH, 30+ on MOBILE / APK. ULTRA spends the frame budget on shadows and resolution. If it stutters, drop to HIGH. Do not treat ULTRA as a retail-CoD frame.

## Phase status

Phases 1–8 shipped as a browser vertical slice. A07: **PASS WITH NOTES** (see `MANIFEST.md`). Not a retail Call of Duty or GTA binary.
