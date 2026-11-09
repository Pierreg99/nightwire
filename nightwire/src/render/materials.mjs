/**
 * NIGHTWIRE v2.0.1 — PBR Material Presets (.mjs)
 * Wet, dirty, neon-responsive night-city surfaces.
 */

import * as THREE from 'three';

const PRESETS = {
  asphaltWet: {
    color: 0x14161a,
    roughness: 0.38,
    metalness: 0.02,
    envMapIntensity: 1.35
  },
  concreteDirty: {
    color: 0x2a2c30,
    roughness: 0.82,
    metalness: 0.0,
    envMapIntensity: 0.45
  },
  metalRust: {
    color: 0x4b3a2c,
    roughness: 0.68,
    metalness: 0.72,
    envMapIntensity: 0.8
  },
  containerPainted: {
    color: 0x1d3b4a,
    roughness: 0.52,
    metalness: 0.35,
    envMapIntensity: 0.9
  },
  glassNeon: {
    color: 0x0b1014,
    roughness: 0.08,
    metalness: 0.1,
    envMapIntensity: 1.8
  },
  neonSign: {
    color: 0x05070a,
    roughness: 0.35,
    metalness: 0.0,
    emissive: 0x38d7ff,
    emissiveIntensity: 2.4
  },
  rubberTire: {
    color: 0x0b0b0c,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.18
  },
  waterPuddle: {
    color: 0x060a10,
    roughness: 0.04,
    metalness: 0.0,
    envMapIntensity: 2.2
  }
};

export function createMaterial(presetName, overrides = {}) {
  const preset = PRESETS[presetName];
  if (!preset) throw new Error(`Unknown material preset: ${presetName}`);

  const material = new THREE.MeshStandardMaterial({
    color: preset.color,
    roughness: preset.roughness,
    metalness: preset.metalness,
    envMapIntensity: preset.envMapIntensity
  });

  if (preset.emissive !== undefined) {
    material.emissive = new THREE.Color(preset.emissive);
    material.emissiveIntensity = preset.emissiveIntensity;
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (key === 'color' || key === 'emissive') {
      material[key] = new THREE.Color(value);
    } else {
      material[key] = value;
    }
  });

  return material;
}

export const materialPresets = Object.keys(PRESETS);
