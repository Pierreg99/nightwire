import * as THREE from 'three';
import { clamp } from '../core/math.js';
import { Stance } from './Stance.js';

export class FPSController {
  constructor(game) {
    this.game = game;
    this.pos = new THREE.Vector3(6.2, 0, -26.5);
    this.vel = new THREE.Vector3();
    this.yaw = -0.33;
    this.pitch = 0;
    this.onGround = false;
    this.crouch = false;
    this.sprint = false;
    this.stance = new Stance();
    this.height = 1.72;
    this.eye = 1.62;
    this.radius = 0.32;
    this.bob = 0;
    this.fovPunch = 0;
    this.inVehicle = null;
    this.wish = new THREE.Vector3();
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
  }

  spawn(s) {
    this.pos.set(s.x, s.y, s.z);
    this.yaw = s.yaw ?? 0;
    this.vel.set(0, 0, 0);
  }

  get eyePos() {
    const e = this.crouch ? 1.12 : this.eye;
    return new THREE.Vector3(this.pos.x, this.pos.y + e, this.pos.z);
  }

  update(dt) {
    const g = this.game;
    if (this.inVehicle) return;
    const look = g.input.consumeLook();
    this.yaw -= look.x;
    this.pitch = clamp(this.pitch - look.y, -1.45, 1.45);

    if (g.input.pressed('ControlLeft') || g.input.pressed('KeyC')) this.crouch = !this.crouch;
    this.stance.set(this.crouch);
    const axis = g.input.blocked ? { x: 0, z: 0, mag: 0 } : g.input.axis();
    const wantSprint = !this.crouch && (g.input.keys.has('ShiftLeft') || g.input.padSprint || axis.mag >= g.settings.autoSprint);
    this.sprint = wantSprint && g.stamina.update(dt, wantSprint && axis.mag > 0.4);
    this.height = this.stance.height;
    this.eye = this.stance.eye;

    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.wish.set(0, 0, 0);
    this.wish.addScaledVector(this.right, axis.x);
    this.wish.addScaledVector(this.forward, -axis.z);
    if (this.wish.lengthSq() > 1) this.wish.normalize();

    const speed = this.crouch ? 2.15 : this.sprint ? 6.15 : 4.35;
    const accel = this.onGround ? 14 : 3.2;
    const wishVel = this.wish.clone().multiplyScalar(speed);
    const hv = new THREE.Vector3(this.vel.x, 0, this.vel.z);
    const dv = wishVel.sub(hv);
    const max = accel * dt * speed;
    if (dv.length() > max) dv.setLength(max);
    this.vel.x += dv.x;
    this.vel.z += dv.z;
    if (this.onGround) {
      this.vel.x *= Math.pow(0.0012, dt);
      this.vel.z *= Math.pow(0.0012, dt);
    }

    this.vel.y -= 22 * dt;
    if (this.onGround && !g.input.blocked && (g.input.pressed('Space') || g.touchJump)) {
      this.vel.y = 6.05;
      this.onGround = false;
      g.touchJump = false;
      g.audio?.foot(this.pos, 1.2);
    }

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    g.world.collision.resolve(this.pos, this.radius, this.height);

    const floor = g.world.collision.floorY(this.pos.x, this.pos.z, this.pos.y, this.radius);
    this.pos.y += this.vel.y * dt;
    if (this.pos.y <= floor) {
      this.pos.y = floor;
      if (this.vel.y < 0) this.vel.y = 0;
      this.onGround = true;
    } else this.onGround = false;

    const spd = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && spd > 1.2) {
      this.bob += dt * spd * 1.7;
      if (!g._stepT) g._stepT = 0;
      g._stepT += dt * spd;
      if (g._stepT > 0.42) { g._stepT = 0; g.audio?.foot(this.pos, this.sprint ? 1 : 0.7); }
    }
    this.fovPunch = Math.max(0, this.fovPunch - dt * 18);
    g.world.recordPath(this.pos);
  }

  applyCamera(cam, dt, ads) {
    const eye = this.eyePos;
    const bobAmp = this.game.settings.motion && this.onGround ? Math.sin(this.bob * 2) * 0.025 : 0;
    cam.position.set(eye.x, eye.y + bobAmp, eye.z);
    cam.rotation.order = 'YXZ';
    cam.rotation.y = this.yaw;
    cam.rotation.x = this.pitch;
    const base = this.game.settings.fov;
    const target = ads ? this.game.weapons.def.adsFov : base;
    cam.fov = THREE.MathUtils.lerp(cam.fov, target + this.fovPunch, 1 - Math.exp(-12 * dt));
    cam.updateProjectionMatrix();
  }
}
