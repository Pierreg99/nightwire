/**
 * NIGHTWIRE v2.0.1 — Heat System (.mjs)
 * Heat and wanted-lite system.
 */

export function createHeatSystem() {
  const state = {
    level: 0,
    maxLevel: 3,
    decay: 0.035,
    lastCrimeTime: 0
  };

  const listeners = new Set();

  function on(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function emit() {
    listeners.forEach((listener) => listener({ ...state }));
  }

  function addHeat(amount = 1, time = performance.now()) {
    state.level = Math.min(state.maxLevel, state.level + amount);
    state.lastCrimeTime = time;
    emit();
  }

  function reduceHeat(amount = 1) {
    state.level = Math.max(0, state.level - amount);
    emit();
  }

  function update(time, deltaTime) {
    if (state.level <= 0) return state;

    const elapsed = (time - state.lastCrimeTime) / 1000;

    if (elapsed > 8) {
      state.level = Math.max(0, state.level - state.decay * deltaTime);
      emit();
    }

    return state;
  }

  function getEnemyDensityMultiplier() {
    return 1 + state.level * 0.35;
  }

  function getSecurityPresence() {
    return state.level >= 2;
  }

  return {
    state,
    addHeat,
    reduceHeat,
    update,
    getEnemyDensityMultiplier,
    getSecurityPresence,
    on
  };
}
