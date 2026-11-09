/**
 * Machala Night-City Material & Weather Pass v1
 * Rain, puddles, industrial fog and neon atmosphere.
 */

import * as THREE from 'three';

export function createWeatherSystem({ scene, quality, bounds = { width: 90, height: 28, depth: 90 } }) {
  const settings = quality.get();

  const rainCount = settings.id === 'low' ? 900 : settings.id === 'medium' ? 1800 : 3200;
  const positions = new Float32Array(rainCount * 3);
  const velocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * bounds.width;
    positions[i * 3 + 1] = Math.random() * bounds.height;
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.depth;
    velocities[i] = 18 + Math.random() * 14;
  }

  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaac4dd,
    size: 0.055,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });

  const rain = new THREE.Points(rainGeometry, rainMaterial);
  scene.add(rain);

  const fog = new THREE.FogExp2(0x070b12, settings.fogDensity);
  scene.fog = fog;

  const puddles = [];
  let windStrength = 1;
  let disposed = false;

  function addPuddle(position, scale = 1) {
    if (disposed) return null;

    const geometry = new THREE.CircleGeometry(1, 24);
    const material = new THREE.MeshStandardMaterial({
      color: 0x060a10,
      roughness: 0.04,
      metalness: 0.0,
      envMapIntensity: 2.2,
      transparent: true,
      opacity: 0.82
    });

    const puddle = new THREE.Mesh(geometry, material);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.copy(position);
    puddle.position.y += 0.012;
    puddle.scale.setScalar(scale);

    scene.add(puddle);
    puddles.push(puddle);
    return puddle;
  }

  function update(deltaTime) {
    if (disposed) return;

    const positions = rainGeometry.attributes.position.array;

    for (let i = 0; i < rainCount; i += 1) {
      const index = i * 3;
      positions[index + 1] -= velocities[i] * deltaTime;
      positions[index] += windStrength * deltaTime * 0.7;

      if (positions[index + 1] < 0) {
        positions[index] = (Math.random() - 0.5) * bounds.width;
        positions[index + 1] = bounds.height;
        positions[index + 2] = (Math.random() - 0.5) * bounds.depth;
      }

      if (positions[index] > bounds.width / 2) {
        positions[index] = -bounds.width / 2;
      }
    }

    rainGeometry.attributes.position.needsUpdate = true;
  }

  function setIntensity(level) {
    const intensity = Math.max(0, Math.min(1, level));
    rainMaterial.opacity = 0.2 + intensity * 0.45;
    fog.density = settings.fogDensity * (0.55 + intensity * 0.75);
    windStrength = 0.4 + intensity * 1.6;
  }

  function applyQuality(nextSettings) {
    rainMaterial.opacity = nextSettings.id === 'low' ? 0.28 : 0.55;
    fog.density = nextSettings.fogDensity;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    scene.remove(rain);
    rainGeometry.dispose();
    rainMaterial.dispose();

    puddles.forEach((puddle) => {
      scene.remove(puddle);
      puddle.geometry.dispose();
      puddle.material.dispose();
    });
    puddles.length = 0;
  }

  const unsubscribe = quality.onChange(applyQuality);

  return {
    rain,
    fog,
    addPuddle,
    setIntensity,
    update,
    dispose: () => {
      unsubscribe();
      dispose();
    }
  };
}
