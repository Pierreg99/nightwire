/**
 * Machala Enemy AI & Tactical Combat Pass v1
 * Readable, tactical enemy behavior with perception, cover and combat states.
 */

import * as THREE from 'three';

export const ENEMY_STATES = {
  PATROL: 'patrol',
  ALERT: 'alert',
  SEARCH: 'search',
  COMBAT: 'combat',
  FLANK: 'flank',
  RETREAT: 'retreat',
  RELOAD: 'reload',
  DOWNED: 'downed'
};

export function createEnemyAI({ id, position, squad = null }) {
  const object = new THREE.Object3D();
  object.position.copy(position);

  const state = {
    id,
    object,
    currentState: ENEMY_STATES.PATROL,
    health: 100,
    maxHealth: 100,
    stagger: 0,
    ammo: 24,
    reloadTime: 0,
    lastSeenPlayerAt: 0,
    lastKnownPlayerPosition: new THREE.Vector3(),
    patrolIndex: 0,
    patrolPoints: [],
    coverPoint: null,
    suppression: 0,
    accuracy: 0.35,
    fireCooldown: 0,
    squad
  };

  function setState(nextState, time) {
    if (state.currentState === nextState) return;

    state.currentState = nextState;

    if (nextState === ENEMY_STATES.RELOAD) {
      state.reloadTime = time + 1800;
    }

    if (nextState === ENEMY_STATES.DOWNED) {
      state.health = 0;
    }
  }

  function canSeePlayer({ playerPosition, cameraDirection, maxDistance = 42, fieldOfView = 100 }) {
    const toPlayer = playerPosition.clone().sub(state.object.position);
    const distance = toPlayer.length();

    if (distance > maxDistance) return false;

    const forward = cameraDirection || new THREE.Vector3(0, 0, -1);
    const angle = THREE.MathUtils.radToDeg(forward.angleTo(toPlayer.normalize()));

    return angle <= fieldOfView / 2;
  }

  function hearNoise({ position, loudness = 1, maxDistance = 22 }) {
    const distance = state.object.position.distanceTo(position);
    if (distance > maxDistance * loudness) return false;

    state.lastKnownPlayerPosition.copy(position);
    return true;
  }

  function takeDamage({ damage, direction, time }) {
    if (state.currentState === ENEMY_STATES.DOWNED) return;

    state.health -= damage;
    state.stagger = Math.min(1, state.stagger + damage / 100);
    state.lastKnownPlayerPosition.copy(state.object.position).add(direction);

    if (state.health <= 0) {
      setState(ENEMY_STATES.DOWNED, time);
      return;
    }

    if (state.stagger >= 0.65) {
      setState(ENEMY_STATES.RETREAT, time);
    } else if (state.currentState === ENEMY_STATES.PATROL || state.currentState === ENEMY_STATES.ALERT) {
      setState(ENEMY_STATES.COMBAT, time);
    }
  }

  function selectCover(coverPoints) {
    if (!coverPoints?.length) return null;

    let best = null;
    let bestScore = -Infinity;

    coverPoints.forEach((point) => {
      const distance = state.object.position.distanceTo(point.position);
      const exposure = point.exposure ?? 0.5;
      const score = -distance * 0.08 - exposure * 20;

      if (score > bestScore) {
        bestScore = score;
        best = point;
      }
    });

    state.coverPoint = best;
    return best;
  }

  function update(time, deltaTime, context = {}) {
    if (state.currentState === ENEMY_STATES.DOWNED) return state;

    const playerVisible = canSeePlayer(context);

    if (playerVisible) {
      state.lastSeenPlayerAt = time;
      state.lastKnownPlayerPosition.copy(context.playerPosition);
      state.accuracy = Math.min(0.85, state.accuracy + deltaTime * 0.12);
    } else {
      state.accuracy = Math.max(0.35, state.accuracy - deltaTime * 0.08);
    }

    state.suppression = Math.max(0, state.suppression - deltaTime * 0.35);
    state.stagger = Math.max(0, state.stagger - deltaTime * 0.22);

    switch (state.currentState) {
      case ENEMY_STATES.PATROL:
        if (playerVisible) setState(ENEMY_STATES.COMBAT, time);
        break;

      case ENEMY_STATES.ALERT:
        if (playerVisible) setState(ENEMY_STATES.COMBAT, time);
        else if (time - state.lastSeenPlayerAt > 6) setState(ENEMY_STATES.SEARCH, time);
        break;

      case ENEMY_STATES.SEARCH:
        if (playerVisible) setState(ENEMY_STATES.COMBAT, time);
        break;

      case ENEMY_STATES.COMBAT:
        if (!playerVisible && time - state.lastSeenPlayerAt > 3.5) {
          setState(ENEMY_STATES.SEARCH, time);
        } else if (state.ammo <= 0) {
          setState(ENEMY_STATES.RELOAD, time);
        } else if (state.suppression > 0.7) {
          setState(ENEMY_STATES.RETREAT, time);
        }
        break;

      case ENEMY_STATES.FLANK:
        if (playerVisible) setState(ENEMY_STATES.COMBAT, time);
        break;

      case ENEMY_STATES.RETREAT:
        if (state.stagger < 0.2 && playerVisible) setState(ENEMY_STATES.COMBAT, time);
        break;

      case ENEMY_STATES.RELOAD:
        if (time >= state.reloadTime) {
          state.ammo = 24;
          setState(ENEMY_STATES.COMBAT, time);
        }
        break;

      default:
        break;
    }

    return state;
  }

  return {
    state,
    object,
    setState,
    canSeePlayer,
    hearNoise,
    takeDamage,
    selectCover,
    update
  };
}
