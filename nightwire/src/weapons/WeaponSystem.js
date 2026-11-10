import * as THREE from 'three';
import { WEAPONS, KNIFE } from './defs.js';
import { pullTrigger } from './trigger.js';
import { makeViewmodel, makeGun, applyViewSkin } from './Viewmodel.js';
import { LOOK } from '../fx/look.mjs';

export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.index = 0;
    this.def = WEAPONS[0];
    this.ammo = WEAPONS.map((w) => ({ mag: w.mag, reserve: w.reserve }));
    this.cooldown = 0;
    this.reloading = 0;
    this.recoilI = 0;
    this.ads = false;
    this.spread = 0;
    this.kick = 0;
    this.meleeT = 0;
    this._held = false;
    this.recoilDebt = 0;
    this.recoverT = 0;
    this.vm = makeViewmodel(game.skins.identity, this.def);
    this.vm.visible = false;
    game.camera.add(this.vm);
    this._ray = new THREE.Raycaster();
    this._dir = new THREE.Vector3();
    this._origin = new THREE.Vector3();
  }

  get mag() { return this.ammo[this.index]; }

  setWeapon(i) {
    this.index = (i + WEAPONS.length) % WEAPONS.length;
    this.def = WEAPONS[this.index];
    this.reloading = 0;
    this.recoilI = 0;
    this._held = false;
    const old = this.vm.getObjectByName('gun');
    if (old) this.vm.remove(old);
    const gun = makeGun(this.def, this.game.skins.identity);
    gun.name = 'gun';
    gun.position.set(0.12, -0.22, -0.48);
    this.vm.add(gun);
    applyViewSkin(this.vm, this.game.skins.identity);
  }

  restock() {
    WEAPONS.forEach((w, i) => { this.ammo[i].mag = w.mag; this.ammo[i].reserve = w.reserve; });
  }

  update(dt) {
    const g = this.game;
    if (g.player.inVehicle || g.mode !== 'play') {
      this.vm.visible = false;
      return;
    }
    this.vm.visible = true;
    for (let i = 0; i < WEAPONS.length && i < 9; i++) {
      if (g.input.pressed(`Digit${i + 1}`)) this.setWeapon(i);
    }
    if (g.input.weaponStep) {
      this.setWeapon(this.index + g.input.weaponStep);
      g.input.weaponStep = 0;
    }
    if (g.input.wheel) { this.setWeapon(this.index + Math.sign(g.input.wheel)); g.input.wheel = 0; }

    this.ads = (g.input.ads || g.touchAds || g.input.padAds) && !this.reloading && !g.input.blocked;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.kick = Math.max(0, this.kick - dt * 8);
    this.spread = THREE.MathUtils.lerp(this.spread, this.ads ? this.def.spreadAds : this.def.spreadHip, 1 - Math.exp(-8 * dt));
    if (this.reloading > 0) {
      this.reloading -= dt;
      const mag = this.vm.getObjectByName('mag');
      if (mag) mag.position.y = -0.1 - Math.sin(Math.min(1, (this.def.reload - this.reloading) / this.def.reload) * Math.PI) * 0.18;
      if (this.reloading <= 0) {
        const need = this.def.mag - this.mag.mag;
        const take = Math.min(need, this.mag.reserve);
        this.mag.mag += take;
        this.mag.reserve -= take;
        if (mag) mag.position.y = -0.1;
      }
    }
    if ((g.input.pressed('KeyR') || g.touchReload) && this.mag.mag < this.def.mag && this.mag.reserve > 0) {
      this.reloading = this.def.reload;
      g.touchReload = false;
      g.audio?.reload();
    }

    this.meleeT = Math.max(0, this.meleeT - dt);
    if ((g.input.pressed('KeyG') || g.input.pressed('KeyV')) && this.meleeT <= 0) this.melee();

    const held = (g.input.fire || g.touchFire || g.input.padFire) && !g.input.blocked;
    // Recoil recovery: ~55 % of the climb drifts back once the trigger rests.
    this.recoverT = held ? 0 : this.recoverT + dt;
    if (this.recoverT > 0.09 && Math.abs(this.recoilDebt) > 1e-4) {
      const back = this.recoilDebt * (1 - Math.exp(-9 * dt));
      g.player.pitch -= back;
      this.recoilDebt -= back;
    }
    const firing = pullTrigger(this.def.mode || 'auto', held, this._held);
    this._held = held;
    if (firing && this.cooldown <= 0 && this.reloading <= 0) {
      if (this.mag.mag <= 0) {
        if (this.mag.reserve > 0) { this.reloading = this.def.reload; g.audio?.reload(); }
        else g.audio?.dry();
      } else this.shoot();
    }

    const hip = new THREE.Vector3(0.12, -0.22, -0.48);
    const ads = new THREE.Vector3(0.0, -0.145, -0.32);
    const gun = this.vm.getObjectByName('gun');
    if (gun) {
      gun.position.lerp(this.ads ? ads : hip, 1 - Math.exp(-14 * dt));
      gun.rotation.x = -this.kick * 0.4;
      gun.position.z += this.kick * 0.04;
    }
    const sway = g.settings.motion ? Math.sin(g.time.elapsed * 1.4) * 0.004 : 0;
    this.vm.position.set(sway, Math.sin(g.player.bob) * 0.01, 0);
    const knife = this.vm.getObjectByName('knife');
    if (knife) {
      knife.visible = this.meleeT > 0.05;
      if (knife.visible) knife.rotation.x = -Math.sin((KNIFE.time - this.meleeT) / KNIFE.time * Math.PI) * 1.2;
    }
  }

  shoot() {
    const g = this.game;
    this.mag.mag -= 1;
    this.cooldown = 60 / this.def.rpm;
    const rec = this.def.recoil[this.recoilI % this.def.recoil.length];
    this.recoilI++;
    const climb = rec[1] * 0.045 * this.def.kick;
    g.player.pitch += climb;
    this.recoilDebt += climb * 0.55;
    g.player.yaw += rec[0] * 0.05 * this.def.kick;
    this.kick = 1;
    g.player.fovPunch = 1.6;
    g.audio?.gun(this.def.type, g.player.pos);
    g.fx.muzzle(g.camera, this.def.type);
    g.player.addTrauma?.(0.08 + this.def.kick * 0.1);
    g.neon?.react(g.player.pos, 0.6 + this.def.kick * 0.4);
    const pellets = this.def.pellets || 1;
    for (let i = 0; i < pellets; i++) this._pellet();
    g.heat?.onShot();
  }

  _pellet() {
    const g = this.game;
    g.camera.getWorldDirection(this._dir);
    this._dir.x += (Math.random() - 0.5) * this.spread * 2;
    this._dir.y += (Math.random() - 0.5) * this.spread * 2;
    this._dir.z += (Math.random() - 0.5) * this.spread * 2;
    this._dir.normalize();
    g.camera.getWorldPosition(this._origin);
    const npcHit = g.npcs.rayHit(this._origin, this._dir, this.def.range);
    const worldHit = g.world.collision.raycast(this._origin, this._dir, this.def.range);
    let end = this._origin.clone().addScaledVector(this._dir, this.def.range);
    if (npcHit && (!worldHit || npcHit.t <= worldHit.t)) {
      end = npcHit.point;
      const head = npcHit.head;
      const dmg = this.def.damage * (head ? 1.8 : 1);
      g.npcs.hurt(npcHit.npc, dmg, head);
      g.hud.hitmarker(head);
      g.audio?.impact(true, end);
      g.fx.decal(end, npcHit.normal || this._dir.clone().negate(), true);
      g.fx.impact(end, npcHit.normal || this._dir.clone().negate(), true);
    } else if (worldHit) {
      end = worldHit.point;
      g.audio?.impact(false, end);
      g.fx.decal(end, worldHit.normal, false);
      g.fx.impact(end, worldHit.normal, false);
    }
    g.fx.tracer(this._origin.clone().add(this._dir.clone().multiplyScalar(0.6)), end, LOOK.tracer[this.def.type] || LOOK.tracer.rifle);
  }

  melee() {
    const g = this.game;
    this.meleeT = KNIFE.time;
    g.audio?.melee();
    g.camera.getWorldDirection(this._dir);
    g.camera.getWorldPosition(this._origin);
    const hit = g.npcs.rayHit(this._origin, this._dir, KNIFE.range);
    if (hit) {
      g.npcs.hurt(hit.npc, KNIFE.damage, false);
      g.hud.hitmarker(false);
    }
  }
}
