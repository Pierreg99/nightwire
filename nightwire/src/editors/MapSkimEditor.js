import * as THREE from 'three';
import { addCover, addLamp, boxMesh, mat } from '../world/props.mjs';
import { lockPointer, unlockPointer } from '../core/Input.js';

const PALETTE = ['cover', 'light', 'vehicle', 'npc', 'trigger', 'landmark'];

export class MapSkimEditor {
  constructor(game) {
    this.game = game;
    this.openState = false;
    this.tool = 'cover';
    this.cam = new THREE.PerspectiveCamera(50, 1, 0.5, 560);
    this.cam.position.set(0, 90, 20);
    this.orbit = { yaw: 0, pitch: 0.9, dist: 92, px: 0, pz: 10 };
    this.overlay = null;
    this.heatmap = null;
  }

  open() {
    this.openState = true;
    this.game.mode = 'skim';
    this.game.input.blocked = true;
    unlockPointer();
    this._ui(true);
    this.game.canvas.addEventListener('pointerdown', this._onClick);
    this.game.hud.notify('SKIM · click to place · DROP playtest · ESC exit');
  }

  close() {
    this.openState = false;
    this.game.canvas.removeEventListener('pointerdown', this._onClick);
    this._ui(false);
    if (this.heatmap) {
      this.game.scene.remove(this.heatmap);
      this.heatmap.geometry.dispose();
      this.heatmap = null;
    }
    if (this.game.mode === 'skim') {
      this.game.mode = 'play';
      this.game.input.blocked = false;
      lockPointer(this.game.canvas);
    }
  }

  _ui(on) {
    let bar = document.getElementById('skim-bar');
    if (!on) { bar?.remove(); return; }
    if (bar) return;
    bar = document.createElement('div');
    bar.id = 'skim-bar';
    bar.style.cssText = 'pointer-events:auto;position:absolute;left:16px;bottom:16px;display:flex;gap:6px;flex-wrap:wrap;max-width:70vw;z-index:8';
    bar.innerHTML = PALETTE.map((t) => `<button data-t="${t}" class="btn-ghost">${t}</button>`).join('')
      + `<button id="sk-drop" class="btn-jack sm">DROP</button>`
      + `<button id="sk-save" class="btn-ghost">SAVE JSON</button>`
      + `<button id="sk-z-docks" class="btn-ghost">HAFEN</button>`
      + `<button id="sk-z-strip" class="btn-ghost">STRIP</button>`
      + `<button id="sk-z-hof" class="btn-ghost">HOF</button>`
      + `<button id="sk-exit" class="btn-ghost">EXIT</button>`;
    document.getElementById('nui').appendChild(bar);
    bar.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => { this.tool = b.dataset.t; }; });
    bar.querySelector('#sk-drop').onclick = () => { this.dropMode = true; this.game.hud.notify('CLICK MAP TO DROP INTO FPS'); };
    bar.querySelector('#sk-save').onclick = () => this.save();
    bar.querySelector('#sk-exit').onclick = () => this.close();
    bar.querySelector('#sk-z-docks').onclick = () => { this.game.world.zones.docks.visible = !this.game.world.zones.docks.visible; };
    bar.querySelector('#sk-z-strip').onclick = () => { this.game.world.zones.strip.visible = !this.game.world.zones.strip.visible; };
    bar.querySelector('#sk-z-hof').onclick = () => { this.game.world.zones.hof.visible = !this.game.world.zones.hof.visible; };
  }

  _onClick = (e) => {
    if (!this.openState) return;
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.cam);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    ray.ray.intersectPlane(plane, hit);
    if (!hit) return;
    if (this.dropMode) {
      this.dropMode = false;
      this.game.player.pos.set(hit.x, this.game.world.collision.floorY(hit.x, hit.z, 8), hit.z);
      this.game.player.vel.set(0, 0, 0);
      this.close();
      this.game.hud.notify('PLAYTEST DROP');
      return;
    }
    this.place(hit);
  };

  place(p) {
    const w = this.game.world;
    if (w.props.length >= 64) {
      this.game.hud.notify('SKIM · 64 PROP CAP');
      return;
    }
    const zone = w.zoneAt(p.z);
    if (this.tool === 'cover') addCover(w, p.x, p.z, 1.4, 1.15, 1.4, zone);
    else if (this.tool === 'light') addLamp(w, p.x, p.z, 0xffb35a, zone, 1.8);
    else if (this.tool === 'vehicle') this.game.vehicles.spawn({ type: 'sedan', x: p.x, z: p.z, yaw: 0, zone });
    else if (this.tool === 'npc') this.game.npcs.spawn({ type: 'street', x: p.x, z: p.z, yaw: 0, wander: true });
    else if (this.tool === 'trigger') {
      const m = boxMesh(1.2, 0.2, 1.2, mat(null, { color: 0x3ee0ff, emissive: 0x3ee0ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.4 }));
      m.position.set(p.x, 0.1, p.z);
      w.add(m, zone);
      w.trigger({ id: `skim-${Date.now()}`, box: { minx: p.x - 0.6, maxx: p.x + 0.6, miny: 0, maxy: 2, minz: p.z - 0.6, maxz: p.z + 0.6 }, kind: 'skim' });
    } else if (this.tool === 'landmark') {
      const m = boxMesh(0.4, 4.2, 0.4, mat(null, { color: 0xff2d6a, emissive: 0xff2d6a, emissiveIntensity: 0.8 }));
      w.solid(m, p.x, 0, p.z, 0.4, 4.2, 0.4, zone);
      w.landmark('CUSTOM', p.clone(), zone);
    }
    w.props.push({ tool: this.tool, x: p.x, z: p.z, zone });
    this.game.hud.notify(`PLACED ${this.tool.toUpperCase()}`);
  }

  save() {
    const data = {
      v: 1,
      props: this.game.world.props,
      path: this.game.world.path.map((p) => [+p.x.toFixed(2), +p.z.toFixed(2)]),
    };
    try { localStorage.setItem('nightwire.map.v1', JSON.stringify(data)); } catch { /* */ }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nightwire-map.json';
    a.click();
    this.game.hud.notify('MAP JSON SAVED');
  }

  update(dt) {
    if (!this.openState) return;
    const inp = this.game.input;
    if (inp.keys.has('KeyA')) this.orbit.px -= 22 * dt;
    if (inp.keys.has('KeyD')) this.orbit.px += 22 * dt;
    if (inp.keys.has('KeyW')) this.orbit.pz -= 22 * dt;
    if (inp.keys.has('KeyS')) this.orbit.pz += 22 * dt;
    if (inp.keys.has('KeyQ')) this.orbit.dist = Math.max(20, this.orbit.dist - 30 * dt);
    if (inp.keys.has('KeyE')) this.orbit.dist = Math.min(160, this.orbit.dist + 30 * dt);
    this.orbit.yaw += dt * 0.05;
    const o = this.orbit;
    this.cam.position.set(
      o.px + Math.sin(o.yaw) * o.dist * 0.15,
      o.dist,
      o.pz + Math.cos(o.yaw) * o.dist * 0.25,
    );
    this.cam.lookAt(o.px, 0, o.pz);
    this.cam.aspect = innerWidth / innerHeight;
    this.cam.updateProjectionMatrix();
    this._heatmap();
  }

  _heatmap() {
    if (this._hmT && this.game.time.elapsed - this._hmT < 0.35) return;
    this._hmT = this.game.time.elapsed;
    const pts = this.game.world.path;
    if (pts.length < 2) return;
    if (this.heatmap) {
      this.game.scene.remove(this.heatmap);
      this.heatmap.geometry.dispose();
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, 0.4, p.z)));
    this.heatmap = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff2d6a, transparent: true, opacity: 0.7 }));
    this.game.scene.add(this.heatmap);
  }

  render() {
    this.game.renderer.render(this.game.scene, this.cam);
  }
}
