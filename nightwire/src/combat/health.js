/**
 * Machala Enemy AI & Tactical Combat Pass v1
 * Health, regeneration, stagger and downed state.
 */

export function createHealthSystem({ maxHealth = 100, regenDelay = 3.2, regenRate = 16 } = {}) {
  const state = {
    health: maxHealth,
    maxHealth,
    lastDamageTime: 0,
    stagger: 0,
    downed: false
  };

  function takeDamage(damage, time) {
    if (state.downed) return state;

    state.health = Math.max(0, state.health - damage);
    state.lastDamageTime = time;
    state.stagger = Math.min(1, state.stagger + damage / 100);

    if (state.health <= 0) {
      state.downed = true;
    }

    return state;
  }

  function update(time, deltaTime) {
    if (state.downed) return state;

    const canRegenerate = time - state.lastDamageTime >= regenDelay;

    if (canRegenerate && state.health < state.maxHealth) {
      state.health = Math.min(
        state.maxHealth,
        state.health + regenRate * deltaTime
      );
    }

    state.stagger = Math.max(0, state.stagger - deltaTime * 0.28);
    return state;
  }

  function revive(health = maxHealth) {
    state.health = Math.min(maxHealth, health);
    state.downed = false;
    state.stagger = 0;
    return state;
  }

  return {
    state,
    takeDamage,
    update,
    revive
  };
}
