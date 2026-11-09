/**
 * Machala Mission & Cold Cargo Campaign Pass v1
 * Objective system with sequential and optional objectives.
 */

export const OBJECTIVE_STATUS = {
  LOCKED: 'locked',
  ACTIVE: 'active',
  COMPLETE: 'complete',
  FAILED: 'failed'
};

export function createObjectiveSystem() {
  const objectives = new Map();
  let activeId = null;

  function addObjective({ id, title, description, optional = false, requires = [] }) {
    objectives.set(id, {
      id,
      title,
      description,
      optional,
      requires,
      status: OBJECTIVE_STATUS.LOCKED,
      progress: 0,
      target: 1
    });
  }

  function activate(id) {
    const objective = objectives.get(id);
    if (!objective) return null;

    objective.status = OBJECTIVE_STATUS.ACTIVE;
    activeId = id;
    return objective;
  }

  function setProgress(id, progress, target) {
    const objective = objectives.get(id);
    if (!objective) return null;

    objective.progress = Math.max(0, progress);
    objective.target = Math.max(1, target);

    if (objective.progress >= objective.target) {
      objective.status = OBJECTIVE_STATUS.COMPLETE;
    }

    return objective;
  }

  function complete(id) {
    const objective = objectives.get(id);
    if (!objective) return null;

    objective.status = OBJECTIVE_STATUS.COMPLETE;
    objective.progress = objective.target;
    return objective;
  }

  function fail(id) {
    const objective = objectives.get(id);
    if (!objective) return null;

    objective.status = OBJECTIVE_STATUS.FAILED;
    return objective;
  }

  function getActive() {
    return activeId ? objectives.get(activeId) : null;
  }

  function getHud() {
    const active = getActive();
    if (!active) return null;

    return {
      id: active.id,
      title: active.title,
      description: active.description,
      progress: active.progress,
      target: active.target,
      optional: active.optional
    };
  }

  function isComplete(id) {
    return objectives.get(id)?.status === OBJECTIVE_STATUS.COMPLETE;
  }

  return {
    objectives,
    addObjective,
    activate,
    setProgress,
    complete,
    fail,
    getActive,
    getHud,
    isComplete
  };
}
