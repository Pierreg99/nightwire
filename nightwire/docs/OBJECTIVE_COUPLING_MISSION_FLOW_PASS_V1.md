# Objective Coupling & Mission Flow Pass v1

## Purpose

This pass connects mission objectives to gameplay events.

It couples zone entry, enemy defeat and heat escape to mission progress.

## Modules

- objectiveCoupling.js: zone entry, enemy defeat and heat escape coupling

## Mission flow

- Zone entry advances objectives.
- Enemy defeat advances objectives.
- Heat escape advances objectives.

## Integration

Import createObjectiveCoupling and pass campaign, mission spawn and combat manager.

Call onZoneEnter, onEnemyDefeat and onHeatEscape when the corresponding gameplay event occurs.

## Next step

Run the full vertical slice test and fix the five worst breaks before freeze.
