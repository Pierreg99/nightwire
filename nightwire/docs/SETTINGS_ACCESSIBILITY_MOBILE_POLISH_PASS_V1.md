# Settings, Accessibility & Mobile Polish Pass v1

## Purpose

This pass makes NIGHTWIRE comfortable, configurable and mobile-friendly.

It adds persistent settings, quality override, sensitivity, FOV, motion reduction, color accessibility, HUD scaling and touch layout polish.

## Modules

- settings.js: persistent settings and quality override
- settingsMenu.js: settings menu with sliders and selects
- accessibility.js: motion, color and readability accessibility
- touchPolish.js: mobile-first touch layout polish

## Settings

- qualityTier: auto, low, medium, high
- lookSensitivity: 0.2 to 3
- touchLookSensitivity: 0.2 to 3
- fieldOfView: 60 to 105
- motionReduction: on or off
- colorblindMode: none, deuteranopia, protanopia, tritanopia
- hudScale: 0.7 to 1.6
- touchButtonScale: 0.7 to 1.6
- masterVolume: 0 to 1
- musicVolume: 0 to 1
- sfxVolume: 0 to 1

## Mobile rules

- Touch buttons must remain reachable with thumbs.
- HUD must not block the central sightline.
- Motion reduction reduces camera shake, sway and screen effects.
- Touch button scale is adjustable.
- Quality can be manually overridden.

## Integration

Import createSettings, createSettingsMenu, createAccessibilitySystem and createTouchPolish.

Create settings first, then pass them into the menu, accessibility system and touch polish system.

## Next gameplay lever

Run a full eight-minute vertical slice test: boot, movement, shooting, vehicle entry, phone, mission progression, heat, extraction and settings. Fix the five worst breaks, then freeze the slice.
