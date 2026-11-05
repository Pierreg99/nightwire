import * as THREE from 'three';
import { mat, boxMesh } from '../world/props.js';

export class VehicleSystem {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.active = null;
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.hornT = 0;
  }

  spawnAll() {
    for (const s of this.game.world.spawns.vehicle) this.spawn(s);
  }

  spawn(s) {
    const v = s.type === 'van' ? this._van() : this._sedan();
    v.mesh.position.set(s.x, this.game.world.collision.floorY(s.x, s.z, 1), s.z);
    v.mesh.rotation.y = s.yaw || 0;
    v.yaw = s.yaw || 0;
    v.type = s.type;
    v.speed = 0;
    this.group.add(v.mesh);
    this.list.push(v);
    this.game.world.interact({
      id: `veh-${this.list.length}`,
      label: `[F] Enter ${s.type === 'van' ? 'Van' : 'Sedan'}`,
      position: v.mesh.position,
      kind: 'vehicle',
      vehicle: v,
    });
    return v;
  }

  _sedan() {
    const g = new THREE.Group();
    const paint = mat(this.game.textures.metal, { color: 0x151a20, metalness: 0.72, roughness: 0.28, envMapIntensity: 1.1 });
    const glass = mat(null, { color: 0x0a1218, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.72, envMapIntensity: 1.4 });
    const chrome = mat(this.game.textures.metal, { color: 0x889, metalness: 0.9, roughness: 0.22 });
    const body = boxMesh(1.78, 0.58, 4.15, paint);
    body.position.y = 0.52;
    const skirt = boxMesh(1.82, 0.12, 4.05, mat(null, { color: 0x0a0c0e, roughness: 0.55 }));
    skirt.position.y = 0.28;
    const cabin = boxMesh(1.58, 0.5, 1.85, glass);
    cabin.position.set(0, 1.08, -0.05);
    const roof = boxMesh(1.5, 0.08, 1.7, paint);
    roof.position.set(0, 1.34, -0.02);
    const hood = boxMesh(1.7, 0.08, 1.15, paint);
    hood.position.set(0, 0.84, -1.42);
    const bumper = boxMesh(1.72, 0.22, 0.18, chrome);
    bumper.position.set(0, 0.38, -2.12);
    const tail = boxMesh(1.72, 0.2, 0.16, chrome);
    tail.position.set(0, 0.4, 2.08);
    const lightL = boxMesh(0.28, 0.1, 0.06, mat(null, { color: 0xfff2cc, emissive: 0xffeebb, emissiveIntensity: 2.2 }));
    lightL.position.set(-0.58, 0.52, -2.1);
    const lightR = lightL.clone(); lightR.position.x = 0.58;
    const rearL = boxMesh(0.32, 0.1, 0.05, mat(null, { color: 0xff2d4a, emissive: 0xff2d4a, emissiveIntensity: 1.6 }));
    rearL.position.set(-0.58, 0.52, 2.1);
    const rearR = rearL.clone(); rearR.position.x = 0.58;
    const mirrorL = boxMesh(0.08, 0.08, 0.18, paint);
    mirrorL.position.set(-0.96, 0.98, -0.7);
    const mirrorR = mirrorL.clone(); mirrorR.position.x = 0.96;
    g.add(body, skirt, cabin, roof, hood, bumper, tail, lightL, lightR, rearL, rearR, mirrorL, mirrorR);
    this._wheels(g, 1.78, 4.0);
    return { mesh: g, half: { x: 1.0, z: 2.2, h: 1.4 } };
  }

  _van() {
    const g = new THREE.Group();
    const paint = mat(this.game.textures.metal, { color: 0x1c2226, metalness: 0.5, roughness: 0.38, envMapIntensity: 0.9 });
    const glass = mat(null, { color: 0x11181e, roughness: 0.16, metalness: 0.4, transparent: true, opacity: 0.8 });
    const body = boxMesh(2.02, 1.55, 5.05, paint);
    body.position.y = 1.02;
    const nose = boxMesh(1.95, 0.7, 0.55, paint);
    nose.position.set(0, 0.72, -2.55);
    const window = boxMesh(1.88, 0.48, 0.06, glass);
    window.position.set(0, 1.52, -2.52);
    const sideL = boxMesh(0.04, 0.42, 1.6, glass);
    sideL.position.set(-1.02, 1.48, -1.4);
    const sideR = sideL.clone(); sideR.position.x = 1.02;
    const lightL = boxMesh(0.26, 0.14, 0.06, mat(null, { color: 0xffeecc, emissive: 0xffeecc, emissiveIntensity: 1.8 }));
    lightL.position.set(-0.7, 0.7, -2.82);
    const lightR = lightL.clone(); lightR.position.x = 0.7;
    const rear = boxMesh(1.7, 0.9, 0.06, mat(null, { color: 0x12161a, roughness: 0.5 }));
    rear.position.set(0, 1.15, 2.54);
    const tailL = boxMesh(0.28, 0.12, 0.05, mat(null, { color: 0xff3344, emissive: 0xff2233, emissiveIntensity: 1.4 }));
    tailL.position.set(-0.7, 0.72, 2.56);
    const tailR = tailL.clone(); tailR.position.x = 0.7;
    g.add(body, nose, window, sideL, sideR, lightL, lightR, rear, tailL, tailR);
    this._wheels(g, 2.0, 4.6);
    return { mesh: g, half: { x: 1.15, z: 2.7, h: 1.9 } };
  }

  _wheels(g, w, len) {
    const wm = mat(null, { color: 0x111, roughness: 0.7 });
    for (const [x, z] of [[-w / 2, -len / 2 + 0.5], [w / 2, -len / 2 + 0.5], [-w / 2, len / 2 - 0.5], [w / 2, len / 2 - 0.5]]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), wm);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(x, 0.32, z);
      g.add(wh);
    }
  }

  spawnHeatVan() {
    if (this.heatVan) return this.heatVan;
    const v = this.spawn({ type: 'van', x: 5.4, z: 46, yaw: 0, zone: 'strip' });
    v.heat = true;
    v.approach = 46;
    this.heatVan = v;
    return v;
  }

  enter(v) {
    const p = this.game.player;
    p.inVehicle = v;
    this.active = v;
    p.pos.copy(v.mesh.position);
    p.yaw = v.yaw;
    p.pitch = 0.06;
    this.game.audio?.door();
    this.game.bus.emit('notify', 'ENGINE ON · WASD drive · H horn · F exit');
  }

  exit() {
    const p = this.game.player;
    const v = this.active;
    if (!v) return;
    p.inVehicle = null;
    this.active = null;
    const side = new THREE.Vector3(Math.cos(v.yaw), 0, -Math.sin(v.yaw)).multiplyScalar(2.1);
    p.pos.copy(v.mesh.position).add(side);
    p.pos.y = this.game.world.collision.floorY(p.pos.x, p.pos.z, 4);
    p.vel.set(0, 0, 0);
    this.game.audio?.door();
  }

  update(dt) {
    this.hornT = Math.max(0, this.hornT - dt);
    if (this.heatVan && this.active !== this.heatVan && this.heatVan.approach > 22) {
      const hv = this.heatVan;
      hv.approach -= dt * 7;
      hv.mesh.position.z = hv.approach;
      hv.mesh.rotation.y = 0;
      hv.yaw = 0;
    }
    if (this.game.audio?.radio) {
      const inCar = !!this.active && this.game.audio.radioOn;
      this.game.audio.radio.gain.value = inCar
        ? Math.max(0.62, this.game.settings.radioVol)
        : (this.game.audio.radioOn ? this.game.settings.radioVol * 0.55 : 0);
    }
    const v = this.active;
    if (!v) return;
    const inp = this.game.input;
    const look = inp.consumeLook();
    const axis = inp.axis();
    const throttle = -axis.z;
    const steer = axis.x;
    v.speed += throttle * 11 * dt;
    v.speed *= Math.pow(0.12, dt);
    v.speed = THREE.MathUtils.clamp(v.speed, -6, 16);
    v.yaw -= steer * dt * Math.max(0.4, Math.abs(v.speed) * 0.18);
    v.mesh.rotation.y = v.yaw;
    const fwdX = -Math.sin(v.yaw);
    const fwdZ = -Math.cos(v.yaw);
    v.mesh.position.x += fwdX * v.speed * dt;
    v.mesh.position.z += fwdZ * v.speed * dt;
    const floor = this.game.world.collision.floorY(v.mesh.position.x, v.mesh.position.z, v.mesh.position.y + 1, 1.1);
    v.mesh.position.y = THREE.MathUtils.lerp(v.mesh.position.y, floor, 1 - Math.exp(-8 * dt));
    this.game.world.collision.resolve(v.mesh.position, 1.05, 1.6, 0.6);
    this.game.player.pos.copy(v.mesh.position);
    this.game.player.yaw -= look.x * 0.35;
    this.game.player.pitch = THREE.MathUtils.clamp(this.game.player.pitch - look.y * 0.35, -0.4, 0.5);

    const cam = this.game.camera;
    const hoodFwd = v.type === 'van' ? 2.72 : 1.58;
    const hoodY = v.type === 'van' ? 1.78 : 1.22;
    cam.position.set(
      v.mesh.position.x + fwdX * hoodFwd,
      v.mesh.position.y + hoodY,
      v.mesh.position.z + fwdZ * hoodFwd,
    );
    cam.lookAt(
      v.mesh.position.x + fwdX * 14,
      v.mesh.position.y + 0.72,
      v.mesh.position.z + fwdZ * 14,
    );
    cam.fov = THREE.MathUtils.lerp(cam.fov, 68, 1 - Math.exp(-8 * dt));
    cam.updateProjectionMatrix();

    if (inp.pressed('KeyH') && this.hornT <= 0) { this.game.audio?.horn(); this.hornT = 0.4; }
    if (inp.pressed('KeyF') || this.game.touchVeh) { this.exit(); this.game.touchVeh = false; }
  }
}
