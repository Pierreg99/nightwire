/**
 * NIGHTWIRE v2.0.1 — World Interactions (.mjs)
 * Interactive world props and proximity prompts.
 */

import * as THREE from 'three';

export function createWorldInteractions({ scene, interaction }) {
  const interactables = [];
  let disposed = false;

  function addInteractable({ position, label, key = 'F', action, radius = 2.4 }) {
    if (disposed) return null;

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x38d7ff, transparent: true, opacity: 0.65 })
    );

    marker.position.copy(position);
    scene.add(marker);

    const interactable = {
      position: position.clone(),
      label,
      key,
      action,
      radius,
      marker
    };

    interactables.push(interactable);
    return interactable;
  }

  function update(playerPosition) {
    if (disposed) return;

    let closest = null;
    let closestDistance = Infinity;

    interactables.forEach((interactable) => {
      const distance = interactable.position.distanceTo(playerPosition);

      if (distance <= interactable.radius && distance < closestDistance) {
        closest = interactable;
        closestDistance = distance;
      }
    });

    if (closest) {
      interaction.show({
        key: closest.key,
        label: closest.label,
        action: closest.action
      });
    } else {
      interaction.hide();
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    interactables.forEach((interactable) => {
      scene.remove(interactable.marker);
      interactable.marker.geometry.dispose();
      interactable.marker.material.dispose();
    });

    interactables.length = 0;
  }

  return {
    interactables,
    addInteractable,
    update,
    dispose
  };
}
