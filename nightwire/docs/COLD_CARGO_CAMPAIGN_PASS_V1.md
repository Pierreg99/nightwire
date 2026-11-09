# Mission & Cold Cargo Campaign Pass v1

## Purpose

This pass turns the tactical combat systems into a playable campaign slice.

It adds objectives, mission beats, heat response, extraction choices and checkpoint saving.

## Modules

| Module | Responsibility |
|---|---|
| objectives.js | Sequential and optional objectives with HUD data |
| missionManager.js | Beat progression, mission events and completion state |
| coldCargo.js | Cold Cargo campaign: cold open, intercept, heat and extraction |
| heatSystem.js | Heat and wanted-lite response |
| checkpoints.js | Checkpoint saving and restoration |

## Campaign flow

| Beat | Objective | Outcome |
|---|---|---|
| Cold Open | Reach Warehouse 09 | Player enters the mission area |
| Intercept | Secure the cargo | Warehouse combat and VIP package |
| Heat | Escape the heat | Security presence and extraction pressure |
| Extract | Apartment 4B or Dock Boat | Player chooses an extraction route |

## Heat rules

- Heat has three levels.
- Criminal actions increase heat.
- Heat decays after a delay.
- Higher heat increases enemy density.
- Level 2 or higher activates security presence.

## Extraction choices

The player can choose between:

- Apartment 4B
- Dock boat

The choice changes the ending voice line and final objective, not the core engine.

## Integration

Import createColdCargoCampaign from story/coldCargo.js.

Call start when the player accepts the job.
Call reachWarehouse, secureCargo, escapeHeat, extractApartment or extractDockBoat when the corresponding gameplay event occurs.

## Next gameplay lever

Connect mission events to enemy spawning, security patrols, phone messages, radio lines, HUD objectives and the final title card.
