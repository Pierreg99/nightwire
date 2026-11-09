/**
 * Machala Mission & Cold Cargo Campaign Pass v1
 * Mission flow, beat progression and event hooks.
 */

export function createMissionManager({ beats = [] } = {}) {
  const state = {
    currentBeatIndex: 0,
    started: false,
    completed: false,
    failed: false,
    events: []
  };

  const listeners = new Set();

  function on(event, listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function emit(event, payload = {}) {
    state.events.push({ event, payload, time: Date.now() });
    listeners.forEach((listener) => listener({ event, payload }));
  }

  function start() {
    if (state.started) return;

    state.started = true;
    emit('mission:start', { beat: getCurrentBeat() });
  }

  function getCurrentBeat() {
    return beats[state.currentBeatIndex] || null;
  }

  function completeCurrentBeat() {
    const beat = getCurrentBeat();
    if (!beat || state.completed) return;

    emit('beat:complete', { beat });

    if (state.currentBeatIndex >= beats.length - 1) {
      state.completed = true;
      emit('mission:complete', { mission: 'cold-cargo' });
      return;
    }

    state.currentBeatIndex += 1;
    emit('beat:start', { beat: getCurrentBeat() });
  }

  function failMission(reason = 'mission-failed') {
    if (state.completed || state.failed) return;

    state.failed = true;
    emit('mission:failed', { reason });
  }

  function update(context = {}) {
    const beat = getCurrentBeat();
    if (!beat || !state.started || state.completed) return;

    const complete = beat.isComplete?.(context);
    if (complete) completeCurrentBeat();
  }

  return {
    state,
    beats,
    start,
    getCurrentBeat,
    completeCurrentBeat,
    failMission,
    update,
    on
  };
}
