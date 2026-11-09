/**
 * Machala World Streaming & Zone Loader Pass v1
 * Zone loading and unloading.
 */

import * as THREE from 'three';

export function createZoneLoader({ scene }) {
  const loadedZones = new Map();

  function createZoneMesh(zone) {
    const group = new THREE.Group();

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(zone.size, zone.size),
      new THREE.MeshStandardMaterial({ color: 0x1a1d21, roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    group.add(ground);
    group.position.set(zone.position.x, 0, zone.position.z);

    return group;
  }

  function loadZone(zone) {
    if (loadedZones.has(zone.id)) return null;

    const group = createZoneMesh(zone);
    scene.add(group);
    loadedZones.set(zone.id, group);

    return group;
  }

  function unloadZone(id) {
    const group = loadedZones.get(id);
    if (!group) return false;

    scene.remove(group);
    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });

    loadedZones.delete(id);
    return true;
  }

  function isLoaded(id) {
    return loadedZones.has(id);
  }

  function dispose() {
    loadedZones.forEach((group) => {
      scene.remove(group);
      group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });

    loadedZones.clear();
  }

  return {
    loadedZones,
    loadZone,
    unloadZone,
    isLoaded,
    dispose
  };
}
