import * as THREE from 'three';
import { SLOTS, PRESETS, saveSkins, exportPreset } from '../characters/SkinData.js';
import { applyViewSkin } from '../weapons/Viewmodel.js';
import { makeMannequin, tintMannequin } from '../characters/PlayerRig.js';

export class SkinEditor {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('wardrobe-view');
    this.preview = null;
    this.man = null;
  }

  mount(el) {
    const s = this.game.skins;
    const id = s.identity;
    el.innerHTML = `<h3>WARDROBE</h3>
      <div class="slot-row">NAME <input id="sk-name" value="${id.name}" /></div>
      <div class="slot-row">CALLSIGN <input id="sk-cs" value="${id.callsign}" /></div>
      ${SLOTS.map((sl) => slotHtml(sl, id)).join('')}
      <div class="slot-row">WEAR <input id="sk-wear" type="range" min="0" max="1" step="0.05" value="${id.wear}" /></div>
      <div class="slot-row">GLOW <input id="sk-glow" type="range" min="0" max="0.6" step="0.05" value="${id.glow}" /></div>
      <div class="loadout-row">
        ${s.loadouts.map((l, i) => `<button data-lo="${i}">${i + 1}</button>`).join('')}
      </div>
      <button id="sk-save">SAVE LOADOUT</button>
      <button id="sk-export">EXPORT JSON</button>
      ${s.unlocked.dockwear ? '<button id="sk-dock">APPLY DOCK-WEAR</button>' : '<p>Extract to unlock DOCK-WEAR</p>'}`;

    el.querySelector('#sk-name').oninput = (e) => { id.name = e.target.value; this.apply(); };
    el.querySelector('#sk-cs').oninput = (e) => { id.callsign = e.target.value; this.apply(); };
    SLOTS.forEach((sl) => {
      const inp = el.querySelector(`#sk-${sl.id}`);
      if (inp) inp.oninput = (e) => { id[sl.id] = e.target.value; this.apply(); };
    });
    el.querySelector('#sk-wear').oninput = (e) => { id.wear = Number(e.target.value); this.apply(); };
    el.querySelector('#sk-glow').oninput = (e) => { id.glow = Number(e.target.value); this.apply(); };
    el.querySelectorAll('[data-lo]').forEach((b) => {
      b.onclick = () => {
        s.active = Number(b.dataset.lo);
        Object.assign(id, s.loadouts[s.active]);
        this.mount(el);
        this.apply();
      };
    });
    el.querySelector('#sk-save').onclick = () => {
      s.loadouts[s.active] = { ...id, id: `slot${s.active}` };
      saveSkins(s);
      this.game.hud.notify(`LOADOUT ${s.active + 1} SAVED`);
    };
    el.querySelector('#sk-export').onclick = () => {
      const blob = new Blob([exportPreset(id)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nightwire-${id.callsign}.json`;
      a.click();
    };
    const dock = el.querySelector('#sk-dock');
    if (dock) dock.onclick = () => { Object.assign(id, PRESETS.dockwear); this.mount(el); this.apply(); };
    this.openPreview();
    this.apply();
  }

  apply() {
    this.game.weapons.setWeapon(this.game.weapons.index);
    applyViewSkin(this.game.weapons.vm, this.game.skins.identity);
    if (this.man) tintMannequin(this.man, this.game.skins.identity);
    saveSkins(this.game.skins);
  }

  openPreview() {
    this.canvas.classList.remove('hidden');
    if (this.preview) return;
    this.preview = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.preview.setSize(200, 280, false);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07080d);
    this.cam = new THREE.PerspectiveCamera(32, 200 / 280, 0.1, 20);
    this.cam.position.set(1.6, 1.4, 3.2);
    this.cam.lookAt(0, 1.1, 0);
    this.scene.add(new THREE.HemisphereLight(0x88aacc, 0x22110a, 0.8));
    const k = new THREE.DirectionalLight(0x3ee0ff, 1.1);
    k.position.set(2, 3, 2);
    this.scene.add(k);
    this.man = makeMannequin(this.game.skins.identity);
    this.scene.add(this.man);
  }

  renderPreview() {
    if (this.canvas.classList.contains('hidden') || !this.preview) return;
    if (this.man) this.man.rotation.y += 0.008;
    this.preview.render(this.scene, this.cam);
  }

  closePreview() {
    this.canvas.classList.add('hidden');
  }
}

function slotHtml(sl, id) {
  const val = id[sl.id] || '#888888';
  const isColor = typeof val === 'string' && val.startsWith('#');
  if (!isColor) return `<div class="slot-row">${sl.label} <input id="sk-${sl.id}" value="${val}" /></div>`;
  return `<div class="slot-row">${sl.label} <input id="sk-${sl.id}" class="swatch" type="color" value="${val}" /></div>`;
}
