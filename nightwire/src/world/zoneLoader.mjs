/**
 * NIGHTWIRE v2.0.1 — Zone Loader (.mjs)
 * Loads and unloads streamed zones.
 */

export function createZoneLoader({ scene }) {
  const loaded = new Map();

  function loadZone(zone) {
    if (loaded.has(zone.id)) return null;

    const group = new (scene.constructor.Object3D || Object3DFallback)();
    group.name = 'zone-' + zone.id;
    scene.add(group);

    loaded.set(zone.id, group);
    return group;
  }

  function unloadZone(zoneId) {
    const group = loaded.get(zoneId);
    if (!group) return false;

    scene.remove(group);
    loaded.delete(zoneId);
    return true;
  }

  function isLoaded(zoneId) {
    return loaded.has(zoneId);
  }

  function dispose() {
    loaded.forEach((group) => scene.remove(group));
    loaded.clear();
  }

  return {
    loadZone,
    unloadZone,
    isLoaded,
    dispose
  };
}

function Object3DFallback() {
  this.children = [];
}
