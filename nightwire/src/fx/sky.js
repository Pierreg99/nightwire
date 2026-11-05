import * as THREE from 'three';
import { LOOK } from './look.js';

/** Inside the camera far plane (420). Follows the camera so the horizon stays centered. */
const DOME_RADIUS = 340;

export function addSkyDome(scene) {
  const geo = new THREE.SphereGeometry(DOME_RADIUS, 28, 18);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: new THREE.Color(LOOK.skyZenith) },
      horizon: { value: new THREE.Color(LOOK.skyHorizon) },
      glow: { value: new THREE.Color(LOOK.skyGlow) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vDir = position;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 zenith;
      uniform vec3 horizon;
      uniform vec3 glow;
      void main() {
        float h = normalize(vDir).y;
        float t = smoothstep(-0.08, 0.62, h);
        vec3 c = mix(horizon, zenith, t);
        float band = exp(-pow((h - 0.04) * 9.0, 2.0));
        c += glow * band * 0.45;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    mesh.position.copy(camera.position);
    mesh.updateMatrixWorld();
  };
  scene.add(mesh);
  return mesh;
}
