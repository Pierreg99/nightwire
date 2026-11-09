# World Streaming & Zone Loader Pass v1

## Purpose

This pass adds zone streaming to NIGHTWIRE.

It loads zones near the player and unloads zones that are far away.

## Modules

- zoneLoader.js: zone loading and unloading
- streamingManager.js: distance-based activation

## Streaming rules

- Load zones within 70 units.
- Unload zones beyond 95 units.
- Keep a buffer between load and unload distance.
- Only load zones that are needed.

## Integration

Import createStreamingManager and pass a list of zones.

Call update with the player position each frame.

## Next step

Connect zones to mission objectives and enemy spawning.
