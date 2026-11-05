export class TouchControls {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('touch');
    this.stick = document.getElementById('stick-move');
    this.knob = this.stick.querySelector('i');
    this.look = document.getElementById('look-pad');
    this._bindStick();
    this._bindLook();
    this._bindBtns();
  }

  show(on) {
    this.root.classList.toggle('hidden', !on);
    this.game.settings.showTouch = on;
  }

  _bindStick() {
    const st = this.stick;
    const center = () => {
      const r = st.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width / 2 };
    };
    const apply = (cx, cy, e) => {
      const t = e.touches ? e.touches[0] : e;
      let x = (t.clientX - cx.x) / cx.s;
      let y = (t.clientY - cx.y) / cx.s;
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      this.game.input.touchMove.x = x;
      this.game.input.touchMove.y = y;
      this.knob.style.left = `${33 + x * 28}px`;
      this.knob.style.top = `${33 + y * 28}px`;
    };
    const start = (e) => { e.preventDefault(); this._c = center(); apply(this._c, e); };
    const move = (e) => { if (this._c) apply(this._c, e); };
    const end = () => {
      this._c = null;
      this.game.input.touchMove.x = this.game.input.touchMove.y = 0;
      this.knob.style.left = '33px'; this.knob.style.top = '33px';
    };
    st.addEventListener('touchstart', start, { passive: false });
    st.addEventListener('touchmove', move, { passive: false });
    st.addEventListener('touchend', end);
  }

  _bindLook() {
    let last = null;
    const pad = this.look;
    pad.addEventListener('touchstart', (e) => { e.preventDefault(); last = e.touches[0]; }, { passive: false });
    pad.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!last) { last = t; return; }
      const ads = this.game.touchAds ? this.game.settings.adsSens : 1;
      const s = this.game.settings.lookSensTouch * 0.08 * ads;
      const dx = t.clientX - last.clientX;
      const dy = t.clientY - last.clientY;
      const accel = 1 + Math.min(2.2, Math.hypot(dx, dy) * 0.04);
      this.game.input.touchLook.x += dx * s * 0.012 * accel;
      this.game.input.touchLook.y += dy * s * 0.012 * accel;
      last = t;
    }, { passive: false });
    pad.addEventListener('touchend', () => { last = null; });
  }

  _bindBtns() {
    const hold = (id, on, off) => {
      const el = document.getElementById(id);
      el.addEventListener('touchstart', (e) => { e.preventDefault(); on(); }, { passive: false });
      el.addEventListener('touchend', () => off && off());
      el.addEventListener('mousedown', (e) => { e.preventDefault(); on(); });
      el.addEventListener('mouseup', () => off && off());
    };
    hold('t-fire', () => {
      this.game.touchFire = true;
      if (this.game.settings.haptics) navigator.vibrate?.(12);
    }, () => { this.game.touchFire = false; });
    hold('t-ads', () => { this.game.touchAds = true; }, () => { this.game.touchAds = false; });
    hold('t-reload', () => { this.game.touchReload = true; });
    hold('t-jump', () => { this.game.touchJump = true; });
    hold('t-crouch', () => { this.game.player.crouch = !this.game.player.crouch; });
    hold('t-use', () => { this.game.tryInteract(); });
    hold('t-veh', () => { this.game.touchVeh = true; this.game.tryInteract(); });
    hold('t-phone', () => { this.game.phone.toggle(); });
    const tap = (id, fn) => {
      const el = document.getElementById(id);
      let lock = false;
      const go = (e) => {
        e.preventDefault();
        if (lock) return;
        lock = true;
        fn();
        setTimeout(() => { lock = false; }, 280);
      };
      el.addEventListener('touchstart', go, { passive: false });
      el.addEventListener('mousedown', go);
    };
    tap('t-gun', () => {
      if (this.game.mode !== 'play') return;
      this.game.input.weaponStep += 1;
    });
    tap('t-pause', () => {
      if (this.game.mode === 'pause') this.game.pause.close();
      else if (this.game.mode === 'play' || this.game.mode === 'phone') this.game.pause.open();
    });
  }
}
