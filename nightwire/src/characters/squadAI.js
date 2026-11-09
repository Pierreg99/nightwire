/**
 * Machala Enemy AI & Tactical Combat Pass v1
 * Squad coordination: suppression, flanking and shared awareness.
 */

import { ENEMY_STATES } from './enemyAI.js';

export function createSquadAI({ members = [] } = {}) {
  const squad = {
    members,
    sharedTarget: null,
    sharedAlertLevel: 0,
    flankAssigned: false
  };

  function addMember(enemy) {
    squad.members.push(enemy);
    enemy.state.squad = squad;
  }

  function shareTarget(position, alertLevel = 1) {
    squad.sharedTarget = position.clone();
    squad.sharedAlertLevel = Math.max(squad.sharedAlertLevel, alertLevel);

    squad.members.forEach((member) => {
      if (member.state.currentState === ENEMY_STATES.PATROL) {
        member.setState(ENEMY_STATES.ALERT, performance.now());
      }

      member.state.lastKnownPlayerPosition.copy(position);
    });
  }

  function assignRoles() {
    const active = squad.members.filter(
      (member) => member.state.currentState !== ENEMY_STATES.DOWNED
    );

    if (active.length < 2) return;

    const suppressor = active[0];
    const flanker = active[1];

    if (squad.sharedTarget) {
      suppressor.setState(ENEMY_STATES.COMBAT, performance.now());
      flanker.setState(ENEMY_STATES.FLANK, performance.now());
      squad.flankAssigned = true;
    }
  }

  function update(time, deltaTime, context = {}) {
    squad.members.forEach((member) => member.update(time, deltaTime, context));

    const active = squad.members.filter(
      (member) => member.state.currentState !== ENEMY_STATES.DOWNED
    );

    if (active.length >= 2 && squad.sharedTarget) {
      assignRoles();
    }

    return squad;
  }

  return {
    squad,
    addMember,
    shareTarget,
    assignRoles,
    update
  };
}
