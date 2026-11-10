import * as THREE from 'three';
import { mat, boxMesh } from '../world/props.mjs';
import { makeHuman } from './HumanBody.mjs';
import { HumanAnimator } from './HumanAnimator.mjs';

const SKIN_TONES = [0x9a6a52, 0x6e4836, 0xc89474, 0x4c3226, 0xae7a5e, 0x82573f];
const EYES = ['#4a3420', '#2e4a5a', '#3a3a24', '#22160e', '#4a5a3a'];
const HAIR = [0x15110e, 0x2a1c12, 0x0c0b0a, 0x4a3422, 0x5a5550];
const LOOKS = {
  civil: [
    { top: 0x3a3e44, pants: 0x2a2c30 }, { top: 0x4a3a2c, pants: 0x22262c, leather: true },
    { top: 0x2c3a34, pants: 0x1c1e22 }, { top: 0x5a2a2a, pants: 0x2a2c34 },
  ],
  crew: [{ top: 0x1a1e22, pants: 0x16181c, vest: true, accent: 0x3ee0ff, hair: 'buzz' }],
  security: [{ top: 0x1a2430, pants: 0x12181e, vest: true, accent: 0x33404c, hair: 'buzz', helmet: true }],
  street: [{ top: 0x241820, pants: 0x1a1418, hood: true, accent: 0xff2d6a, mask: true }, { top: 0x18181e, pants: 0x14141a, hood: true, accent: 0xff2d6a }],
  dummy: [{ top: 0x6a5a40, pants: 0x5a4a38, hair: 'none', skin: 0xc2b280, dummy: true }],
};
let seq = 0;

const damp = (a, b, k, dt) => {
  let d = b - a;
  if (Math.abs(d) > Math.PI && k > 0 && Math.abs(a) < 50 && Math.abs(b) < 50) d = Math.atan2(Math.sin(d), Math.cos(d));
  return a + d * (1 - Math.exp(-k * dt));
};

let _blobTex = null;
function blobTexture() {
  if (_blobTex) return _blobTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.4)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  _blobTex = new THREE.CanvasTexture(c);
  return _blobTex;
}

export class NPCSystem {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.group = new THREE.Group();
    game.scene.add(this.group);
  }

  spawnAll() {
    for (const s of this.game.world.spawns.npc) this.spawn(s);
  }

  spawn(s) {
    const i = seq++;
    const looks = LOOKS[s.type] || LOOKS.civil;
    const look = looks[i % looks.length];
    const cheap = (this.game.qualityProfile?.charDetail ?? 1) === 0;
    const human = makeHuman({
      ...look,
      skin: look.skin ?? SKIN_TONES[(i * 7 + 3) % SKIN_TONES.length],
      eyes: EYES[i % EYES.length],
      hairColor: HAIR[(i * 3) % HAIR.length],
      hair: look.hair ?? ['short', 'buzz', 'long', 'short'][i % 4],
      stubble: i % 3 === 0 ? 0.8 : 0,
      seed: i + 1,
      build: 0.94 + ((i * 37) % 13) / 100,
      face: { nose: 0.8 + ((i * 13) % 5) / 10, jaw: 0.9 + ((i * 7) % 4) / 10, cheek: 0.8 + ((i * 11) % 5) / 10 },
      cheap,
    });
    const root = human.root;
    const scale = (s.type === 'security' ? 1.04 : 0.95) + ((i * 29) % 9) / 100;
    root.scale.setScalar(scale);
    const headBone = human.bones.head;
    if (look.helmet) {
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.118, cheap ? 12 : 24, cheap ? 8 : 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
        mat(null, { color: 0x1a2228, metalness: 0.45, roughness: 0.35 }),
      );
      helm.position.set(0, 0.105, -0.008);
      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(0.121, cheap ? 12 : 24, 6, -Math.PI * 0.32 + Math.PI / 2, Math.PI * 0.64, Math.PI * 0.36, Math.PI * 0.16),
        new THREE.MeshPhysicalMaterial({ color: 0x0a1418, metalness: 0.2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.82 }),
      );
      visor.position.copy(helm.position);
      headBone.add(helm, visor);
    }
    if (look.mask) {
      const mask = new THREE.Mesh(
        new THREE.SphereGeometry(0.094, cheap ? 10 : 18, 8, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.55, Math.PI * 0.3),
        mat(null, { color: 0x121416, roughness: 0.6 }),
      );
      mask.position.set(0, 0.075, 0.02);
      headBone.add(mask);
    }
    if (s.type === 'crew' || s.type === 'security') {
      const gun = boxMesh(0.045, 0.075, 0.32, mat(null, { color: 0x1a1c1e, metalness: 0.6, roughness: 0.35 }));
      gun.position.set(0, -0.085, 0.1);
      gun.rotation.x = Math.PI / 2;
      human.bones.handR.add(gun);
    }
    root.traverse((o) => { if (o.isMesh) o.castShadow = !cheap || o.name === 'body-top'; });
    root.position.set(s.x, this.game.world.collision.floorY(s.x, s.z, 2), s.z);
    root.rotation.y = s.yaw || 0;
    this.group.add(root);

    // contact shadow under the feet (all presets)
    const blob = new THREE.Mesh(this._blobGeo || (this._blobGeo = new THREE.CircleGeometry(0.42, 18)), this._blobMat || (this._blobMat = new THREE.MeshBasicMaterial({
      map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.75,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    })));
    blob.rotation.x = -Math.PI / 2;
    this.group.add(blob);

    const anim = new HumanAnimator(human, i * 1.7 + 0.3);
    const npc = {
      mesh: root, type: s.type, dummy: !!s.dummy, hostile: !!s.hostile, guard: !!s.guard,
      wander: !!s.wander, hp: s.dummy ? 40 : s.type === 'crew' ? 70 : 50,
      alive: true, state: 'idle', t: Math.random() * 10, aim: 0,
      origin: new THREE.Vector3(s.x, 0, s.z), vel: new THREE.Vector3(),
      yaw: s.yaw || 0, cooldown: 0, head: headBone, human, anim, blob,
      last: new THREE.Vector3(s.x, 0, s.z), frame: i,
    };
    this.list.push(npc);
    return npc;
  }

  spawnSecurity(x, z) {
    return this.spawn({ type: 'security', x, z, yaw: 0, hostile: true, guard: true });
  }

  rayHit(origin, dir, max) {
    let best = null;
    for (const n of this.list) {
      if (!n.alive) continue;
      const to = n.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin);
      const t = to.dot(dir);
      if (t < 0.2 || t > max) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      const dist = closest.distanceTo(n.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)));
      if (dist < 0.45 && (!best || t < best.t)) {
        const head = closest.y > n.mesh.position.y + 1.42;
        best = { npc: n, t, point: closest, head, normal: dir.clone().negate() };
      }
    }
    return best;
  }

  hurt(n, dmg, head) {
    if (!n.alive) return;
    n.hp -= dmg;
    n.hostile = n.type !== 'civil';
    if (n.type === 'civil' || n.type === 'street') this.game.heat.add(1);
    const dir = this.game.camera.getWorldDirection(new THREE.Vector3());
    n.anim.hitReact(dir, Math.min(1.6, dmg / 25), head);
    if (n.hp <= 0) {
      n.alive = false;
      n.mesh.userData.yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), n.yaw);
      n.mesh.userData.floorY = n.mesh.position.y;
      n.anim.die(dir);
      this.game.hud.kill(`${n.dummy ? 'TARGET' : n.type.toUpperCase()}${head ? '  HS' : ''}`);
      this.game.audio?.kill();
      this.game.story?.onKill(n);
    }
  }

  update(dt) {
    const player = this.game.player.pos;
    const eye = this.game.player.eyePos;
    const cam = this.game.camera.position;
    this._frame = (this._frame || 0) + 1;
    for (const n of this.list) {
      n.t += dt;
      const camDist = n.mesh.position.distanceTo(cam);
      // animation LOD: every frame up close, every 2nd / 4th frame further out
      const every = camDist < 22 ? 1 : camDist < 45 ? 2 : 4;
      n.animDt = (n.animDt || 0) + dt;
      if ((this._frame + n.frame) % every === 0) {
        n.anim.update(n.animDt, this.game.settings.motion);
        n.animDt = 0;
      }
      n.blob.position.set(n.mesh.position.x, (n.mesh.userData.floorY ?? n.mesh.position.y) + 0.03, n.mesh.position.z);
      if (!n.alive) {
        n.blob.material.opacity = 0.75;
        continue;
      }
      const toP = player.clone().sub(n.mesh.position);
      const dist = toP.length();
      n.mesh.rotation.y = damp(n.mesh.rotation.y, n.yaw, 6, dt);

      if (n.wander && dist > 2.4) {
        n.yaw += Math.sin(n.t * 0.3) * dt * 0.6;
        n.mesh.position.x += Math.sin(n.yaw) * dt * 0.85;
        n.mesh.position.z += Math.cos(n.yaw) * dt * 0.85;
        n.mesh.position.y = this.game.world.collision.floorY(n.mesh.position.x, n.mesh.position.z, n.mesh.position.y + 1);
        this.game.world.collision.resolve(n.mesh.position, 0.28, 1.6, 0.35);
        if (n.mesh.position.distanceTo(n.origin) > 12) {
          n.mesh.position.lerp(n.origin, dt * 0.2);
        }
      } else if (dist < 2.2 && n.wander) {
        n.mesh.position.addScaledVector(toP.setY(0).normalize(), -dt * 1.4);
        this.game.world.collision.resolve(n.mesh.position, 0.28, 1.6, 0.35);
      }

      n.anim.lookTarget = dist < 16 ? eye : null;

      const aware = n.hostile || (n.guard && this.game.heat.level >= 1);
      let aiming = false;
      if (aware && dist < 42) {
        const dir = eye.clone().sub(n.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0))).normalize();
        const blocked = this.game.world.collision.raycast(
          n.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), dir, dist - 0.5,
        );
        if (!blocked) {
          aiming = n.type !== 'civil' && n.type !== 'dummy';
          n.yaw = Math.atan2(toP.x, toP.z);
          if (n.hostile && dist > 7.5) {
            n.mesh.position.x += Math.sin(n.yaw) * dt * 2.35;
            n.mesh.position.z += Math.cos(n.yaw) * dt * 2.35;
            n.mesh.position.y = this.game.world.collision.floorY(n.mesh.position.x, n.mesh.position.z, n.mesh.position.y + 1);
            this.game.world.collision.resolve(n.mesh.position, 0.28, 1.6, 0.35);
          }
          n.cooldown -= dt;
          if (n.cooldown <= 0 && dist < 28 && n.type !== 'dummy') {
            n.cooldown = 0.45 + Math.random() * 0.35;
            this._shootAt(n, eye);
          }
        }
      }
      n.anim.aim = damp(n.anim.aim, aiming ? 1 : 0, 6, dt);
      // measured ground speed drives the gait (no foot sliding against the cycle)
      const moved = Math.hypot(n.mesh.position.x - n.last.x, n.mesh.position.z - n.last.z) / Math.max(dt, 1e-4);
      n.anim.speed = damp(n.anim.speed, moved, 8, dt);
      n.last.copy(n.mesh.position);
    }
  }

  _shootAt(n, eye) {
    const origin = n.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const dir = eye.clone().sub(origin);
    dir.x += (Math.random() - 0.5) * 0.12;
    dir.y += (Math.random() - 0.5) * 0.08;
    dir.normalize();
    this.game.fx.tracer(origin, origin.clone().addScaledVector(dir, 40));
    this.game.audio?.gun('smg', n.mesh.position, 0.45);
    const p = this.game.player.eyePos;
    const miss = origin.clone().addScaledVector(dir, origin.distanceTo(p));
    if (miss.distanceTo(p) < 0.55) {
      this.game.health.damage(11 + Math.random() * 8, n);
    }
  }
}
