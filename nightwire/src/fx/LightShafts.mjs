/**
 * NIGHTWIRE — Light shafts (.mjs)
 * Fake volumetric cones under street lamps, awnings and the crane key: an open cone with an
 * additive shader that is bright along the axis, soft at the silhouette, fades with height,
 * distance and when the camera stands inside it. One draw call per shaft, no extra render pass.
 * Off on MOBILE / APK (profile.shafts) and with Reduced FX.
 */

import * as THREE from 'three';

const shared = {
  uShaftGain: { value: 1 },
};

const VERT = /* glsl */`
varying vec3 vNormalV;
varying vec3 vViewPos;
varying float vAlong;
varying vec3 vWorld;
void main() {
  vAlong = uv.y;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 mv = viewMatrix * world;
  vViewPos = mv.xyz;
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uIntensity;
uniform float uShaftGain;
varying vec3 vNormalV;
varying vec3 vViewPos;
varying float vAlong;
varying vec3 vWorld;
void main() {
  vec3 v = normalize(-vViewPos);
  float facing = abs(dot(normalize(vNormalV), v));
  float core = pow(facing, 3.0);                    // thick in the middle, thin at the silhouette
  float along = smoothstep(0.0, 0.85, vAlong);      // uv.y = 1 at the lamp, 0 at the ground
  float dist = length(vViewPos);
  float far = 1.0 - smoothstep(38.0, 70.0, dist);
  float near = smoothstep(0.6, 3.2, dist);          // no full-screen wash when standing inside
  float a = uIntensity * uShaftGain * core * along * far * near * 0.15;
  gl_FragColor = vec4(uColor, a); // additive: src * srcAlpha + dst
}`;

export function addLightShaft(world, x, y, z, color, length, radius, zone, target = null, intensity = 1) {
  const geo = new THREE.CylinderGeometry(radius * 0.08, radius, length, 24, 1, true);
  geo.translate(0, -length / 2, 0); // apex at the origin, cone hangs down
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uShaftGain: shared.uShaftGain,
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  if (target) {
    const dir = new THREE.Vector3(target.x - x, target.y - y, target.z - z).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  }
  mesh.renderOrder = 3;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.shaft = true;
  world.add(mesh, zone);
  const game = world.game;
  game.shafts = game.shafts || [];
  game.shafts.push(mesh);
  return mesh;
}

export function applyShaftProfile(game, profile, reducedFx) {
  const on = !!profile?.shafts && !reducedFx;
  (game.shafts || []).forEach((m) => { m.visible = on; });
}

/** Lightning / muzzle / neon events can pump the haze for a frame. */
export function setShaftGain(v) {
  shared.uShaftGain.value = v;
}
