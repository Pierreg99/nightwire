---
name: cryo-core-lite
description: >-
  Orchestrate NIGHTWIRE (tactical FPS × GTA/FiveM city slice) under Cryo Core Lite:
  S0/A05/A06/A07, max 2–3 agents, max 3 loops per module, A07 checklist, SafeMode L2.
  Use when the user mentions NIGHTWIRE, cryo-core-lite, GameASSISTSNT, Neo-Duisburg,
  skim editor, wardrobe/skin editor, FiveM, or COLD CARGO.
  Slash: /cryo-core-lite.
---

# Cryo Core Lite — NIGHTWIRE

> **S0 APPROVED 2026-09-17** · Working contract.

Product rules live in this skill, `AGENTS.md` and `nightwire/MANIFEST.md`. The old phase cards and master prompt were retired after the Phase 8 freeze.
This skill is the working contract. Do not invent a 34-agent fan-out. Do not promise CoD parity.

## Roles (max 2–3 live)

| ID | Role | Job |
|----|------|-----|
| S0 | Orchestrator | Module order, loop budget, no stalling |
| A05 | Architect | Systems, scene graph, controls, data |
| A06 | Coder | Real Three.js. No pseudocode. No truncated files |
| A07 | Reviewer | Hard critic vs the checklist below, not vs retail CoD |

Every visible drop goes through A07. Max 3 fix loops per module, then move on.

## Product

- Name: **NIGHTWIRE**. Engine: Three.js WebGL2 + Vite. Desktop pointer-lock + first-class touch.
- Setting: Neo-Duisburg / Rhein-Ruhr Night District. Tone: cinematic, wet, dirty, never cartoon.
- Stack folders live under `nightwire/src/`.

## Mandatory systems — all of them

- **FPS:** walk/sprint/crouch/jump, hipfire vs ADS, 3 guns (SMG, assault, pistol) + melee, recoil patterns, hitscan tracers, decals, health regen-lite, hitmarker, kill-feed, weighted viewmodel + reload.
- **Character:** visible FP arms, identity (name, callsign, jacket, mask, pants, shoes, tattoo, wear), NPC types Civil/Crew/Security/Street, idle breath, readable silhouette at 20 m.
- **Maps:** 3 connected zones — Hafen/Docks, Neon-Strip, Plattenbau-Hof — each with collision, landmark, 1 interior, cover, spawn/extract, a distinct night lighting idea.
- **Touch:** left stick, right look pad, fire/ADS/reload/jump/crouch/interact/vehicle. Toggle-able on desktop. Do not cover the sightline.
- **Wardrobe (skin editor):** live FP arms + TP mannequin, 3 loadouts, JSON export, apply instantly.
- **Skim editor:** top-down/orbit, zone toggles, place cover/light/vehicle/NPC/trigger/landmark, path heatmap, save map JSON, playtest-drop into FPS.
- **Story COLD CARGO:** Beat 0 auto-starts after title (radio + phone job). Warehouse 09 intercept, heat, extract 4B or dock boat. HUD objectives. Handler KITE. End title-card + 1 skin unlock.
- **GTA/FiveM layer:** 2 vehicles (sedan, van) enter/exit/drive/horn/radio, [F] prompts, pedestrians, heat 0–3, phone (jobs/map/wardrobe/radio/messages), 2 radio stations, usable props, apartment 4B safehouse. No copyright maps, logos, or songs.

## Build order (do not skip)

1. Skeleton → 2. Gunplay → 3. City blockout → 4. Identity + editors → 5. Vehicles/NPCs/heat/radio → 6. Story beats → 7. Touch/settings/polish → 8. A07 full gate.

First visible boot: Phase 1+2 in the harbor street (move, aim, 3 weapons, dummy targets, touch toggle, 1 neon landmark, rain, phone shell). Then Phase 3 without asking.

## A07 visual fail (2+ red = fail the module)

Horizon/landmark readable in <1 s · no Z-fight/floating · ground contact · bloom not blown · UI matches the film look · 1 strong light idea per zone · shot feedback instant · touch not over sightline · 60 fps desktop mid / 30+ mobile reduced.

## Quality gate (do not ship FAIL)

Q ≥ 0.88, PIS ≥ 0.78. No placeholder cube as a “finished map”. No “story later”. Wardrobe saves ≥1 preset. Skim can place 1 prop and playtest-drop. Beat 0 after title with no extra click. A07 writes PASS or PASS WITH NOTES.

## Honesty (SafeMode L2)

AAA-adjacent is the goal. Do not claim indistinguishability from retail CoD. If a frame budget breaks, cut complexity — do not fake quality.
