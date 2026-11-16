import { saveSkins } from '../characters/SkinData.js';
import { lockPointer, unlockPointer } from '../core/Input.js';

export class Campaign {
  constructor(game) {
    this.game = game;
    this.beat = -1;
    this.objective = 'Jack in.';
    this.hasPackage = false;
    this.accepted = false;
    this.done = false;
    this.extract = null;
    this.kills = 0;
  }

  boot() {
    this.beat = 0;
    this.objective = 'Check the phone. Job waiting.';
    // The location card owns the first seconds; KITE comes in over the rain, then the phone buzzes.
    setTimeout(() => {
      this.game.hud.subtitle('KITE', 'Wire. Rain’s ugly tonight. Package is in Warehouse 09. Don’t work clean.');
      this.game.audio?.radioLine();
    }, 1600);
    setTimeout(() => {
      this.game.phone.buzz('JOB: INTERCEPT — WAREHOUSE 09');
      this.objective = 'Accept the job — Warehouse 09, Hafen.';
    }, 4200);
  }

  accept() {
    this.accepted = true;
    this.beat = Math.max(this.beat, 1);
    this.objective = 'Intercept: enter Warehouse 09 and recover the VIP package.';
    this.game.hud.subtitle('KITE', 'Bay door is open on the east side. Crew is sloppy. You shouldn’t be.');
    this.game.hud.notify('OBJECTIVE UPDATED');
  }

  onKill() {
    this.kills += 1;
  }

  update() {
    const g = this.game;
    const p = g.player.pos;
    if (this.beat === 0 && g.world.zoneAt(p.z) === 'docks' && p.z < -50) {
      this.accept();
    }
    const wh = g.world.triggers.find((t) => t.id === 'warehouse');
    if (wh && g.world.collision.inBox(p.x, p.y + 1, p.z, wh.box) && this.beat < 1) this.accept();
  }

  onInteract(it) {
    const g = this.game;
    if (it.kind === 'package' && !this.hasPackage) {
      this.hasPackage = true;
      it.disabled = true;
      this.beat = 2;
      g.heat.onPackage();
      this.objective = 'HEAT is up. Extract: Wohnung 4B or the dock boat.';
      g.hud.subtitle('KITE', 'You have it. Streets will get louder. Pick an extract — 4B or the boat.');
      g.hud.notify('VIP PACKAGE SECURED');
      return true;
    }
    if (it.kind === 'extract') {
      if (!this.hasPackage) {
        g.hud.notify('NO PACKAGE — JOB ISN’T DONE');
        return true;
      }
      this.finish(it.extract);
      return true;
    }
    if (it.kind === 'intel') {
      g.hud.subtitle('FILE', 'Cold Cargo: Rhine warehouse skim. Buyer unpaid. Extract optional. Skin stipend attached.');
      return true;
    }
    if (it.kind === 'ammo') {
      g.weapons.restock();
      g.hud.notify('AMMO RESTOCKED');
      return true;
    }
    if (it.kind === 'wardrobe') {
      g.phone.open();
      g.phone.showApp('wardrobe');
      return true;
    }
    if (it.kind === 'door' && it.to) {
      g.fadeTo(it.to, it.notify || 'ENTER');
      return true;
    }
    if (it.kind === 'loot') {
      it.disabled = true;
      g.weapons.mag.reserve += 30;
      g.hud.notify('LOOTED · +30 RESERVE');
      return true;
    }
    if (it.kind === 'locked') {
      g.hud.notify('LOCKED — CLUB IS AFTER HOURS');
      return true;
    }
    if (it.kind === 'light') {
      const l = g.lights.points[g.lights.points.length - 1];
      if (l) {
        l.userData.off = !l.userData.off;
        l.intensity = l.userData.off ? 0 : (l.userData.baseIntensity ?? 1.6);
      }
      g.hud.notify('SWITCH');
      return true;
    }
    if (it.kind === 'vehicle') {
      g.vehicles.enter(it.vehicle);
      return true;
    }
    return false;
  }

  finish(kind) {
    this.done = true;
    this.extract = kind;
    this.beat = 3;
    this.game.skins.unlocked.dockwear = true;
    saveSkins(this.game.skins);
    this.game.mode = 'end';
    this.game.input.blocked = true;
    unlockPointer();
    const card = document.getElementById('endcard');
    card.classList.remove('hidden');
    document.getElementById('end-kicker').textContent = kind === 'boat' ? 'DOCK EXTRACT' : 'SAFEHOUSE EXTRACT';
    document.getElementById('end-vo').textContent = kind === 'boat'
      ? 'KITE: Rhine takes the box. You stay a ghost.'
      : 'KITE: 4B is quiet. The strip still burns under the window.';
    document.getElementById('end-unlock').textContent = 'LOADOUT UNLOCK · DOCK-WEAR';
    document.getElementById('btn-again').onclick = () => {
      card.classList.add('hidden');
      this.game.mode = 'play';
      this.game.input.blocked = false;
      lockPointer(this.game.canvas);
      this.objective = 'District is yours. Heat still remembers.';
    };
    this.game.hud.subtitle('KITE', kind === 'boat' ? 'Boat’s clean. Don’t come back loud.' : 'Sleep in 4B. Wardrobe’s yours — Dock-Wear is unlocked.');
  }
}
