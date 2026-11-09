# Vehicles, NPCs & World Interaction Pass v1

## Purpose

This pass makes the NIGHTWIRE city slice feel inhabited and interactive.

It adds vehicle handling, NPC pedestrians, interactive props and the Apartment 4B safehouse.

## Modules

| Module | Responsibility |
|---|---|
| vehicleController.js | Vehicle enter, exit, acceleration, steering and camera follow |
| npcSystem.js | NPC pedestrians with idle, walk and player avoidance |
| interactions.js | Proximity-based interactive props and prompts |
| safehouse.js | Apartment 4B safehouse-lite with wardrobe interaction |

## Vehicles

The vehicle controller supports:

- Enter and exit
- Acceleration and braking
- Steering
- Forward movement
- Camera follow

The first vehicle is a civilian sedan-style blockout. A van variant can reuse the same controller with different dimensions and handling values.

## NPCs

NPCs have three simple states:

- idle
- walk
- avoid player

They do not pretend to be a full open-world crowd system. They provide believable street life for the vertical slice.

## Interactions

Interactive props use a proximity radius and a prompt.

Examples:

- Enter Vehicle
- Open Door
- Loot Crate
- Open Wardrobe

## Safehouse

Apartment 4B contains:

- Floor and back wall
- Window with emissive night view
- Mirror
- Wardrobe interaction

It is a safehouse-lite, not a full interior simulation.

## Integration

Import createVehicleController, createNPCSystem, createWorldInteractions and createSafehouse.

Create the systems with scene, camera, player, quality and interaction dependencies, then call their update functions in the main game loop.

## Next gameplay lever

Connect vehicle entry, loot crates, doors and wardrobe to the Cold Cargo mission flow. Then add radio playback and phone message events.
