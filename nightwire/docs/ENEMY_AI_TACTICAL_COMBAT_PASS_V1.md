# Enemy AI & Tactical Combat Pass v1

## Purpose

This pass turns NIGHTWIRE enemies from static targets into readable tactical opponents.

Enemies now use perception, combat states, cover awareness, squad coordination, suppression and damage response.

## Modules

| Module | Responsibility |
|---|---|
| enemyAI.js | Enemy state machine, perception, cover selection and damage response |
| squadAI.js | Shared awareness, suppression and flank assignment |
| combatManager.js | Raycast hits, damage application and suppression areas |
| health.js | Health, regeneration, stagger and downed state |

## Enemy states

| State | Behavior |
|---|---|
| patrol | Normal patrol behavior |
| alert | Heard or partially saw something |
| search | Searches last known player position |
| combat | Engages the player |
| flank | Moves to a flank position |
| retreat | Withdraws under pressure or stagger |
| reload | Reloads when out of ammunition |
| downed | Neutralized |

## Tactical rules

- Enemies do not become perfectly accurate immediately.
- Accuracy rises while the player remains visible.
- Suppression reduces confidence and can trigger retreat.
- Squads share target information.
- At least two active enemies can coordinate suppressor and flanker roles.
- Damage creates stagger; high stagger forces retreat.

## Integration

Import createEnemyAI from characters/enemyAI.js, createSquadAI from characters/squadAI.js and createCombatManager from combat/combatManager.js.

Create two enemies with createEnemyAI, add them to createSquadAI and createCombatManager, then call combat.update and squad.update with playerPosition and cameraDirection each frame.

## Next gameplay lever

Connect this system to the weapon feedback pass: raycast shots, apply damage, spawn impact FX, play material-aware audio and trigger hitmarkers. Then add mission objectives and the Cold Cargo campaign flow.
