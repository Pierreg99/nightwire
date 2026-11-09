# NIGHTWIRE v2.0.1 — MJS Migration

## Purpose

This migration introduces `.mjs` facades for all remaining JavaScript candidates.

It keeps the existing `.js` modules compatible while establishing `.mjs` as the canonical module format for new NIGHTWIRE v2 code.

## Migrated areas

- Story: objectives, mission manager, campaign, checkpoints, heat, mission spawn, zones and coupling.
- Render: quality, renderer, postfx, lighting, performance, materials, night city materials, surface detail and texture library.
- Core: event bus, input, quality, settings, time, accessibility, camera, feedback analyzer, iteration planner, pad map, QA telemetry, release info, settings and game loop.

## Import rule

New v2 code imports `.mjs` modules.

Existing `.js` modules remain available during the migration.

## Next step

Replace `.js` facades with native `.mjs` implementations module by module, starting with the render pipeline.
