/**
 * NIGHTWIRE — photo mode (.mjs)
 * Close-up cameras for screenshots and devtools: window.__nightwire.photo('face' | 'body' | 'hands' | 'off').
 * Adds a soft portrait key + rim light on the subject (like a photo-mode lamp); the world keeps animating.
 */

import * as THREE from 'three';

export function photo(game, kind = 'face', type = null) {
  const g = game;
  if (kind === 'off') {
    g.photoMode = null;
    if (g._photoLights) g._photoLights.forEach((l) => { l.intensity = 0; });
    document.getElementById('hud')?.classList.remove('hidden');
    document.getElementById('cine')?.classList.remove('hidden');
    const nt = document.getElementById('notify'); if (nt) nt.style.visibility = '';
    if (g.weapons?.vm) g.weapons.vm.visible = true;
    g.scene.traverse((m) => { if (m.userData.photoHidden) { m.visible = true; m.userData.photoHidden = false; } });
    return 'off';
  }
  if (!g._photoLights) {
    const key = new THREE.PointLight(0xffe2c8, 0, 3.5, 2);
    const rim = new THREE.PointLight(0x7fd8ff, 0, 3.5, 2);
    g.scene.add(key, rim);
    g._photoLights = [key, rim];
  }
  const [key, rim] = g._photoLights;
  if (key.parent !== g.scene) g.scene.add(key, rim);
  document.getElementById('hud')?.classList.add('hidden');
  document.getElementById('cine')?.classList.add('hidden');
  const nt = document.getElementById('notify'); if (nt) nt.style.visibility = 'hidden';
  if (kind === 'hands' || kind === 'inspect') {
    g.photoMode = null;
    // photo-mode lamp for the viewmodel: warm key from upper left, cool rim from the right
    const vm = g.weapons?.vm;
    if (vm) {
      vm.add(key, rim);
      key.position.set(-0.25, 0.12, -0.2); rim.position.set(0.35, -0.05, -0.55);
      key.distance = rim.distance = 1.4;
      key.intensity = 1.6; rim.intensity = 1.2;
    } else key.intensity = rim.intensity = 0;
    if (kind === 'inspect') g.weapons.inspect?.();
    return kind;
  }
  const VIEWS = {
    strip: [[-3, 1.7, 4], [6, 3.2, 60], 70],
    hof: [[-4, 1.7, 118], [8, 4, 175], 70],
    docks: [[14, 1.7, -20], [-30, 6, -70], 70],
    skyline: [[0, 2.2, 8], [-10, 14, 120], 60],
  };
  if (VIEWS[kind]) {
    const [p, t, fov] = VIEWS[kind];
    key.intensity = rim.intensity = 0;
    g.photoMode = (cam) => {
      cam.position.set(...p); cam.lookAt(...t); cam.fov = fov; cam.updateProjectionMatrix();
      if (g.weapons?.vm) g.weapons.vm.visible = false;
    };
    g.photoMode.view = true; // establishing shot: no portrait DOF
    g.player.pos.set(p[0], 0, p[2]); // zone grade + probe follow the photo camera
    return kind;
  }
  if (g.weapons?.vm) g.weapons.vm.visible = false; // portrait shots: no viewmodel in frame
  const list = g.npcs.list.filter((x) => x.alive && x.type !== 'dummy' && (!type || x.type === type));
  const n = list.sort((a, b) => a.mesh.position.distanceTo(g.player.pos) - b.mesh.position.distanceTo(g.player.pos))[0];
  if (!n) return 'none';
  n.wander = false;
  const v = new THREE.Vector3();
  // volumetric shaft cones right next to the subject would sit between lens and face; hide those few
  // (any additive light-volume mesh whose bounds reach the subject)
  const hideNear = () => {
    g.scene.traverse((m) => {
      const mat = m.material;
      if (!m.isMesh || !m.visible || !mat || Array.isArray(mat) || mat.blending !== THREE.AdditiveBlending) return;
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      const bs = m.geometry.boundingSphere;
      const c = v.copy(bs.center).applyMatrix4(m.matrixWorld);
      const r = bs.radius * m.matrixWorld.getMaxScaleOnAxis();
      if (r < 12 && c.distanceTo(n.mesh.position) < r + 3.2) { m.visible = false; m.userData.photoHidden = true; }
    });
  };
  hideNear();
  g.photoMode = (cam) => {
    if (g.weapons?.vm) g.weapons.vm.visible = false;
    const yaw = n.mesh.rotation.y;
    const fx = Math.sin(yaw + 0.35); const fz = Math.cos(yaw + 0.35);
    if (kind === 'face') {
      const h = n.human.bones.head.getWorldPosition(v);
      cam.position.set(h.x + fx * 0.75, h.y + 0.09, h.z + fz * 0.75);
      cam.lookAt(h.x, h.y + 0.085, h.z);
      cam.fov = 26;
      key.position.set(h.x + Math.sin(yaw - 0.7) * 0.9, h.y + 0.35, h.z + Math.cos(yaw - 0.7) * 0.9);
      rim.position.set(h.x - Math.sin(yaw) * 0.7, h.y + 0.2, h.z - Math.cos(yaw) * 0.7);
      key.intensity = 2.2; rim.intensity = 1.4;
    } else {
      const p = n.mesh.position;
      cam.position.set(p.x + fx * 3.0, p.y + 1.3, p.z + fz * 3.0);
      cam.lookAt(p.x, p.y + 0.92, p.z);
      cam.fov = 42;
      key.position.set(p.x + Math.sin(yaw - 0.8) * 2, p.y + 2.2, p.z + Math.cos(yaw - 0.8) * 2);
      rim.position.set(p.x - Math.sin(yaw) * 1.6, p.y + 1.8, p.z - Math.cos(yaw) * 1.6);
      key.position.set(cam.position.x * 0.5 + p.x * 0.5 + Math.sin(yaw - 1.2), p.y + 2.2, cam.position.z * 0.5 + p.z * 0.5 + Math.cos(yaw - 1.2));
      key.distance = rim.distance = 8;
      key.intensity = 9; rim.intensity = 5;
    }
    cam.updateProjectionMatrix();
    n.anim.lookTarget = cam.position;
  };
  return n.type;
}
