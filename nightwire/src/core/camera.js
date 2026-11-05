import * as THREE from 'three';

export function createCamera(fov) {
  const cam = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.05, 420);
  cam.rotation.order = 'YXZ';
  return cam;
}
