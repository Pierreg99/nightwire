# Phase 3 — Zone Blockout

> **S0 APPROVED 2026-09-17** · Cryo Core Lite · SafeMode L2  
> Sequential lock. 4B stays prompt-only until Phase 5.

```
<GROK_BUILD_4_6_FOLLOWUP>
<PHASE_LOCK: 3>
STOP. Kein Skin-Editor. Kein fahrbares Auto. Keine Story-Beats. Kein Heat.

Phase 1+2 bleibt. Darauf drei zusammenhängende Zonen:

Z1 HAFEN — bereits da, nur verbinden.
Z2 NEON-STRIP — enge Straße, Imbiss-Kasten, Club-Tür (geschlossen, Licht), Feuerleiter, ein Balkon, pink/cyan Neon.
Z3 PLATTENBAU-HOF — Parkdeck-Platte, Müllhaus, Treppenhaus-Dummy, Wohnungstür 4B (noch nicht betretbar, Prompt „PHASE 5“).

Pflicht je Zone:
- Collision die hält
- 1 Landmark
- 1 Cover-Cluster für Gunplay
- 1 Lichtidee (Hafen kalt-weiß + rot, Strip neon, Hof oranges Treppenhaus + Mond)
- Spawn-Marker unsichtbar, Extract-Marker unsichtbar
- Dummy-Targets: 4 Hafen, 3 Strip, 3 Hof

Übergänge: Straße ohne Ladebildschirm. Fog/distance fade erlaubt.
1 Interior-Transition NUR als Tür-Mesh + Blackframe 200ms + gleicher Controller. Interior selbst = kleiner Lagerraum am Hafen (Warehouse-Vorraum), nicht das volle Warehouse.

A07 PASS:
[ ] 2 Minuten zu Fuß Hafen→Strip→Hof ohne Fall-through
[ ] Jede Zone in 1s lesbar
[ ] Gunplay aus Phase 2 funktioniert in allen drei
[ ] Keine zweite Waffe, kein Phone-Open

NEXT LOCK: „PHASE 3 LOCKED — next Phase 4 editors only.“
</PHASE_LOCK>
```
