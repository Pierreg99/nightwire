/**
 * NIGHTWIRE v2.0.1 — Feature Registry
 * Central feature flags for the playable vertical slice.
 */

export const defaultFeatures = {
  'render.foundation': true,
  'render.dynamicResolution': true,
  'world.materialWeather': true,
  'world.textureDetail': true,
  'combat.weaponFeedback': true,
  'combat.enemyAI': true,
  'combat.squadCoordination': true,
  'story.coldCargo': true,
  'story.checkpoints': true,
  'ui.phone': true,
  'ui.hud': true,
  'ui.interactions': true,
  'settings.persistence': true,
  'settings.accessibility': true,
  'world.vehicles': true,
  'world.npcs': true,
  'world.streaming': true,
  'mission.streaming': true,
  'mission.objectiveCoupling': true,
  'observability.telemetry': true,
  'observability.feedback': true,
  'assets.procedural': true,
  'design.system': true
};

export function createFeatureRegistry(overrides = {}) {
  const features = {
    ...defaultFeatures,
    ...overrides
  };

  return {
    isEnabled(feature) {
      return Boolean(features[feature]);
    },
    enable(feature) {
      features[feature] = true;
    },
    disable(feature) {
      features[feature] = false;
    },
    snapshot() {
      return { ...features };
    }
  };
}
