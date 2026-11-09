/**
 * Machala Vehicles, NPCs & World Interaction Pass v1
 * Lightweight NPC pedestrians with idle, walk and avoidance.
 */

import * as THREE from 'three';

export function createNPCSystem({ scene, quality, maxNPCs = 18 }) {
  const npcs = [];
  let disposed = false;

  const settings = quality.get();
  const count = Math.min(maxNPCs, settings.id === 'low' ? 6 : settings.id === 'medium' ? 12 : 18);

  const bodyGeometry = new THREE.CapsuleGeometry(0.28, 0.9, 4, 8);
  const headGeometry = new THREE.SphereGeometry(0.18, 10, 10);

  const bodyMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x2b3a48, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x3a2f2a, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x24303a, roughness: 0.85 })
  ];

  function createNPC(position) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      bodyGeometry,
      bodyMaterials[Math.floor(Math.random() * bodyMaterials.length)]
    );
    body.position.y = 0.85;
    body.castShadow = true;

    const head = new THREE.Mesh(
      headGeometry,
      new THREE.MeshStandardMaterial({ color: 0x8a6a52, roughness: 0.7 })
    );
    head.position.y = 1.55;

    group.add(body, head);
    group.position.copy(position);
    scene.add(group);

    const npc = {
      object: group,
      state: 'idle',
      direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
      speed: 0.8 + Math.random() * 0.7,
      idleTimer: 1 + Math.random() * 4
    };

    npcs.push(npc);
    return npc;
  }

  for (let i = 0; i < count; i += 1) {
    createNPC(new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      0,
      (Math.random() - 0.5) * 50
    ));
  }

  function update(deltaTime, playerPosition) {
    if (disposed) return;

    npcs.forEach((npc) => {
      const distanceToPlayer = npc.object.position.distanceTo(playerPosition);

      if (distanceToPlayer < 3.5) {
        const away = npc.object.position.clone().sub(playerPosition).normalize();
        npc.direction.lerp(away, 0.25).normalize();
        npc.state = 'walk';
      } else if (npc.state === 'idle') {
        npc.idleTimer -= deltaTime;

        if (npc.idleTimer <= 0) {
          npc.state = 'walk';
          npc.idleTimer = 3 + Math.random() * 5;
        }
      } else if (npc.state === 'walk') {
        npc.object.position.addScaledVector(npc.direction, npc.speed * deltaTime);

        if (Math.random() < deltaTime * 0.25) {
          npc.state = 'idle';
        }
      }

      if (npc.state === 'walk') {
        const target = npc.object.position.clone().add(npc.direction);
        npc.object.lookAt(target);
      }
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    npcs.forEach((npc) => scene.remove(npc.object));
    npcs.length = 0;

    bodyGeometry.dispose();
    headGeometry.dispose();
    bodyMaterials.forEach((material) => material.dispose());
  }

  return {
    npcs,
    createNPC,
    update,
    dispose
  };
}
