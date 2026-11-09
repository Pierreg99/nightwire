/**
 * Machala Mission Streaming & Spawn Pass v1
 * Mission zones, enemy spawning and objective coupling.
 */

import * as THREE from 'three';
import { createEnemyAI } from '../characters/enemyAI.js';

export function createMissionSpawnManager({ scene, combatManager, zones = [] }) {
  const spawnedZones = new Set();
  let disposed = false;

  function spawnEnemiesForZone(zone) {
    if (disposed || !zone.enemySpawns) return [];

    return zone.enemySpawns.map((spawn, index) => {
      const enemy = createEnemyAI({
        id: zone.id + '-enemy-' + index,
        position: new THREE.Vector3(spawn.x, spawn.y, spawn.z)
      });

      combatManager.activeEnemies.push(enemy);
      return enemy;
    });
  }

  function update(playerPosition, currentZoneId) {
    if (disposed) return;

    const zone = zones.find((item) => item.id === currentZoneId);

    if (!zone || spawnedZones.has(zone.id)) return;

    spawnedZones.add(zone.id);
    spawnEnemiesForZone(zone);
  }

  function dispose() {
    disposed = true;
    spawnedZones.clear();
  }

  return {
    spawnedZones,
    spawnEnemiesForZone,
    update,
    dispose
  };
}
