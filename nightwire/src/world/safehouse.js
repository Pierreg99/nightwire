/**
 * Machala Vehicles, NPCs & World Interaction Pass v1
 * Apartment 4B safehouse-lite.
 */

import * as THREE from 'three';

export function createSafehouse({ scene, interaction }) {
  const group = new THREE.Group();

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.85 })
  );
  floor.position.y = -0.1;

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(8, 3, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x24282e, roughness: 0.9 })
  );
  backWall.position.set(0, 1.5, -4);

  const window = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.4),
    new THREE.MeshStandardMaterial({
      color: 0x0b1014,
      roughness: 0.08,
      metalness: 0.1,
      emissive: new THREE.Color(0x1d4a63),
      emissiveIntensity: 0.8
    })
  );
  window.position.set(0, 1.7, -3.88);

  group.add(floor, backWall, window);
  group.position.set(0, 0, 22);
  scene.add(group);

  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 2),
    new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.12, metalness: 0.6 })
  );
  mirror.position.set(-3, 1.5, -3.8);
  scene.add(mirror);

  interaction.addInteractable({
    position: new THREE.Vector3(-3, 1.5, 18.2),
    label: 'Open Wardrobe',
    action: () => {
      // Wardrobe UI can be connected here.
    }
  });

  function dispose() {
    scene.remove(group);
    scene.remove(mirror);

    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });

    mirror.geometry.dispose();
    mirror.material.dispose();
  }

  return {
    group,
    mirror,
    dispose
  };
}
