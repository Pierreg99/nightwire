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

Force the touch layout with **T** or Pause even on desktop.

## Editors

- **Wardrobe** (phone app): live FP arms + mannequin, 3 loadouts, JSON export, apply instant.
- **Skim** (F3, F10 alias): orbit/top-down, zone toggles, place cover/light/vehicle/NPC/trigger/landmark, path heatmap, save JSON, **DROP** playtest into FPS. Cap 20 props.

## Story — COLD CARGO

Beat 0 starts after the title (radio + phone job). Warehouse 09 intercept, heat, extract via Wohnung 4B or the dock boat. Handler: KITE. Ending unlocks **DOCK-WEAR**.

## Graphics

Pause → Graphics. **AUTO** on desktop is **ULTRA** (2× pixel ratio cap, 2048 shadows, full zone lights, wet asphalt shader, longer fog). **HIGH** is the 60 fps fallback (FXAA, denser fog). **MOBILE / APK** keeps the same district on a short fog budget. `` ` `` cycles the preset. Reduced FX forces the mobile profile.

The three zones are one night with one light idea each: sodium on the harbor, magenta RHEINLICHT on the strip (cyan KAI LINE is emissive only), cold fluorescent on the hof. The strip lane is about 36 m between building faces.

## Packages

`npm run apk` builds the web bundle, copies it into the Capacitor Android project (`de.nightwire.district`), and runs `gradlew assembleDebug` when `java` and `ANDROID_HOME` are set. The debug apk is `dist/nightwire-debug.apk`. If either tool is missing the command exits 1. It does not write a fake apk. `?apk=1` forces the phone quality path in a browser.

`npm run deb` writes `dist/nightwire_1.0.0_all.deb` with `dpkg-deb`. It installs under `/usr/share/nightwire` and adds `/usr/bin/nightwire`, which serves the build on `127.0.0.1:41731` and opens a browser. It depends on `python3`.

`npm run exe` tries a Windows x64 Electron folder at `dist/nightwire-win/nightwire.exe`. The exe needs the rest of that folder beside it. If Electron cannot be downloaded, the command exits 1 and does not rename another file to `.exe`.

## Performance

Target 60 fps on HIGH, 30+ on MOBILE / APK. ULTRA spends the frame budget on shadows and resolution. If it stutters, drop to HIGH. Do not treat ULTRA as a retail-CoD frame.

## Phase status

Phases 1–8 shipped as a browser vertical slice. A07: **PASS WITH NOTES** (see `MANIFEST.md`). Not a retail Call of Duty or GTA binary.
