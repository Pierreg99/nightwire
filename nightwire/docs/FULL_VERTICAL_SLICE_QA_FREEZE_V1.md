# Full Vertical Slice QA & Freeze Pass v1

## Purpose

This pass validates the NIGHTWIRE vertical slice before freeze.

It checks boot, movement, shooting, vehicles, phone, mission progression, heat, extraction, settings and performance.

## Modules

- scripts/qaSmoke.js: lightweight smoke checks for core gameplay modules
- src/core/qaTelemetry.js: frame-time telemetry collector

## Eight-minute test plan

1. Boot the game and confirm the first scene loads.
2. Move, sprint, crouch and jump.
3. Fire pistol, SMG and rifle.
4. Reload each weapon.
5. Enter and exit a vehicle.
6. Open the phone and check Jobs, Map, Radio and Messages.
7. Start Cold Cargo and reach Warehouse 09.
8. Secure the cargo and trigger Heat.
9. Escape the heat and choose an extraction route.
10. Open Settings and change quality, sensitivity, FOV and accessibility.
11. Run for eight minutes and watch frame time.
12. Confirm no crash, no stuck objective and no broken interaction.

## Freeze criteria

The slice is frozen when all of the following are true:

- No crash during the eight-minute run.
- No stuck objective.
- No broken interaction prompt.
- No invisible wall blocking the intended route.
- No weapon that cannot fire or reload.
- No vehicle that cannot enter or exit.
- No phone tab that fails to open.
- No quality tier that drops below its target frame rate.
- No unhandled console error during normal play.

## Performance targets

- Desktop medium hardware: 60 FPS target.
- Mobile medium hardware: 30 FPS target.
- Low tier: reduced effects and stable 30 FPS.

## QA smoke

Run the smoke checks after major gameplay changes.

The smoke check validates:

- Quality system
- Weapon profile
- Enemy AI
- Squad AI
- Combat manager
- Objective system
- Heat system

## Next step

After freeze, create a release branch, tag the build and prepare a playable vertical slice bundle.
