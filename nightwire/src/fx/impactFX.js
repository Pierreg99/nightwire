/**
 * Machala Combat Feel & Weapon Feedback Pass v1
 * Material-aware impact feedback and hitmarkers.
 */

import * as THREE from 'three';

const IMPACT_MATERIALS = {
  concrete: { color: 0xb8b8b8, particles: 8, sound: 'concrete' },
  metal: { color: 0xffc861, particles: 10, sound: 'metal' },
  flesh: { color: 0x8c1d20, particles: 6, sound: 'flesh' },
  wood: { color: 0x8a5a2b, particles: 7, sound: 'wood' }
};

export function createImpactFX({ scene, quality }) {
  const settings = quality.get();
  const maxParticles = settings.id === 'low' ? 80 : settings.id === 'medium' ? 160 : 320;

  const particles = [];
  const geometry = new THREE.SphereGeometry(0.025, 4, 4);
  let disposed = false;

  function spawnImpact({ position, normal = new THREE.Vector3(0, 1, 0), material = 'concrete' }) {
    if (disposed) return null;

    const config = IMPACT_MATERIALS[material] || IMPACT_MATERIALS.concrete;
    const count = Math.min(config.particles, maxParticles - particles.length);

    for (let i = 0; i < count; i += 1) {
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      });

      const particle = new THREE.Mesh(geometry, particleMaterial);
      particle.position.copy(position);

      const velocity = normal.clone()
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          Math.random() * 0.7,
          (Math.random() - 0.5) * 0.8
        ))
        .normalize()
        .multiplyScalar(2.5 + Math.random() * 3.5);

      scene.add(particle);
      particles.push({ mesh: particle, velocity, life: 0.35 + Math.random() * 0.25 });
    }

    return config;
  }

  function update(deltaTime) {
    if (disposed) return;

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= deltaTime;

      particle.velocity.y -= 9.8 * deltaTime;
      particle.mesh.position.addScaledVector(particle.velocity, deltaTime);
      particle.mesh.material.opacity = Math.max(0, particle.life * 2.2);

      if (particle.life <= 0) {
        scene.remove(particle.mesh);
        particle.mesh.material.dispose();
        particles.splice(i, 1);
      }
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    particles.forEach((particle) => {
      scene.remove(particle.mesh);
      particle.mesh.material.dispose();
    });
    particles.length = 0;

    geometry.dispose();
  }

  return {
    spawnImpact,
    update,
    dispose
  };
}

export const impactMaterialIds = Object.keys(IMPACT_MATERIALS);
