/**
 * NIGHTWIRE — first-person arms (.mjs)
 * Gloved hands with modelled fingers (from the shared hand sculpt) that hold the current gun at
 * its grip / fore-grip anchors, wrist skin with the wardrobe tattoo, and jacket sleeves solved
 * every frame between the wrists and off-screen elbow anchors (two-point IK, so the forearm stays
 * attached whatever the gun does). Animation layers: look sway (spring lag), move bob (figure-8),
 * sprint carry, reload (support hand to the magazine and back, gun roll) and inspect.
 */

import * as THREE from 'three';
import { handGeometries, clothMaterial } from '../characters/HumanBody.mjs';
import { fabricNormal } from '../characters/humanTextures.mjs';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

/** Grip / fore-grip wrist anchors per weapon type in gun space. */
export const ANCHORS = {
  pistol: { r: [0.03, -0.07, 0.12], l: [-0.07, -0.105, 0.1] },
  smg: { r: [0.03, -0.075, 0.165], l: [-0.075, -0.1, -0.1] },
  rifle: { r: [0.03, -0.075, 0.165], l: [-0.078, -0.083, -0.19] },
  dmr: { r: [0.03, -0.075, 0.165], l: [-0.078, -0.083, -0.22] },
  shotgun: { r: [0.03, -0.075, 0.155], l: [-0.08, -0.075, -0.16] },
};
// Hand-space → gun-space bases. Right: palm against the grip (-X), fingers forward (-Z), index on top.
// Left (C-clamp): palm faces up/right into the hand guard, fingers reach forward and wrap the
// right side, thumb over the left side. Hand space: fingers -Y, palm -X (left hand), thumb +Z.
function clampBasis() {
  const n = new THREE.Vector3(0.7, 0.7, 0).normalize();
  const f = new THREE.Vector3(0.6, -0.1, -0.8);
  f.addScaledVector(n, -f.dot(n)).normalize();
  const x = n.clone().negate();
  const y = f.clone().negate();
  const z = new THREE.Vector3().crossVectors(x, y);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
const BASIS_R = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0.25, 1).normalize(), new THREE.Vector3(0, 1, -0.25).normalize()));
const BASIS_L = clampBasis();

function handMesh(side, curl, mat) {
  const geos = handGeometries(curl, 10, side);
  const g = mergeGeometries(geos.map((x) => (x.index ? x : x)), false);
  geos.forEach((x) => x.dispose());
  const m = new THREE.Mesh(g, mat);
  m.scale.setScalar(1.1); // glove bulk
  m.name = 'hand';
  return m;
}

export class FPArms {
  constructor(vm, skin) {
    this.vm = vm;
    this.root = new THREE.Group();
    this.root.name = 'arms';
    vm.add(this.root);
    this.glove = new THREE.MeshPhysicalMaterial({
      color: 0x3a3e46, roughness: 0.55, metalness: 0.02, normalMap: fabricNormal(),
      normalScale: new THREE.Vector2(0.5, 0.5), sheen: 0.4, sheenRoughness: 0.7, sheenColor: new THREE.Color(0x30343a),
    });
    this.sleeveMat = clothMaterial(skin.jacket, false, { fold: 0.9 }).clone();
    this.skinMat = new THREE.MeshPhysicalMaterial({ color: 0x8a6450, roughness: 0.5, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.85, 0.32, 0.26) });

    this.hands = {};
    this.sleeves = {};
    for (const s of ['r', 'l']) {
      const sg = s === 'r' ? -1 : 1;
      const wrist = new THREE.Group();
      wrist.name = `wrist-${s}`;
      const hand = handMesh(sg, s === 'r' ? 0.95 : 0.75, this.glove);
      wrist.add(hand);
      // glove cuff + bare wrist band (tattoo lives on the left one)
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.031, 0.03, 16, 1, true), this.glove);
      cuff.position.y = 0.012;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.033, 0.045, 16, 1, true), this.skinMat);
      band.position.y = 0.045;
      wrist.add(cuff, band);
      if (s === 'l') {
        const tat = new THREE.Mesh(new THREE.CylinderGeometry(0.0335, 0.0335, 0.012, 16, 1, true, -0.6, 1.4), new THREE.MeshStandardMaterial({
          color: skin.tattoo, emissive: skin.tattoo, emissiveIntensity: 0.4 + skin.glow, roughness: 0.5,
        }));
        tat.name = 'tattoo';
        tat.position.y = 0.05;
        const watch = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.022, 0.038), new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.85, roughness: 0.25 }));
        watch.position.set(0.032, 0.03, 0);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.028), new THREE.MeshBasicMaterial({ color: 0x3ee0ff }));
        face.rotation.y = Math.PI / 2;
        face.position.set(0.0475, 0.03, 0);
        wrist.add(tat, watch, face);
      }
      this.root.add(wrist);
      this.hands[s] = wrist;
      // sleeve: unit cylinder along +Y, stretched between wrist and elbow each frame
      const geo = new THREE.CylinderGeometry(1, 1.18, 1, 18, 3, true);
      geo.translate(0, 0.5, 0);
      const sleeve = new THREE.Mesh(geo, this.sleeveMat);
      sleeve.name = 'sleeve';
      this.root.add(sleeve);
      const accent = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.06, 18, 1, true), new THREE.MeshStandardMaterial({
        color: skin.jacketAccent, emissive: skin.jacketAccent, emissiveIntensity: 0.25,
      }));
      accent.name = 'accent';
      accent.position.y = 0.12;
      sleeve.add(accent);
      this.sleeves[s] = sleeve;
    }
    // Viewmodel fill: a short-range light on the camera so hands read in dark alleys (like every FPS).
    this.fill = new THREE.PointLight(0xc8d8ff, 1.6, 0.9, 2);
    this.fill.position.set(0.06, -0.02, -0.18);
    vm.add(this.fill);
    this.elbow = { r: new THREE.Vector3(0.26, -0.42, -0.02), l: new THREE.Vector3(-0.3, -0.44, -0.1) };

    this.sway = new THREE.Vector2(); this.swayV = new THREE.Vector2();
    this.reloadK = 0;
    this.inspectT = 0;
    this.sprintK = 0;
  }

  setSkin(skin) {
    this.sleeveMat.color.set(skin.jacket);
  }

  inspect() { if (this.inspectT <= 0) this.inspectT = 2.4; }

  /**
   * @param gun     the gun group (child of vm)
   * @param type    weapon type
   * @param st      { dt, look:{x,y}, bob, moving, sprint, ads, reload (0..1 or -1), motion }
   */
  update(gun, type, st) {
    const dt = st.dt;
    const motion = st.motion;
    // spring sway from look delta: the gun lags behind the view
    const tx = THREE.MathUtils.clamp(-st.look.x * 6, -0.06, 0.06) * (motion ? 1 : 0.3);
    const ty = THREE.MathUtils.clamp(st.look.y * 6, -0.05, 0.05) * (motion ? 1 : 0.3);
    const k = 120; const c = 16;
    this.swayV.x += ((tx - this.sway.x) * k - this.swayV.x * c) * dt;
    this.swayV.y += ((ty - this.sway.y) * k - this.swayV.y * c) * dt;
    this.sway.x += this.swayV.x * dt;
    this.sway.y += this.swayV.y * dt;
    this.sprintK += ((st.sprint && !st.ads && st.reload < 0 ? 1 : 0) - this.sprintK) * (1 - Math.exp(-8 * dt));
    const adsK = st.ads ? 0.25 : 1;

    // figure-8 bob + idle breathing
    const bob = motion && st.moving ? st.bob : 0;
    const bx = Math.sin(bob) * 0.012 * adsK;
    const by = -Math.abs(Math.cos(bob)) * 0.01 * adsK + Math.sin(performance.now() * 0.0012) * 0.0015;
    this.vm.position.set(bx + this.sway.x * 0.25, by + this.sway.y * 0.2 - this.sprintK * 0.03, 0);
    this.vm.rotation.set(this.sway.y * 0.6 + this.sprintK * -0.12, this.sway.x * 0.8 + this.sprintK * 0.55, -this.sway.x * 0.5 + this.sprintK * 0.25);

    // reload / inspect gun motion (applied on top of the WeaponSystem kick)
    let roll = 0; let pitch = 0; let yaw = 0;
    const r = st.reload;
    if (r >= 0) {
      const e = Math.sin(Math.min(1, r) * Math.PI);
      roll = 0.45 * e; pitch = 0.18 * e;
    }
    if (this.inspectT > 0) {
      this.inspectT -= dt;
      const p = 1 - this.inspectT / 2.4;
      const e = Math.sin(Math.min(1, p) * Math.PI);
      yaw = -0.95 * e; roll = 0.55 * Math.sin(p * Math.PI * 2) * e; pitch = 0.2 * e;
    }
    gun.rotation.y = yaw;
    gun.rotation.z = roll;
    gun.rotation.x += pitch;
    gun.updateMatrix();

    // hands on the anchors
    const A = ANCHORS[type] || ANCHORS.rifle;
    gun.updateMatrixWorld(true);
    this.vm.updateMatrixWorld(true);
    const toVm = new THREE.Matrix4().copy(this.vm.matrixWorld).invert().multiply(gun.matrixWorld);
    const gq = new THREE.Quaternion().setFromRotationMatrix(toVm);
    // right: wrist behind the grip, fingers wrap forward/down around it
    const R = this.hands.r;
    R.position.fromArray(A.r).applyMatrix4(toVm);
    R.quaternion.copy(gq).multiply(BASIS_R);
    // left: on the fore-grip, or on the magazine while reloading
    const L = this.hands.l;
    _a.fromArray(A.l);
    const mag = gun.getObjectByName('mag');
    if (r >= 0 && mag) {
      const w = r < 0.25 ? r / 0.25 : r > 0.8 ? (1 - r) / 0.2 : 1;
      _b.copy(mag.position).add(_a.set(-0.03, -0.03, 0.02));
      _a.fromArray(A.l).lerp(_b, Math.min(1, Math.max(0, w)));
    }
    L.position.copy(_a).applyMatrix4(toVm);
    L.quaternion.copy(gq).multiply(BASIS_L);

    // sleeves: wrist (+ 6 cm up the arm) → elbow anchor
    for (const s of ['r', 'l']) {
      const w = this.hands[s];
      _a.set(0, 0.065, 0).applyQuaternion(w.quaternion).add(w.position);
      _b.copy(this.elbow[s]);
      _b.x += this.sway.x * 0.5; _b.y += this.sway.y * 0.4 - this.sprintK * 0.05;
      const sl = this.sleeves[s];
      const len = _a.distanceTo(_b);
      sl.position.copy(_a);
      sl.quaternion.setFromUnitVectors(UP, _b.clone().sub(_a).normalize());
      sl.scale.set(0.036, len, 0.034);
      sl.children[0].scale.set(1, 1 / len, 1);
    }
  }
}
