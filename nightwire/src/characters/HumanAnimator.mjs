/**
 * NIGHTWIRE — procedural human animation (.mjs)
 * Drives the bones of makeHuman(): idle (breathing, weight shift, micro head motion), walk / run
 * cycles (stride, knee lift, foot roll, arm swing, pelvis twist + counter-rotating chest, vertical
 * bob, lateral weight transfer), aim pose, head look-at with clamped neck/head split, blinking,
 * spring-based hit reactions and a ragdoll-style topple on death (gravity pendulum around the feet,
 * limbs going limp, a damped bounce on the ground).
 */

import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

export class HumanAnimator {
  constructor(human, seed = Math.random() * 100) {
    this.h = human;
    this.b = human.bones;
    this.seed = seed;
    this.t = seed;
    this.phase = seed;
    this.speed = 0;          // m/s, measured by the caller
    this.aim = 0;            // 0..1 blend to the aim pose
    this.lookTarget = null;  // world Vector3
    this.look = { yaw: 0, pitch: 0 };
    this.blinkT = 1 + (seed % 3);
    this.blink = 0;
    this.hit = { x: 0, z: 0, vx: 0, vz: 0 };
    this.dead = false;
    this.fall = null;
    this.restHipsY = this.b.hips.position.y;
  }

  /** dir: world direction the shot travelled; strength ~1 for a body shot. */
  hitReact(dir, strength = 1, head = false) {
    const root = this.h.root;
    _m.copy(root.matrixWorld).invert();
    _v.copy(dir).transformDirection(_m);
    this.hit.vx += _v.z * 7 * strength;  // pushed back → spine pitches back
    this.hit.vz += -_v.x * 6 * strength;
    if (head) this.headKick = 1;
  }

  die(dir) {
    if (this.dead) return;
    this.dead = true;
    const root = this.h.root;
    _m.copy(root.matrixWorld).invert();
    _v.copy(dir || new THREE.Vector3(0, 0, 1)).setY(0).normalize().transformDirection(_m);
    // fall along the shot: angle about local X (forward/back) and Z (sideways)
    const back = _v.z; const side = _v.x;
    this.fall = { ax: Math.atan2(side, back), th: 0.05, w: 1.6 + Math.random() * 0.8, settled: false, limp: 0 };
  }

  update(dt, motionOk = true) {
    const b = this.b;
    this.t += dt;
    const t = this.t;

    if (this.dead) { this._fall(dt); return; }

    const spd = this.speed;
    const moving = spd > 0.25;
    const run = clamp((spd - 2.2) / 2.0, 0, 1);
    const walkAmt = clamp(spd / 1.4, 0, 1);
    const stride = (moving ? 1 : 0);
    this.phase += dt * (spd > 0.1 ? 4.2 + spd * 1.55 : 0);
    const p = this.phase;
    const s = Math.sin(p);
    const c = Math.cos(p);
    const breath = Math.sin(t * (1.6 + run * 1.4)) * (1 + run);

    // legs
    const thighA = (0.42 + run * 0.32) * walkAmt;
    const kneeA = (0.7 + run * 0.7) * walkAmt;
    const idleShift = moving ? 0 : Math.sin(t * 0.35 + this.seed) * 0.5 + 0.5;
    b.thighL.rotation.x = -s * thighA * stride - (moving ? 0 : 0.02);
    b.thighR.rotation.x = s * thighA * stride - (moving ? 0 : 0.02);
    b.shinL.rotation.x = (Math.pow(Math.max(0, c), 1.5) * kneeA + 0.06) * stride + (moving ? 0 : 0.05 + idleShift * 0.12);
    b.shinR.rotation.x = (Math.pow(Math.max(0, -c), 1.5) * kneeA + 0.06) * stride + (moving ? 0 : 0.05 + (1 - idleShift) * 0.12);
    b.footL.rotation.x = (-b.thighL.rotation.x - b.shinL.rotation.x) * 0.55 + s * 0.15 * stride;
    b.footR.rotation.x = (-b.thighR.rotation.x - b.shinR.rotation.x) * 0.55 - s * 0.15 * stride;
    b.thighL.rotation.z = 0.02; b.thighR.rotation.z = -0.02;

    // pelvis: bob, weight transfer, twist
    const bob = moving ? (Math.abs(c) - 0.6) * 0.035 * (1 + run) : -0.006 * idleShift - Math.max(b.shinL.rotation.x, b.shinR.rotation.x) * 0.02;
    b.hips.position.y = this.restHipsY + bob - run * 0.04;
    b.hips.position.x = moving ? s * 0.022 * (1 - run * 0.5) : (idleShift - 0.5) * 0.035;
    b.hips.rotation.y = s * 0.12 * walkAmt;
    b.hips.rotation.z = moving ? -s * 0.035 : (idleShift - 0.5) * 0.05;
    b.hips.rotation.x = run * 0.08;

    // spine / chest
    b.spine.rotation.x = run * 0.16 + breath * 0.008 + this.hit.x * 0.6;
    b.spine.rotation.z = this.hit.z * 0.6 - b.hips.rotation.z * 0.6;
    b.chest.rotation.y = -s * 0.16 * walkAmt * (1 - this.aim);
    b.chest.rotation.x = breath * 0.012 + this.hit.x * 0.4;
    const chestScale = 1 + breath * 0.012;
    b.chest.scale.set(1 + breath * 0.006, 1, chestScale);
    b.clavL.rotation.z = breath * 0.012; b.clavR.rotation.z = -breath * 0.012;

    // arms (swing opposite the legs, elbows bend more when running) blended into the aim pose
    const armA = (0.38 + run * 0.5) * walkAmt;
    const swingL = s * armA;
    const swingR = -s * armA;
    const idleArm = moving ? 0 : Math.sin(t * 0.9 + this.seed) * 0.03;
    const elbowBase = 0.18 + run * 1.05;
    const aim = this.aim;
    b.upperArmL.rotation.set(
      THREE.MathUtils.lerp(swingL + idleArm, -1.05, aim),
      THREE.MathUtils.lerp(0, -0.55, aim),
      THREE.MathUtils.lerp(0.09 + run * 0.1, -0.35, aim),
    );
    b.upperArmR.rotation.set(
      THREE.MathUtils.lerp(swingR - idleArm, -1.42, aim),
      THREE.MathUtils.lerp(0, 0.15, aim),
      THREE.MathUtils.lerp(-0.09 - run * 0.1, 0.12, aim),
    );
    b.foreArmL.rotation.set(THREE.MathUtils.lerp(-elbowBase - Math.max(0, -s) * 0.3 * walkAmt, -0.85, aim), 0, 0);
    b.foreArmR.rotation.set(THREE.MathUtils.lerp(-elbowBase - Math.max(0, s) * 0.3 * walkAmt, -0.18, aim), 0, 0);
    b.handL.rotation.set(THREE.MathUtils.lerp(0.1, 0.2, aim), THREE.MathUtils.lerp(0, 0.6, aim), 0);
    b.handR.rotation.set(THREE.MathUtils.lerp(0.1, 0.1, aim), 0, THREE.MathUtils.lerp(0, -1.4, aim));

    // hit spring
    const k = 70; const cdamp = 9;
    this.hit.vx += (-k * this.hit.x - cdamp * this.hit.vx) * dt;
    this.hit.vz += (-k * this.hit.z - cdamp * this.hit.vz) * dt;
    this.hit.x += this.hit.vx * dt;
    this.hit.z += this.hit.vz * dt;
    this.hit.x = clamp(this.hit.x, -0.6, 0.6); this.hit.z = clamp(this.hit.z, -0.5, 0.5);

    // head look-at (yaw/pitch split between neck and head), micro motion when idle
    let ty = Math.sin(t * 0.23 + this.seed) * 0.25; let tp = Math.sin(t * 0.17 + this.seed * 2) * 0.06;
    if (this.lookTarget) {
      this.h.root.updateWorldMatrix(true, false);
      _m.copy(this.h.root.matrixWorld).invert();
      _v.copy(this.lookTarget).applyMatrix4(_m).sub(this.b.head.position.clone().add(this.b.neck.position).add(this.b.chest.position).add(this.b.spine.position).add(this.b.hips.position));
      ty = clamp(Math.atan2(_v.x, _v.z), -1.15, 1.15);
      tp = clamp(-Math.atan2(_v.y, Math.hypot(_v.x, _v.z)), -0.5, 0.45);
      if (Math.abs(Math.atan2(_v.x, _v.z)) > 2.2) { ty = 0; tp = 0; }
    }
    this.look.yaw = damp(this.look.yaw, ty, 5, dt);
    this.look.pitch = damp(this.look.pitch, tp, 5, dt);
    const chestYaw = b.chest.rotation.y;
    b.neck.rotation.set(this.look.pitch * 0.4 - run * 0.1, (this.look.yaw - chestYaw) * 0.4, 0);
    this.headKick = Math.max(0, (this.headKick || 0) - dt * 4);
    b.head.rotation.set(this.look.pitch * 0.6 - this.headKick * 0.4 - run * 0.06, (this.look.yaw - chestYaw) * 0.6, Math.sin(t * 0.5 + this.seed) * 0.03);

    // blink
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.14; this.blinkT = 2 + Math.random() * 4; }
    if (this.blink > 0) this.blink -= dt;
    const closed = this.blink > 0 ? Math.sin((1 - this.blink / 0.14) * Math.PI) : 0;
    const lid = -0.95 + closed * 2.35;
    if (this.h.lidL) this.h.lidL.rotation.x = lid;
    if (this.h.lidR) this.h.lidR.rotation.x = lid;
  }

  _fall(dt) {
    const f = this.fall;
    const b = this.b;
    const root = this.h.root;
    if (!f.settled) {
      // inverted pendulum around the feet: θ'' = g/L · sin θ
      f.w += 9.81 / 1.0 * Math.sin(f.th) * dt;
      f.th += f.w * dt;
      if (f.th >= Math.PI / 2 - 0.08) {
        f.th = Math.PI / 2 - 0.08;
        f.w = -f.w * 0.22;
        if (Math.abs(f.w) < 0.35) { f.settled = true; f.w = 0; }
      }
    }
    f.limp = Math.min(1, f.limp + dt * 2.2);
    const l = f.limp;
    // tilt the whole body along the fall axis (rotate about the horizontal axis ⟂ fall direction)
    const axis = _v.set(Math.cos(f.ax), 0, -Math.sin(f.ax));
    root.quaternion.setFromAxisAngle(axis, f.th).premultiply(root.userData.yawQ || new THREE.Quaternion());
    root.position.y = (root.userData.floorY ?? root.position.y) + Math.sin(f.th) * 0.11;
    // limbs go limp: knees buckle on the way down, then straighten on the ground; arms flop out
    const down = f.th / (Math.PI / 2);
    b.shinL.rotation.x = THREE.MathUtils.lerp(b.shinL.rotation.x, 0.9 * (1 - down) + 0.15, l * 0.2);
    b.shinR.rotation.x = THREE.MathUtils.lerp(b.shinR.rotation.x, 0.7 * (1 - down) + 0.25, l * 0.2);
    b.thighL.rotation.x = THREE.MathUtils.lerp(b.thighL.rotation.x, -0.25, l * 0.15);
    b.thighR.rotation.x = THREE.MathUtils.lerp(b.thighR.rotation.x, -0.05, l * 0.15);
    b.upperArmL.rotation.x = THREE.MathUtils.lerp(b.upperArmL.rotation.x, -0.4, l * 0.15);
    b.upperArmL.rotation.z = THREE.MathUtils.lerp(b.upperArmL.rotation.z, 0.9, l * 0.15);
    b.upperArmR.rotation.x = THREE.MathUtils.lerp(b.upperArmR.rotation.x, -0.2, l * 0.15);
    b.upperArmR.rotation.z = THREE.MathUtils.lerp(b.upperArmR.rotation.z, -1.1, l * 0.15);
    b.foreArmL.rotation.x = THREE.MathUtils.lerp(b.foreArmL.rotation.x, -0.5, l * 0.15);
    b.foreArmR.rotation.x = THREE.MathUtils.lerp(b.foreArmR.rotation.x, -0.2, l * 0.15);
    b.head.rotation.y = THREE.MathUtils.lerp(b.head.rotation.y, 0.7, l * 0.1);
    b.head.rotation.x = THREE.MathUtils.lerp(b.head.rotation.x, -0.3, l * 0.1);
    b.spine.rotation.x = THREE.MathUtils.lerp(b.spine.rotation.x, -0.1, l * 0.1);
    if (this.h.lidL) { this.h.lidL.rotation.x = 0.6; this.h.lidR.rotation.x = 0.6; }
  }
}
