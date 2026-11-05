import { moveFromStick, lookFromStick } from './padmap.js';

const PAD_EDGES = [
  [0, 'Space'],
  [1, 'KeyC'],
  [2, 'KeyR'],
  [3, 'GamepadY'],
  [4, 'PadPrev'],
  [5, 'PadNext'],
  [8, 'GamepadBack'],
  [9, 'GamepadStart'],
  [11, 'KeyV'],
  [14, 'PadPrev'],
  [15, 'PadNext'],
];

export class Input {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.keys = new Set();
    this.down = new Set();
    this.dx = 0;
    this.dy = 0;
    this.wheel = 0;
    this.fire = false;
    this.ads = false;
    this.locked = false;
    this.blocked = false;
    this.touchMove = { x: 0, y: 0, active: false };
    this.touchLook = { x: 0, y: 0 };
    this.gyro = { x: 0, y: 0 };
    this.padMove = { x: 0, y: 0 };
    this.padLook = { x: 0, y: 0 };
    this.padFire = false;
    this.padAds = false;
    this.padSprint = false;
    this.weaponStep = 0;
    this._gpPrev = {};
    this._bind();
  }

  _bind() {
    const on = (t, fn, el = window) => el.addEventListener(t, fn, { passive: false });
    on('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.down.add(e.code);
      if (['Tab', 'Space', 'KeyI'].includes(e.code)) e.preventDefault();
    });
    on('keyup', (e) => this.keys.delete(e.code));
    on('blur', () => { this.keys.clear(); this.fire = false; });
    on('mousemove', (e) => {
      if (!this.locked || this.blocked) return;
      const s = this.ads ? this.settings.adsSens : this.settings.sens;
      this.dx += e.movementX * 0.022 * s;
      this.dy += e.movementY * 0.022 * s;
    });
    on('mousedown', (e) => {
      if (e.button === 0) this.fire = true;
      if (e.button === 2) this.ads = true;
    });
    on('mouseup', (e) => {
      if (e.button === 0) this.fire = false;
      if (e.button === 2) this.ads = false;
    });
    on('contextmenu', (e) => e.preventDefault());
    on('wheel', (e) => { this.wheel += Math.sign(e.deltaY); });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
    });
  }

  poll(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = null;
    for (const p of pads) {
      if (p && p.connected) { pad = p; break; }
    }
    this.padMove.x = this.padMove.y = 0;
    this.padLook.x = this.padLook.y = 0;
    this.padFire = false;
    this.padAds = false;
    this.padSprint = false;
    if (!pad) return;
    const btn = (i) => {
      const b = pad.buttons[i];
      return !!(b && (b.pressed || b.value > 0.45));
    };
    for (const [i, code] of PAD_EDGES) {
      const down = btn(i);
      const allow = code === 'GamepadStart' || code === 'Space' || !this.blocked;
      if (allow && down && !this._gpPrev[i]) {
        if (code === 'PadNext') this.weaponStep += 1;
        else if (code === 'PadPrev') this.weaponStep -= 1;
        else this.down.add(code);
      }
      this._gpPrev[i] = down;
    }
    if (this.blocked) return;
    this.padFire = btn(7);
    this.padAds = btn(6);
    this.padSprint = btn(10);
    const move = moveFromStick(pad.axes[0] || 0, pad.axes[1] || 0);
    this.padMove.x = move.x;
    this.padMove.y = move.z;
    const sens = (this.ads || this.padAds ? this.settings.adsSens : this.settings.sens) * (this.settings.padSens || 2.2);
    const look = lookFromStick(pad.axes[2] || 0, pad.axes[3] || 0, sens, dt);
    this.padLook.x = look.x;
    this.padLook.y = look.y;
  }

  consumeLook() {
    const x = this.dx + this.touchLook.x + this.gyro.x + this.padLook.x;
    const y = this.dy + this.touchLook.y + this.gyro.y + this.padLook.y;
    this.dx = this.dy = 0;
    this.touchLook.x = this.touchLook.y = 0;
    this.gyro.x = this.gyro.y = 0;
    this.padLook.x = this.padLook.y = 0;
    return { x, y };
  }

  pressed(code) {
    if (this.down.has(code)) {
      this.down.delete(code);
      return true;
    }
    return false;
  }

  flushPresses() { this.down.clear(); this.wheel = 0; }

  axis() {
    let x = 0, z = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    x += this.touchMove.x + this.padMove.x;
    z += this.touchMove.y + this.padMove.y;
    const m = Math.hypot(x, z);
    if (m > 1) { x /= m; z /= m; }
    return { x, z, mag: Math.min(1, m) };
  }
}
