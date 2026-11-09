/**
 * Machala Vehicles, NPCs & World Interaction Pass v1
 * Simple vehicle enter, exit and drive model.
 */

import * as THREE from 'three';

export function createVehicleController({ scene, camera, player }) {
  const vehicle = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.9, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x1d2a33, roughness: 0.45, metalness: 0.45 })
  );
  body.position.y = 0.65;
  body.castShadow = true;

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.7, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x0d1218, roughness: 0.25, metalness: 0.1 })
  );
  cabin.position.set(0, 1.35, -0.2);

  vehicle.add(body, cabin);
  vehicle.position.set(6, 0, -8);
  scene.add(vehicle);

  const state = {
    occupied: false,
    speed: 0,
    maxSpeed: 18,
    acceleration: 9,
    brakeForce: 16,
    steering: 0,
    maxSteering: 0.55
  };

  function enter() {
    if (state.occupied) return false;

    state.occupied = true;
    player.object.visible = false;
    return true;
  }

  function exit() {
    if (!state.occupied) return false;

    state.occupied = false;
    state.speed = 0;
    player.object.visible = true;
    player.object.position.copy(vehicle.position).add(new THREE.Vector3(2, 0, 0));
    return true;
  }

  function update(deltaTime, input = {}) {
    if (!state.occupied) return state;

    const throttle = input.throttle || 0;
    const steer = input.steer || 0;

    if (throttle > 0) {
      state.speed += state.acceleration * throttle * deltaTime;
    } else if (throttle < 0) {
      state.speed -= state.brakeForce * deltaTime;
    } else {
      state.speed *= 0.94;
    }

    state.speed = Math.max(-6, Math.min(state.maxSpeed, state.speed));
    state.steering += (steer - state.steering) * Math.min(1, deltaTime * 6);

    const turnRate = state.steering * state.maxSteering * (state.speed / state.maxSpeed);
    vehicle.rotation.y += turnRate * deltaTime;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(vehicle.quaternion);
    vehicle.position.addScaledVector(forward, state.speed * deltaTime);

    camera.position.copy(vehicle.position).add(new THREE.Vector3(0, 2.1, 4.5));
    camera.lookAt(vehicle.position);

    return state;
  }

  function dispose() {
    scene.remove(vehicle);
    vehicle.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  return {
    vehicle,
    state,
    enter,
    exit,
    update,
    dispose
  };
}
