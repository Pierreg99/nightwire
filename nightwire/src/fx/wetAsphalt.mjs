/**
 * NIGHTWIRE v2.0.1 — Wet Asphalt (.mjs)
 * Wet lane overlay for MeshPhysicalMaterial with animated roughness.
 * Immersive pass: large-scale wetness patches, micro normal/roughness variation from the
 * procedural texture library and rain ripples. The lane look (darker, glossier centre) is unchanged.
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
    roughness: 0.22,
    metalness: 0.42,
    envMapIntensity: 1.35,
    clearcoat: 0.62,
    clearcoatRoughness: 0.22,
    normalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughnessMap
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWetTime = WET.uWetTime;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWetWorld;'
      )
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvWetWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vWetWorld;
float nwVal(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float nwWetPatch(vec2 xz) { return smoothstep(0.42, 0.78, nwVal(xz * 0.11) * 0.65 + nwVal(xz * 0.37) * 0.35); }`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float wetLane = 1.0 - smoothstep(5.0, 14.0, abs(vWetWorld.x));
        float wetPatch = nwWetPatch(vWetWorld.xz);
        diffuseColor.rgb *= mix(1.0, 0.68, max(wetLane, wetPatch * 0.8));`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float wetLaneR = 1.0 - smoothstep(6.0, 14.0, abs(vWetWorld.x));
        float wetAll = max(wetLaneR * 0.75, nwWetPatch(vWetWorld.xz) * 0.85);
        roughnessFactor = mix(roughnessFactor, 0.07, wetAll);
        float rip = sin(vWetWorld.x * 2.7 + uWetTime * 0.55) * sin(vWetWorld.z * 1.9 - uWetTime * 0.4);
        roughnessFactor = clamp(roughnessFactor + rip * 0.035, 0.045, 1.0);`
      );
  };

  addRainRipples(material, 0.35);
  wetMaterials.add(material);
  return material;
}

/** Preset hook: micro normals off on MOBILE / APK (normalScale 0 keeps the program, drops the look). */
export function applyWetProfile(profile, reducedFx) {
  const s = reducedFx ? 0 : (profile?.wetNormals ?? 0.3);
  wetMaterials.forEach((m) => m.normalScale.set(s, s));
}
