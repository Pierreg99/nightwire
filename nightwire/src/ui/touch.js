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
    document.body.classList.toggle('touch-on', !!on);
    this.game.settings.showTouch = on;
    if (!on) this.releaseAll();
  }

  // Every finger is tracked by Touch.identifier. e.touches[0] would pick up whichever finger
  // touched the screen first, so holding the stick while looking used to steer with the wrong finger.
  _bindStick() {
    const st = this.stick;
    let id = null;
    let c = null;
    const find = (list) => {
      for (const t of list) if (t.identifier === id) return t;
      return null;
    };
    const apply = (t) => {
      let x = (t.clientX - c.x) / c.s;
      let y = (t.clientY - c.y) / c.s;
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      this.game.input.touchMove.x = x;
      this.game.input.touchMove.y = y;
      this.game.input.touchMove.active = true;
      this.knob.style.transform = `translate(${x * 28}px, ${y * 28}px)`;
    };
    const reset = () => {
      id = null;
      c = null;
      this.game.input.touchMove.x = this.game.input.touchMove.y = 0;
      this.game.input.touchMove.active = false;
      this.knob.style.transform = '';
    };
    st.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (id !== null) return;
      const t = e.changedTouches[0];
      const r = st.getBoundingClientRect();
      c = { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width / 2 };
      id = t.identifier;
      apply(t);
    }, { passive: false });
    st.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = find(e.changedTouches);
      if (t && c) apply(t);
    }, { passive: false });
    const end = (e) => { if (find(e.changedTouches)) reset(); };
    st.addEventListener('touchend', end);
    st.addEventListener('touchcancel', end);
    this._resetStick = reset;
  }

  _bindLook() {
    const pad = this.look;
    let id = null;
    let last = null;
    const find = (list) => {
      for (const t of list) if (t.identifier === id) return t;
      return null;
    };
    pad.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (id !== null) return;
      const t = e.changedTouches[0];
      id = t.identifier;
      last = { x: t.clientX, y: t.clientY };
    }, { passive: false });
    pad.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = find(e.changedTouches);
      if (!t || !last) return;
      const ads = this.game.touchAds ? this.game.settings.adsSens : 1;
      const s = this.game.settings.lookSensTouch * 0.08 * ads;
      const dx = t.clientX - last.x;
      const dy = t.clientY - last.y;
      const accel = 1 + Math.min(2.2, Math.hypot(dx, dy) * 0.04);
      this.game.input.touchLook.x += dx * s * 0.012 * accel;
      this.game.input.touchLook.y += dy * s * 0.012 * accel;
      last = { x: t.clientX, y: t.clientY };
    }, { passive: false });
    const end = (e) => {
      if (!find(e.changedTouches)) return;
      id = null;
      last = null;
    };
    pad.addEventListener('touchend', end);
    pad.addEventListener('touchcancel', end);
  }

  /** App went to background or a menu opened: drop every held input so nothing sticks. */
  releaseAll() {
    this._resetStick?.();
    this.game.touchFire = false;
    this.game.touchAds = false;
  }

  _bindBtns() {
    const hold = (id, on, off) => {
      const el = document.getElementById(id);
      el.addEventListener('touchstart', (e) => { e.preventDefault(); on(); }, { passive: false });
      el.addEventListener('touchend', () => off && off());
      el.addEventListener('touchcancel', () => off && off());
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
