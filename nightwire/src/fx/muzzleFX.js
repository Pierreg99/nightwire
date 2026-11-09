/**
 * Machala Combat Feel & Weapon Feedback Pass v1
 * Muzzle flash, tracer and shot feedback.
 */

import * as THREE from 'three';

export function createMuzzleFX({ scene, quality }) {
  const settings = quality.get();
  const maxTracers = settings.id === 'low' ? 12 : settings.id === 'medium' ? 24 : 48;

  const flashGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd27a,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });

  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  scene.add(flash);

  const tracerGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1, 5, 1, true);
  tracerGeometry.translate(0, 0.5, 0);
  tracerGeometry.rotateX(Math.PI / 2);

  const tracerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd98a,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });

  const tracers = [];
  let disposed = false;

  function spawnFlash(position) {
    if (disposed) return;

    flash.position.copy(position);
    flashMaterial.opacity = 0.9;
  }

  function spawnTracer(start, end) {
    if (disposed || tracers.length >= maxTracers) return;

    const tracer = new THREE.Mesh(tracerGeometry, tracerMaterial.clone());
    const distance = start.distanceTo(end);

    tracer.position.copy(start);
    tracer.lookAt(end);
    tracer.scale.z = distance;

    scene.add(tracer);
    tracers.push({ mesh: tracer, life: 0.055 });
  }

  function update(deltaTime) {
    if (disposed) return;

    flashMaterial.opacity = Math.max(0, flashMaterial.opacity - deltaTime * 14);

    for (let i = tracers.length - 1; i >= 0; i -= 1) {
      const tracer = tracers[i];
      tracer.life -= deltaTime;
      tracer.mesh.material.opacity = Math.max(0, tracer.life / 0.055) * 0.85;

      if (tracer.life <= 0) {
        scene.remove(tracer.mesh);
        tracer.mesh.material.dispose();
        tracers.splice(i, 1);
      }
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    scene.remove(flash);
    flashGeometry.dispose();
    flashMaterial.dispose();

    tracers.forEach((tracer) => {
      scene.remove(tracer.mesh);
      tracer.mesh.material.dispose();
    });
    tracers.length = 0;

    tracerGeometry.dispose();
  }

  return {
    spawnFlash,
    spawnTracer,
    update,
    dispose
  };
}
