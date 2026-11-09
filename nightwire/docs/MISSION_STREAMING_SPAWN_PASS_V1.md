# Mission Streaming & Spawn Pass v1

## Purpose

This pass connects mission zones to enemy spawning.

It spawns enemies when the player enters a mission zone.

## Modules

- missionSpawn.js: mission zones, enemy spawning and objective coupling
- missionZones.js: mission zones with enemy spawns

## Mission zones

- Warehouse 09
- Dock Road
- Apartment 4B
- Dock Boat

## Integration

Import createMissionSpawnManager and MISSION_ZONES.

Create the manager with scene, combat manager and zones. Call update with player position and current zone id.

## Next step

Connect mission objectives to zone entry and enemy defeat.
