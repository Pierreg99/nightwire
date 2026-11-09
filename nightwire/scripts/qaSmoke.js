/**
 * Machala Full Vertical Slice QA & Freeze Pass v1
 * Lightweight smoke checks for core gameplay modules.
 */

import { createQualitySystem } from '../src/render/quality.js';
import { createWeaponFeel } from '../src/weapons/weaponFeel.js';
import { createEnemyAI } from '../src/characters/enemyAI.js';
import { createSquadAI } from '../src/characters/squadAI.js';
import { createCombatManager } from '../src/combat/combatManager.js';
import { createObjectiveSystem } from '../src/story/objectives.js';
import { createHeatSystem } from '../src/story/heatSystem.js';

export function runQaSmoke() {
  const results = [];

  function check(name, condition) {
    results.push({ name, passed: Boolean(condition) });
  }

  const quality = createQualitySystem({ initialTier: 'medium' });
  check('quality system returns medium tier', quality.get().id === 'medium');

  const weapon = createWeaponFeel('rifle');
  check('rifle weapon profile exists', weapon.profile.id === 'rifle');
  check('rifle can fire', weapon.canFire(1000));

  const enemy = createEnemyAI({ id: 'qa-enemy', position: { x: 0, y: 0, z: 0 } });
  check('enemy starts in patrol state', enemy.state.currentState === 'patrol');

  const squad = createSquadAI({ members: [enemy] });
  check('squad accepts member', squad.squad.members.length === 1);

  const combat = createCombatManager({ enemies: [enemy] });
  check('combat manager accepts enemy', combat.activeEnemies.length === 1);

  const objectives = createObjectiveSystem();
  objectives.addObjective({ id: 'qa-objective', title: 'QA Objective' });
  objectives.activate('qa-objective');
  check('objective activates', objectives.getActive()?.id === 'qa-objective');

  const heat = createHeatSystem();
  heat.addHeat(2);
  check('heat system increases level', heat.state.level === 2);

  const failed = results.filter((result) => !result.passed);

  return {
    passed: failed.length === 0,
    total: results.length,
    failed: failed.length,
    results
  };
}
