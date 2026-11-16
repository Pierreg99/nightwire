/**
 * NIGHTWIRE — Atmosphere layer (.mjs)
 * Height fog for every built-in material, shared wet-world uniforms and the rain-ripple
 * shader patch used by puddles and wet asphalt. Import before the first material compiles.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------
// Height fog: FogExp2 stays the distance term (preset-controlled density); a world-height weight
// thickens it at street level and thins it over rooftops, so the ground sits in mist and the
// skyline keeps its silhouette. No uniforms needed, so every material picks it up for free.
// ---------------------------------------------------------------------------------------------
let fogInstalled = false;
export function installHeightFog() {
  if (fogInstalled) return;
  fogInstalled = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = C.fog_pars_vertex.replace('varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vFogWorldY;');
  C.fog_vertex = C.fog_vertex.replace(
    'vFogDepth = - mvPosition.z;',
    // world = R^T * view + cameraPosition (view matrix is a rigid transform)
    'vFogDepth = - mvPosition.z;\n\tvFogWorldY = cameraPosition.y + ( transpose( mat3( viewMatrix ) ) * mvPosition.xyz ).y;',
  );
  C.fog_pars_fragment = C.fog_pars_fragment.replace('varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vFogWorldY;');
  C.fog_fragment = C.fog_fragment.replace(
    'float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );',
    `float fogHeight = 0.5 + 0.82 * exp( - max( vFogWorldY, 0.0 ) * 0.34 );
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth * fogHeight );`,
  );
}
installHeightFog();

/** CPU mirror of the shader weight (used by tests and by the light-shaft fade). */
export function heightFogWeight(y) {
  return 0.5 + 0.82 * Math.exp(-Math.max(y, 0) * 0.34);
}

// ---------------------------------------------------------------------------------------------
// Shared wet-world uniforms. One object, referenced by every patched material, updated once a frame.
// ---------------------------------------------------------------------------------------------
export const WET = {
  uWetTime: { value: 0 },
  uRipple: { value: 1 },
  uRainAmount: { value: 1 },
};

export function updateWet(dt, profile, reducedFx) {
  WET.uWetTime.value += dt;
  WET.uRipple.value = reducedFx ? 0 : (profile?.ripples ?? 1);
}

/** GLSL: expanding rain rings on a world-space grid. Returns a tangent-space slope (x, z). */
export const RIPPLE_GLSL = /* glsl */`
uniform float uWetTime;
uniform float uRipple;
varying vec3 vRippleWorld;
float nwHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 nwRippleLayer(vec2 p, float t, float speed) {
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  float n = nwHash(id);
  vec2 c = vec2(nwHash(id + 3.17), nwHash(id + 7.71)) - 0.5;
  float life = fract(t * speed + n);
  vec2 d = f - c * 0.6;
  float r = length(d);
  float radius = life * 0.45;
  float ring = sin((r - radius) * 46.0) * smoothstep(0.07, 0.0, abs(r - radius));
  float fade = (1.0 - life) * (1.0 - life);
  return (r > 0.0001 ? d / r : vec2(0.0)) * ring * fade;
}
vec2 nwRipple(vec2 xz, float t) {
  return nwRippleLayer(xz * 1.7, t, 0.9) + 0.6 * nwRippleLayer(xz * 2.6 + 11.3, t, 1.25);
}
`;

/**
 * Adds rain ripples (normal perturbation) to a MeshStandard/Physical material.
 * strength: how strongly this surface reacts (puddles 1, wet asphalt ~0.35).
 */
export function addRainRipples(material, strength = 1) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uWetTime = WET.uWetTime;
    shader.uniforms.uRipple = WET.uRipple;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRippleWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRippleWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${RIPPLE_GLSL}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (uRipple > 0.0) {
          vec2 rip = nwRipple(vRippleWorld.xz, uWetTime) * uRipple * ${strength.toFixed(3)};
          vec3 worldBend = vec3(rip.x, 0.0, rip.y) * 0.55;
          normal = normalize(normal + (viewMatrix * vec4(worldBend, 0.0)).xyz);
        }`);
  };
  const key = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `${key ? key() : ''}|ripple${strength.toFixed(3)}`;
  return material;
}
