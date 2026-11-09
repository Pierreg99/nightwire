/**
 * NIGHTWIRE v2.0.1 — Objective Coupling (.mjs)
 * Zone entry, enemy defeat and mission progress coupling.
 */

export function createObjectiveCoupling({ campaign, missionSpawn, combatManager }) {
  let disposed = false;

  function onZoneEnter(zoneId) {
    if (disposed) return;

    if (zoneId === 'warehouse-09') {
      campaign.reachWarehouse();
    }

    if (zoneId === 'apartment-4b') {
      campaign.extractApartment();
    }

    if (zoneId === 'dock-boat') {
      campaign.extractDockBoat();
    }
  }

  function onEnemyDefeat(enemyId) {
    if (disposed) return;

    const enemy = combatManager.activeEnemies.find(
      (item) => item.state.id === enemyId
    );

    if (!enemy) return;

    if (enemy.state.currentState === 'downed') {
      campaign.secureCargo();
    }
  }

  function onHeatEscape() {
    if (disposed) return;

    campaign.escapeHeat();
  }

  function dispose() {
    disposed = true;
  }

  return {
    onZoneEnter,
    onEnemyDefeat,
    onHeatEscape,
    dispose
  };
}
