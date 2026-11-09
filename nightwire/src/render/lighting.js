/**
 * Machala Render Foundation v1 — lighting budget.
 * One strong lighting idea per zone; static lighting is preferred on mobile.
 */

import * as THREE from 'three';

export function createLighting({ scene, quality }) {
  const moon = new THREE.DirectionalLight(0x9fb6d8, 1.15);
  moon.position.set(-38, 52, 24);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 180;
  moon.shadow.camera.left = -65;
  moon.shadow.camera.right = 65;
  moon.shadow.camera.top = 65;
  moon.shadow.camera.bottom = -65;
  moon.shadow.bias = -0.0006;

  const ambient = new THREE.HemisphereLight(0x243447, 0x0a0d12, 0.55);

  const neonFill = new THREE.PointLight(0x38d7ff, 18, 42, 2);
  neonFill.position.set(0, 6, -8);

  scene.add(moon, ambient, neonFill);

  const dynamicLights = [neonFill];
  let disposed = false;

  function applyQuality(settings) {
    moon.castShadow = settings.shadowMapSize > 0;

    if (settings.shadowMapSize > 0) {
      moon.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
    }

    const allowed = settings.maxDynamicLights;
    dynamicLights.forEach((light, index) => {
      light.visible = index < allowed;
    });

    scene.fog = new THREE.FogExp2(0x070b12, settings.fogDensity);
  }

  function addNeonLight({ color = 0x38d7ff, intensity = 12, distance = 28, position }) {
    const settings = quality.get();
    if (dynamicLights.length >= settings.maxDynamicLights) return null;

    const light = new THREE.PointLight(color, intensity, distance, 2);
    if (position) light.position.copy(position);

    scene.add(light);
    dynamicLights.push(light);
    return light;
  }

  function update() {
    if (disposed) return;
    neonFill.intensity = 16 + Math.sin(performance.now() * 0.0016) * 2.5;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    scene.remove(moon, ambient, neonFill);
    dynamicLights.forEach((light) => scene.remove(light));
  }

  const unsubscribe = quality.onChange(applyQuality);

  return {
    moon,
    ambient,
    neonFill,
    addNeonLight,
    update,
    dispose: () => {
      unsubscribe();
      dispose();
    }
  };
}
