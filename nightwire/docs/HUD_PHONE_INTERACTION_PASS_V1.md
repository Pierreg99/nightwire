# HUD, Phone & Interaction Pass v1

## Purpose

This pass makes the NIGHTWIRE interface readable, mobile-friendly and immersive.

It adds the objective HUD, vitals, heat display, phone shell, map blips, radio, messages and interaction prompts.

## Modules

| Module | Responsibility |
|---|---|
| hud.js | Objective, health, ammo and heat display |
| phone.js | Jobs, map blips, radio and messages |
| interaction.js | Context-sensitive interaction prompts |

## HUD rules

- Objectives appear top-left.
- Health and ammo appear bottom-left.
- Heat appears top-right.
- The HUD must never block the central sightline.
- Touch controls remain readable and reachable.

## Phone rules

The phone contains four tabs:

- Jobs
- Map
- Radio
- Messages

Jobs show mission status. Map shows blips. Radio offers Dark Synth and Late Night Talk. Messages store mission communication.

## Interaction rules

Interaction prompts use a clear key label and action label.

Examples:

- F Enter Vehicle
- F Open Door
- F Loot Crate
- F Open Phone

## Integration

Import createHUD, createPhone and createInteractionSystem from the ui folder.

Create each system with a UI container, then update the HUD from gameplay state and trigger interactions from input events.

## Next gameplay lever

Connect the phone and interaction system to the Cold Cargo campaign: mission jobs, map blips, extraction prompts, radio stations and final title card.
