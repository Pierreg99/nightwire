# Grok Build 4.6 — Follow-up Karte
## NIGHTWIRE · NUR Phase 1 + Phase 2
### Hafenstraße Vertical Slice · Three.js · Touch + Desktop

> **S0 APPROVED 2026-09-17** · Cryo Core Lite · SafeMode L2  
> Sequential lock only. Later phase cards supersede the STOP list. Touch **T** remains a required hotkey.

> Nach dem Masterprompt schicken, wenn der Builder Maps/Story/Editor/FiveM zu früh anfängt oder in Würfel-Demos driftet.
> Ein Block. Kein Scope-Creep.

---

```
<GROK_BUILD_4_6_FOLLOWUP>
<PHASE_LOCK: 1+2>
<CRYO_CORE_LITE_ON>

STOP. Kein Warehouse-Interior. Kein Phone-Full-App. Kein Skin-Editor. Kein Fahrzeug. Keine Story-Beats 1–3. Kein zweites District.

Du baust JETZT nur den spielbaren Hafenstraßen-Slice.

LIEFERUMFANG (alles, nichts darüber):

1. Boot
- Dunkler Night-Look, leichter Regen-Partikel oder nasser Boden-Shader
- 1 Landmark: neonrotes Hafen-Schild / Kran-Silhouette
- Asphalt + 2 Container + 1 Van als STATISCHES Prop (nicht fahrbar)
- 1 gerichtetes Mondlicht + 1 Neon-Punktlicht
- Pointer-Lock Desktop

2. FPS-Controller
- WASD, Mausblick, Shift Sprint, Ctrl Ducken, Leertaste kurzer Jump
- FOV ~75 Hüfte / enger bei ADS
- Kamera-Bob sehr dezent
- Collider gegen Container/Van/Wände, nicht durch Wände gleiten

3. Gunplay (Pflicht)
- 3 Waffen umschaltbar 1 / 2 / 3 und Mausrad:
  Pistol · SMG · Assault
- Fire LMB, ADS RMB, Reload R
- Eigenes Recoil-Pattern je Waffe
- Hitscan, Tracer, Hitmarker, Headshot-Pitch
- Impakt-Decal auf Beton/Metall
- Viewmodel-Arme sichtbar (keine schwebende Waffe)
- 8 Dummy-Targets in der Straße (Torso+Kopf-Hitbox), fallen um oder markieren Kill

4. Touch (sichtbar umschaltbar, Hotkey T)
- Linker Stick, rechter Look-Pad
- Buttons: Fire, ADS, Reload, Jump, Crouch, Weapon-Cycle
- Buttons nicht über Crosshair
- Sens-Slider Pause-Menü (Esc): Look, Touch-Look, HUD-Scale

5. HUD-Minimum
- Crosshair
- Waffe + Mag
- Mini-Hitmarker
- Pause: Resume / Sens / Touch on-off / Restart slice
- Phone-Icon DARF als totes Icon unten rechts existieren. Nicht öffenbar. Label „COMING PHASE 4“.

6. Audio-Minimum
- Schuss je Waffe
- Reload-Klick
- Schritt nass
- Stadt-Bett leise + Regen

A07 GATE — Phase 1+2 PASS nur wenn:
[ ] 30 Sekunden strafe-aim ohne durch Geometrie zu fallen
[ ] 3 Waffen fühlen sich unterschiedlich an (RPM, Recoil, Sound)
[ ] Dummy-Targets sterben klar
[ ] Touch-Layout per T sichtbar, Desktop bleibt spielbar
[ ] Kein Bloom-Ausbrennen, Landmark in 1 Sekunde lesbar
[ ] README: Start, Controls, T = Touch, Esc = Pause

VERBOTEN BIS GATE GRÜN:
Map-Editor, Wardrobe, Fahrphysik, NPCs mit KI, Heat, Apartment, Funk-Story, zweite Zone.

NACH PASS (erst dann, ein Satz in der Konsole / README):
„PHASE 1+2 LOCKED — next is Phase 3 Zone-Blockout only.“

Bau Reihenfolge in DIESER Session:
A) Scene + Licht + Boden + Landmark
B) Controller + Collision
C) Eine Waffe vollständig
D) Zwei weitere Waffen
E) Dummy-Targets
F) Touch + Pause
G) Audio
H) A07-Checkliste schriftlich PASS / FAIL

Wenn FAIL: genau EIN Loop auf den rotesten Punkt. Dann wieder Gate.
Nicht neu architekturieren.

<PHASE_LOCK_END>
```

---

## Verwendung

1. Masterprompt zuerst (Datei `GROK-BUILD-46-MASTER-PROMPT.md`).
2. Sobald der Builder weich wird oder Phase 3–8 anfasst: **diese Karte** hinterherschicken.
3. Erst bei A07 PASS die nächste Karte verlangen: Phase 3 Zone-Blockout (Hafen ↔ Strip ↔ Hof, noch ohne Story).

## Mini-Coach

Der häufigste Drift: „ich baue schon das Phone und den Editor mit.“  
Antwort: Phone bleibt Icon. Editor bleibt tot. Eine Straße. Drei Waffen. Acht Targets.
