/**
 * Machala Night-City Material & Weather Pass v1
 * Lightweight decal system for impact, oil, blood, cracks and tire marks.
 */

import * as THREE from 'three';

const DECAL_TYPES = {
  impact: { color: 0x0a0a0a, opacity: 0.72, size: 0.16 },
  blood: { color: 0x4a0d10, opacity: 0.78, size: 0.28 },
  oil: { color: 0x05070a, opacity: 0.68, size: 0.55 },
  crack: { color: 0x0d0f12, opacity: 0.55, size: 0.75 },
  tireMark: { color: 0x08090b, opacity: 0.45, size: 0.35 }
};

export function createDecalSystem({ scene, maxDecals = 180 }) {
  const decals = [];
  const geometry = new THREE.PlaneGeometry(1, 1);
  let disposed = false;

  function createDecalMaterial(type) {
    const config = DECAL_TYPES[type];
    return new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });
  }

  function addDecal(type, position, normal = new THREE.Vector3(0, 1, 0), scale = 1) {
    if (disposed || !DECAL_TYPES[type]) return null;

    const config = DECAL_TYPES[type];
    const material = createDecalMaterial(type);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);
    mesh.scale.setScalar(config.size * scale);

    const target = position.clone().add(normal);
    mesh.lookAt(target);

    scene.add(mesh);
    decals.push(mesh);

    if (decals.length > maxDecals) {
      const oldest = decals.shift();
      scene.remove(oldest);
      oldest.material.dispose();
    }

    return mesh;
  }

  function clear() {
    decals.forEach((decal) => {
      scene.remove(decal);
      decal.material.dispose();
    });
    decals.length = 0;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    geometry.dispose();
  }

  return {
    addDecal,
    clear,
    dispose,
    count: () => decals.length
  };
}
