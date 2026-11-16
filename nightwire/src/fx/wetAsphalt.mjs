/**
 * NIGHTWIRE — Wet Asphalt (Ultra Spectrum slice)
 * Stronger clearcoat + envMapIntensity response on wet patches.
 * MOBILE/reducedFx: lower normalScale and clearcoat.
 */
import * as THREE from 'three';
import { WET, addRainRipples } from './atmosphere.mjs';
import { textureLibrary } from '../render/textureLibrary.mjs';

const wetMaterials = new Set();

export function wetAsphaltMaterial(map) {
  const normalMap = textureLibrary.asphaltNormal();
  normalMap.repeat.set(36, 36);
  const roughnessMap = textureLibrary.asphaltRoughness();
  roughnessMap.repeat.set(18, 18);

  const material = new THREE.MeshPhysicalMaterial({
    map: map || null,
    color: 0x9aa8b4,
    roughness: 0.18,
    metalness: 0.48,
    envMapIntensity: 1.65,
    clearcoat: 0.78,
    clearcoatRoughness: 0.16,
    normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWetTime = WET.uWetTime;
    shader.uniforms.uRainAmount = WET.uRainAmount;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWetWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWetWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWetWorld;
float nwVal(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float nwWetPatch(vec2 xz) { return smoothstep(0.38, 0.82, nwVal(xz * 0.11) * 0.65 + nwVal(xz * 0.37) * 0.35); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float wetLane = 1.0 - smoothstep(4.5, 13.5, abs(vWetWorld.x));
        float wetPatch = nwWetPatch(vWetWorld.xz);
        float wet = max(wetLane, wetPatch * 0.9);
        diffuseColor.rgb *= mix(1.0, 0.62, wet * uRainAmount);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float wetLaneR = 1.0 - smoothstep(5.5, 13.0, abs(vWetWorld.x));
        float wetAll = max(wetLaneR * 0.8, nwWetPatch(vWetWorld.xz) * 0.92) * uRainAmount;
        roughnessFactor = mix(roughnessFactor, 0.045, wetAll);
        float rip = sin(vWetWorld.x * 2.7 + uWetTime * 0.55) * sin(vWetWorld.z * 1.9 - uWetTime * 0.4);
        roughnessFactor = clamp(roughnessFactor + rip * 0.028, 0.032, 1.0);`);
  };

  addRainRipples(material, 0.42);
  wetMaterials.add(material);
  return material;
}

export function applyWetProfile(profile, reducedFx) {
  const s = reducedFx ? 0.05 : (profile?.wetNormals ?? 0.35);
  const coat = reducedFx ? 0.25 : 0.78;
  const env = reducedFx ? 0.85 : 1.65;
  wetMaterials.forEach((m) => {
    m.normalScale.set(s, s);
    m.clearcoat = coat;
    m.envMapIntensity = env;
  });
}
