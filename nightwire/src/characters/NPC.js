import * as THREE from 'three';
import { mat, boxMesh } from '../world/props.mjs';
import { makeHumanoid } from './PlayerRig.js';

const PALETTES = {
  civil: { jacket: 0x3a3e44, pants: 0x2a2c30, accent: 0x6a5a4a, head: 0x6a5346 },
  crew: { jacket: 0x1a1e22, pants: 0x16181c, accent: 0x3ee0ff, head: 0x5a4a40 },
  security: { jacket: 0x1a2430, pants: 0x12181e, accent: 0x445566, head: 0x4a4038 },
  street: { jacket: 0x241820, pants: 0x1a1418, accent: 0xff2d6a, head: 0x6a5346 },
  dummy: { jacket: 0x6a5a40, pants: 0x5a4a38, accent: 0x888, head: 0xc2b280 },
};

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
    const pal = PALETTES[s.type] || PALETTES.civil;
    const { root, head, lArm, rArm } = makeHumanoid(pal);
    if (s.type === 'security') {
      const plate = boxMesh(0.38, 0.28, 0.16, mat(null, { color: 0x33404c, metalness: 0.55, roughness: 0.38 }));
      plate.position.set(0, 1.18, 0.12);
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat(null, { color: 0x1a2228, metalness: 0.45, roughness: 0.35 }),
      );
      helm.position.set(0, 1.66, 0);
      root.add(plate, helm);
    }
    if (s.type === 'crew') {
      const vest = boxMesh(0.36, 0.32, 0.18, mat(null, {
        color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.16, roughness: 0.55,
      }));
      vest.position.set(0, 1.16, 0.08);
      root.add(vest);
    }
    root.position.set(s.x, this.game.world.collision.floorY(s.x, s.z, 2), s.z);
    root.rotation.y = s.yaw || 0;
    this.group.add(root);
    const npc = {
      mesh: root, type: s.type, dummy: !!s.dummy, hostile: !!s.hostile, guard: !!s.guard,
      wander: !!s.wander, hp: s.dummy ? 40 : s.type === 'crew' ? 70 : 50,
      alive: true, state: 'idle', t: Math.random() * 10, aim: 0,
      origin: new THREE.Vector3(s.x, 0, s.z), vel: new THREE.Vector3(),
      yaw: s.yaw || 0, cooldown: 0, head, lArm, rArm,
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
    if (n.hp <= 0) {
      n.alive = false;
      n.mesh.rotation.x = 1.4;
      n.mesh.position.y += 0.1;
      this.game.hud.kill(`${n.dummy ? 'TARGET' : n.type.toUpperCase()}${head ? '  HS' : ''}`);
      this.game.audio?.kill();
      this.game.story?.onKill(n);
    }
  }

  update(dt) {
    const player = this.game.player.pos;
    const eye = this.game.player.eyePos;
    for (const n of this.list) {
      n.t += dt;
      const breath = 1 + Math.sin(n.t * 2.2) * 0.012;
      n.mesh.scale.y = n.alive ? breath : n.mesh.scale.y;
      if (n.lArm) n.lArm.rotation.x = Math.sin(n.t * 1.4) * 0.08;
      if (n.rArm) n.rArm.rotation.x = Math.sin(n.t * 1.4 + 1) * 0.08;
      if (!n.alive) continue;
      const toP = player.clone().sub(n.mesh.position);
      const dist = toP.length();
      n.mesh.lookAt(n.mesh.position.x + Math.sin(n.yaw) * 2, n.mesh.position.y, n.mesh.position.z + Math.cos(n.yaw) * 2);

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

      if (dist < 16 && n.head) {
        n.head.lookAt(eye);
      }

      const aware = n.hostile || (n.guard && this.game.heat.level >= 1);
      if (aware && dist < 42) {
        const dir = eye.clone().sub(n.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0))).normalize();
        const blocked = this.game.world.collision.raycast(
          n.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), dir, dist - 0.5,
        );
        if (!blocked) {
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
