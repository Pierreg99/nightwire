/**
 * NIGHTWIRE v2.0.1 — Procedural Texture Library (.mjs)
 * PBR texture generation for NIGHTWIRE night-city surfaces.
 */

import * as THREE from 'three';

function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function noiseTexture({ size = 256, base = 18, variation = 34, contrast = 1 }) {
  const canvas = createCanvas(size);
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);

  for (let i = 0; i < image.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * variation;
    const value = Math.max(0, Math.min(255, base + noise * contrast));

    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }

  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function roughnessTexture({ size = 256, base = 140, variation = 55 }) {
  return noiseTexture({ size, base, variation });
}

function normalTexture({ size = 256, strength = 0.55 }) {
  const canvas = createCanvas(size);
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const nx = (Math.random() - 0.5) * strength;
      const ny = (Math.random() - 0.5) * strength;

      image.data[index] = 128 + nx * 127;
      image.data[index + 1] = 128 + ny * 127;
      image.data[index + 2] = 255;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function emissiveTexture({ size = 256, color = '#38d7ff', intensity = 0.85 }) {
  const canvas = createCanvas(size);
  const context = canvas.getContext('2d');

  context.fillStyle = '#000000';
  context.fillRect(0, 0, size, size);

  context.strokeStyle = color;
  context.lineWidth = 10;
  context.globalAlpha = intensity;

  for (let i = 0; i < 5; i += 1) {
    context.beginPath();
    context.moveTo(0, 30 + i * 45);
    context.lineTo(size, 30 + i * 45);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const TEXTURE_CACHE = new Map();

function cached(key, factory) {
  if (!TEXTURE_CACHE.has(key)) {
    TEXTURE_CACHE.set(key, factory());
  }
  return TEXTURE_CACHE.get(key);
}

export const textureLibrary = {
  asphaltAlbedo: () => cached('asphalt-albedo', () => noiseTexture({ base: 20, variation: 30 })),
  asphaltRoughness: () => cached('asphalt-roughness', () => roughnessTexture({ base: 120, variation: 65 })),
  asphaltNormal: () => cached('asphalt-normal', () => normalTexture({ strength: 0.7 })),

  concreteAlbedo: () => cached('concrete-albedo', () => noiseTexture({ base: 42, variation: 22 })),
  concreteRoughness: () => cached('concrete-roughness', () => roughnessTexture({ base: 190, variation: 35 })),
  concreteNormal: () => cached('concrete-normal', () => normalTexture({ strength: 0.42 })),

  metalRustAlbedo: () => cached('metal-rust-albedo', () => noiseTexture({ base: 70, variation: 65 })),
  metalRustRoughness: () => cached('metal-rust-roughness', () => roughnessTexture({ base: 165, variation: 70 })),
  metalRustNormal: () => cached('metal-rust-normal', () => normalTexture({ strength: 0.85 })),

  dirtMask: () => cached('dirt-mask', () => noiseTexture({ base: 90, variation: 90 })),
  wetMask: () => cached('wet-mask', () => noiseTexture({ base: 60, variation: 80 })),
  neonEmissive: () => cached('neon-emissive', () => emissiveTexture())
};

export function disposeTextureLibrary() {
  TEXTURE_CACHE.forEach((texture) => texture.dispose());
  TEXTURE_CACHE.clear();
}
