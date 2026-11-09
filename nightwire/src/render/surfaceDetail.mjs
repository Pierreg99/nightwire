/**
 * NIGHTWIRE v2.0.1 — Surface Detail (.mjs)
 * Procedural texture detail and wetness response for materials.
 */

import * as THREE from 'three';
import { textureLibrary } from './textureLibrary.mjs';

const SURFACE_TYPES = {
  asphaltWet: {
    albedo: 'asphaltAlbedo',
    roughness: 'asphaltRoughness',
    normal: 'asphaltNormal',
    baseRoughness: 0.42,
    wetRoughness: 0.09,
    textureRepeat: 14
  },
  concreteDirty: {
    albedo: 'concreteAlbedo',
    roughness: 'concreteRoughness',
    normal: 'concreteNormal',
    baseRoughness: 0.82,
    wetRoughness: 0.28,
    textureRepeat: 8
  },
  metalRust: {
    albedo: 'metalRustAlbedo',
    roughness: 'metalRustRoughness',
    normal: 'metalRustNormal',
    baseRoughness: 0.68,
    wetRoughness: 0.22,
    textureRepeat: 3
  }
};

export function createSurfaceDetail({ material, surfaceType, options = {} }) {
  const config = SURFACE_TYPES[surfaceType];
  if (!config) throw new Error(`Unknown surface type: ${surfaceType}`);

  const wetness = Math.max(0, Math.min(1, options.wetness ?? 0));
  const grime = Math.max(0, Math.min(1, options.grime ?? 0));
  const wear = Math.max(0, Math.min(1, options.wear ?? 0));

  const albedo = textureLibrary[config.albedo]();
  const roughness = textureLibrary[config.roughness]();
  const normal = textureLibrary[config.normal]();
  const dirt = textureLibrary.dirtMask();
  const wet = textureLibrary.wetMask();

  albedo.repeat.set(config.textureRepeat, config.textureRepeat);
  roughness.repeat.set(config.textureRepeat, config.textureRepeat);
  normal.repeat.set(config.textureRepeat, config.textureRepeat);
  dirt.repeat.set(config.textureRepeat, config.textureRepeat);
  wet.repeat.set(config.textureRepeat, config.textureRepeat);

  material.map = albedo;
  material.roughnessMap = roughness;
  material.normalMap = normal;
  material.roughness = THREE.MathUtils.lerp(
    config.baseRoughness,
    config.wetRoughness,
    wetness
  );

  material.normalScale = new THREE.Vector2(
    0.7 + wear * 0.6,
    0.7 + wear * 0.6
  );

  material.envMapIntensity = 0.55 + wetness * 1.35;
  material.color.multiplyScalar(1 - grime * 0.2);

  return {
    material,
    textures: { albedo, roughness, normal, dirt, wet },
    update(nextWetness) {
      const value = Math.max(0, Math.min(1, nextWetness));
      material.roughness = THREE.MathUtils.lerp(
        config.baseRoughness,
        config.wetRoughness,
        value
      );
      material.envMapIntensity = 0.55 + value * 1.35;
    }
  };
}

export const surfaceDetailTypes = Object.keys(SURFACE_TYPES);
