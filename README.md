# NIGHTWIRE

**NIGHTWIRE** is a playable Three.js vertical slice: a tactical FPS set in a rain-soaked, neon-lit night city.

## Quick start

```bash
cd nightwire
npm install
npm run dev
```

Open `http://127.0.0.1:5173` and select **JACK IN**.

## NIGHTWIRE v2.0.0

NIGHTWIRE v2.0.0 consolidates the Machala foundation into a playable vertical slice.

### Core systems

- **Render foundation** — WebGL2, ACES tone mapping, dynamic resolution, post-processing and performance guard.
- **Night-city atmosphere** — wet materials, decals, rain, puddles, industrial fog and neon response.
- **Combat** — tactical enemy AI, squad coordination, health, stagger, downed states and weapon feedback.
- **Story** — Cold Cargo campaign, objectives, heat, checkpoints and save state.
- **World** — vehicles, pedestrians, interactive props, Apartment 4B safehouse and zone streaming.
- **Interface** — objective HUD, phone, interaction prompts, settings, accessibility and mobile controls.
- **Release** — build scripts, Docker deployment, live checks, observability and feedback iteration.

## Mission flow

1. Start the Cold Cargo mission.
2. Enter a mission zone.
3. Engage enemies and complete objectives.
4. Escape heat.
5. Reach the extraction point.

## Project structure

```text
nightwire/
├── src/
│   ├── characters/
│   ├── combat/
│   ├── core/
│   ├── story/
│   ├── ui/
│   └── world/
├── docs/
└── scripts/
```

## Documentation

- [Product overview](nightwire/README.md)
- [v2 release](nightwire/docs/NIGHTWIRE_V2_RELEASE.md)
- [Pass section v2](nightwire/docs/PASSES_V2.md)
- [QA and freeze plan](nightwire/docs/QA_FREEZE_PLAN.md)

## Current release

- **Version:** v2.0.0
- **Branch:** `machala/render-foundation-v1`
- **Status:** Vertical slice ready for deployment and live feedback.