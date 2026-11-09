/**
 * NIGHTWIRE v2.0.1 — Zone Polish (.mjs)
 * Dock-street zone polish helper.
 */

import * as THREE from 'three';
import { createNightCityMaterial, createNeonSignMaterial } from '../render/nightCityMaterials.mjs';

export function polishDockStreet({ scene, weather, quality }) {
  const settings = quality.get();
  const added = [];

  function addMesh(mesh) {
    scene.add(mesh);
    added.push(mesh);
    return mesh;
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    createNightCityMaterial('asphaltWet', {
      wetness: 0.72,
      dirt: 0.35
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  addMesh(ground);

  const containerMaterial = createNightCityMaterial('containerPainted', {
    wetness: 0.45,
    dirt: 0.55
  });

  for (let index = 0; index < 6; index += 1) {
    const container = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.6, 6),
      containerMaterial
    );
    container.position.set(-14 + (index % 3) * 5.5, 1.3, -18 + Math.floor(index / 3) * 8);
    container.castShadow = true;
    container.receiveShadow = true;
    addMesh(container);
  }

  const neonSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.4),
    createNeonSignMaterial(0x38d7ff, settings.id === 'low' ? 1.4 : 2.4)
  );
  neonSign.position.set(0, 6.2, -24);
  addMesh(neonSign);

  const puddlePositions = [
    [-4, 0.01, -6],
    [3.5, 0.01, -11],
    [-8, 0.01, -16],
    [6, 0.01, -20]
  ];

  puddlePositions.forEach(([x, y, z]) => {
    weather.addPuddle(new THREE.Vector3(x, y, z), 1.4 + Math.random() * 1.1);
  });

  weather.setIntensity(0.72);

  function dispose() {
    added.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    added.length = 0;
  }

  return {
    ground,
    neonSign,
    dispose
  };
}
