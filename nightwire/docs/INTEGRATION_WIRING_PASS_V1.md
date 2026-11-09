# Integration & Wiring Pass v1

## Purpose

This pass wires the NIGHTWIRE systems together.

It connects render, combat, mission, phone, monitoring and feedback into a single game loop.

## Modules

- eventBus.js: cross-system communication
- gameBootstrap.js: system wiring and lifecycle
- gameLoop.js: frame loop with telemetry

## Update order

1. Input
2. Player
3. Vehicles
4. NPCs
5. Combat
6. Mission
7. Render
8. Telemetry

## Integration

Import createGameBootstrap and createGameLoop.

Create the bootstrap with canvas, scene, camera and container. Then create the loop and start it.

## Next step

Run the full vertical slice test and fix the five worst breaks before freeze.
