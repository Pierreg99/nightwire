# NIGHTWIRE v2 Release

## Status

NIGHTWIRE v2 konsolidiert alle bisherigen Machala-Passes in eine versionierte Release-Basis.

## Enthaltene Systeme

- Render Foundation: WebGL2, ACES, Post-Processing, Performance Guard.
- Material & Weather: nasse Oberflächen, Decals, Regen, Fog und Neon.
- Texture & Surface Detail: PBR-Texturen und Oberflächendetails.
- Combat Feel: Waffen-Feedback, Recoil, Tracer, Hitmarker und Audio.
- Tactical Combat: Enemy AI, Squad Coordination, Health, Stagger und Downed.
- Story: Objectives, Cold Cargo, Heat, Checkpoints und Save State.
- UI: HUD, Phone, Interactions, Settings, Accessibility und Mobile Polish.
- World: Vehicles, NPCs, Props, Safehouse und World Interaction.
- QA: Smoke Checks, Frame-Time Telemetry und Vertical Slice Plan.
- Release: Build, Bundle, Docker, Deployment und Live Check.
- Observability: Errors, Performance, Feedback und Iteration.
- Content: zusätzliche Missionen, Waffen, NPCs und Zonen.
- Streaming: Zone Loader, Distanz-Streaming, Mission Spawns und Objective Coupling.

## Version

- Version: 2.0.0
- Release Tag: v2.0.0
- Branch: machala/render-foundation-v1

## Release Befehle

```bash
chmod +x scripts/release.sh
./scripts/release.sh v2.0.0

chmod +x scripts/bundle.sh
./scripts/bundle.sh 2.0.0

chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Live Check

- Live URL liefert HTTP 200.
- Spiel lädt ohne Console Errors.
- Mission startet.
- Extraction schließt ab.
- Settings persistieren.

## Nächste Iteration

Feedback sammeln, P0-Probleme fixen und v2.0.1 vorbereiten.
