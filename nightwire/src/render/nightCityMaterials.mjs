/**
 * NIGHTWIRE v2.0.1 — Night-City Materials (.mjs)
 * Wet, dirty, neon-responsive material factory.
 */

import * as THREE from 'three';

const BASE_PRESETS = {
  asphaltWet: { color: 0x121519, roughness: 0.42, metalness: 0.02, envMapIntensity: 1.25 },
  asphaltDry: { color: 0x1a1d21, roughness: 0.88, metalness: 0.0, envMapIntensity: 0.35 },
  concreteWet: { color: 0x23272c, roughness: 0.55, metalness: 0.0, envMapIntensity: 0.85 },
  concreteDirty: { color: 0x2a2c30, roughness: 0.82, metalness: 0.0, envMapIntensity: 0.45 },
  metalRust: { color: 0x4b3a2c, roughness: 0.68, metalness: 0.72, envMapIntensity: 0.8 },
  containerPainted: { color: 0x1d3b4a, roughness: 0.52, metalness: 0.35, envMapIntensity: 0.9 },
  glassNeon: { color: 0x0b1014, roughness: 0.08, metalness: 0.1, envMapIntensity: 1.8 },
  neonSign: { color: 0x05070a, roughness: 0.35, metalness: 0.0, emissiveIntensity: 2.4 },
  rubberTire: { color: 0x0b0b0c, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.18 },
  waterPuddle: { color: 0x060a10, roughness: 0.04, metalness: 0.0, envMapIntensity: 2.2 }
};

function applyWetness(material, wetness) {
  const w = Math.max(0, Math.min(1, wetness));
  material.roughness = THREE.MathUtils.lerp(material.roughness, 0.08, w * 0.75);
  material.envMapIntensity = material.envMapIntensity * (1 + w * 0.8);
}

function applyDirt(material, dirt) {
  const d = Math.max(0, Math.min(1, dirt));
  material.roughness = Math.min(1, material.roughness + d * 0.18);
  material.color.multiplyScalar(1 - d * 0.22);
}

export function createNightCityMaterial(presetName, options = {}) {
  const preset = BASE_PRESETS[presetName];
  if (!preset) throw new Error(`Unknown night-city material preset: ${presetName}`);

  const material = new THREE.MeshStandardMaterial({
    color: preset.color,
    roughness: preset.roughness,
    metalness: preset.metalness,
    envMapIntensity: preset.envMapIntensity
  });

  if (preset.emissiveIntensity !== undefined) {
    material.emissive = new THREE.Color(options.emissiveColor ?? 0x38d7ff);
    material.emissiveIntensity = preset.emissiveIntensity;
  }

  applyWetness(material, options.wetness ?? 0);
  applyDirt(material, options.dirt ?? 0);

  if (options.normalScale !== undefined) {
    material.normalScale = new THREE.Vector2(options.normalScale, options.normalScale);
  }

  return material;
}

export function createPuddleMaterial() {
  return createNightCityMaterial('waterPuddle', {
    wetness: 1,
    dirt: 0.15
  });
}

export function createNeonSignMaterial(color = 0x38d7ff, intensity = 2.4) {
  const material = createNightCityMaterial('neonSign', {
    emissiveColor: color
  });
  material.emissiveIntensity = intensity;
  return material;
}

export const nightCityMaterialPresets = Object.keys(BASE_PRESETS);
