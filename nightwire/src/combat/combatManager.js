/**
 * Machala Enemy AI & Tactical Combat Pass v1
 * Central combat manager: hits, damage, suppression and combat events.
 */

import * as THREE from 'three';

export function createCombatManager({ enemies = [] } = {}) {
  const activeEnemies = enemies;
  let disposed = false;

  function raycastEnemies({ origin, direction, maxDistance = 80 }) {
    if (disposed) return null;

    const ray = new THREE.Raycaster(
      origin,
      direction.clone().normalize(),
      0,
      maxDistance
    );

    const objects = activeEnemies
      .filter((enemy) => enemy.state.currentState !== 'downed')
      .map((enemy) => enemy.object);

    const intersections = ray.intersectObjects(objects, true);
    return intersections[0] || null;
  }

  function applyHit({ enemy, damage, headshot = false, direction, time }) {
    if (!enemy || disposed) return null;

    const finalDamage = headshot ? damage * 2 : damage;

    enemy.takeDamage({
      damage: finalDamage,
      direction: direction || new THREE.Vector3(0, 0, -1),
      time
    });

    if (enemy.state.squad) {
      enemy.state.squad.sharedAlertLevel = Math.max(
        enemy.state.squad.sharedAlertLevel,
        1
      );
    }

    return {
      enemyId: enemy.state.id,
      damage: finalDamage,
      headshot,
      remainingHealth: enemy.state.health,
      downed: enemy.state.currentState === 'downed'
    };
  }

  function suppressArea({ position, radius = 6, amount = 0.35 }) {
    if (disposed) return;

    activeEnemies.forEach((enemy) => {
      const distance = enemy.object.position.distanceTo(position);

      if (distance <= radius) {
        enemy.state.suppression = Math.min(
          1,
          enemy.state.suppression + amount
        );
      }
    });
  }

  function update(time, deltaTime, context = {}) {
    if (disposed) return;

    activeEnemies.forEach((enemy) => enemy.update(time, deltaTime, context));
  }

  function dispose() {
    disposed = true;
    activeEnemies.length = 0;
  }

  return {
    activeEnemies,
    raycastEnemies,
    applyHit,
    suppressArea,
    update,
    dispose
  };
}
