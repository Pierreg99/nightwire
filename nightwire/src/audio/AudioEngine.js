export class AudioEngine {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.amb = null;
    this.radio = null;
    this.radioOn = true;
    this.station = 0;
    this._radioNodes = [];
    this.listenerPos = { x: 0, y: 0, z: 0 };
    this._noiseCache = new Map();
    this.ambLevel = 1;
    this.layers = null;
  }

  resume() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.game.settings.volume;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      this.amb = this.ctx.createGain(); this.amb.gain.value = 0.28; this.amb.connect(this.master);
      this.radio = this.ctx.createGain(); this.radio.gain.value = this.game.settings.radioVol; this.radio.connect(this.master);
      this._rain();
      this._radio();
      this._ambience();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setListener(p) { this.listenerPos = p; }

  _env(g, t, a, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  }

  // One buffer per length, shared by every source: a gun burst no longer allocates and fills
  // a fresh AudioBuffer per shot (GC hitches on phones during full-auto).
  _noise(dur, brown = false) {
    const key = `${dur}|${brown ? 1 : 0}`;
    let n = this._noiseCache.get(key);
    if (n) return n;
    n = this.ctx.createBuffer(1, Math.max(1, Math.floor(this.ctx.sampleRate * dur)), this.ctx.sampleRate);
    const d = n.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    this._noiseCache.set(key, n);
    return n;
  }

  _panner(pos, parent) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 4;
    p.maxDistance = 60;
    p.setPosition(pos.x, pos.y, pos.z);
    const l = this.listenerPos;
    this.ctx.listener.setPosition?.(l.x, l.y, l.z);
    p.connect(parent || this.sfx);
    return p;
  }

  gun(type, pos, vol = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    const freq = { pistol: 140, rifle: 90, smg: 110, shotgun: 58, dmr: 96 }[type] || 110;
    const decay = type === 'shotgun' ? 0.2 : type === 'dmr' ? 0.07 : type === 'pistol' ? 0.12 : 0.09;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(type === 'shotgun' ? 32 : 40, t + decay);
    this._env(g, t, (type === 'shotgun' ? 0.34 : 0.22) * vol, decay);
    const n = this.ctx.createBufferSource();
    n.buffer = this._noise(0.12);
    const ng = this.ctx.createGain();
    this._env(ng, t, (type === 'shotgun' ? 0.46 : type === 'dmr' ? 0.18 : 0.28) * vol, type === 'shotgun' ? 0.16 : 0.08);
    const pan = this._panner(pos);
    o.connect(g).connect(pan);
    n.connect(ng).connect(pan);
    o.start(t); o.stop(t + 0.14);
    n.start(t);
  }

  impact(flesh, pos) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource();
    n.buffer = this._noise(0.1);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = flesh ? 900 : 400;
    const g = this.ctx.createGain();
    this._env(g, t, flesh ? 0.22 : 0.16, 0.1);
    n.connect(f).connect(g).connect(this._panner(pos));
    n.start(t);
  }

  foot(pos, vol = 0.7) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource();
    n.buffer = this._noise(0.08);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 500;
    const g = this.ctx.createGain();
    this._env(g, t, 0.12 * vol, 0.07);
    const pan = this._panner(pos);
    n.connect(f).connect(g).connect(pan);
    n.start(t);
    // Wet street: a short high splash on top of the thud, a little different every step.
    const w = this.ctx.createBufferSource();
    w.buffer = this._noise(0.08);
    w.playbackRate.value = 0.85 + Math.random() * 0.3;
    const wf = this.ctx.createBiquadFilter();
    wf.type = 'bandpass'; wf.frequency.value = 2600 + Math.random() * 1600; wf.Q.value = 0.9;
    const wg = this.ctx.createGain();
    this._env(wg, t + 0.012, 0.05 * vol, 0.06);
    w.connect(wf).connect(wg).connect(pan);
    w.start(t, Math.random() * 0.02);
  }

  objective() { this._blip(740, 0.05, 0.12); setTimeout(() => this._blip(988, 0.045, 0.18), 120); }

  /** Handler line: a burst of radio static before the words. */
  radioTick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource();
    n.buffer = this._noise(0.25);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 1.8;
    const g = this.ctx.createGain();
    this._env(g, t, 0.06, 0.22);
    n.connect(f).connect(g).connect(this.sfx);
    n.start(t);
  }

  /*
   * Zone ambience: three quiet layers under the rain, crossfaded by the zone the player is in.
   *  docks — brown-noise water against the quay, a foghorn now and then
   *  strip — club kick through the walls + 100 Hz neon hum
   *  hof   — wind between the blocks, gutter drips
   * Overall level from profile.ambience (MOBILE 0.7).
   */
  _ambience() {
    const c = this.ctx;
    const mk = () => { const g = c.createGain(); g.gain.value = 0; g.connect(this.amb); return g; };
    this.layers = { docks: mk(), strip: mk(), hof: mk() };

    const water = c.createBufferSource();
    water.buffer = this._noise(4, true); water.loop = true;
    const wf = c.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 420;
    const wl = c.createGain(); wl.gain.value = 0.9;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.13;
    const lfoG = c.createGain(); lfoG.gain.value = 0.35;
    lfo.connect(lfoG).connect(wl.gain);
    water.connect(wf).connect(wl).connect(this.layers.docks);
    water.start(); lfo.start();

    const humG = c.createGain(); humG.gain.value = 0.035;
    [100, 200, 300].forEach((f, i) => {
      const o = c.createOscillator(); o.frequency.value = f; o.type = 'sine';
      const g = c.createGain(); g.gain.value = [1, 0.45, 0.18][i];
      o.connect(g).connect(humG); o.start();
    });
    humG.connect(this.layers.strip);
    this.kickBus = c.createBiquadFilter();
    this.kickBus.type = 'lowpass'; this.kickBus.frequency.value = 140;
    this.kickBus.connect(this.layers.strip);
    this.nextKick = c.currentTime + 0.1;

    const wind = c.createBufferSource();
    wind.buffer = this._noise(3); wind.loop = true;
    const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 420; bf.Q.value = 0.7;
    const wlfo = c.createOscillator(); wlfo.frequency.value = 0.07;
    const wlfoG = c.createGain(); wlfoG.gain.value = 180;
    wlfo.connect(wlfoG).connect(bf.frequency);
    const wg = c.createGain(); wg.gain.value = 0.35;
    wind.connect(bf).connect(wg).connect(this.layers.hof);
    wind.start(); wlfo.start();

    this.hornT = 6 + Math.random() * 10;
    this.dripT = 1;
  }

  setAmbienceLevel(v) {
    this.ambLevel = v;
  }

  updateAmbience(dt, zone) {
    if (!this.ctx || !this.layers || this.ctx.state !== 'running') return;
    const c = this.ctx;
    const t = c.currentTime;
    const lvl = this.ambLevel;
    const target = { docks: 0.5, strip: 0.55, hof: 0.6 };
    for (const k of Object.keys(this.layers)) {
      this.layers[k].gain.setTargetAtTime(k === zone ? target[k] * lvl : 0, t, 1.2);
    }
    if (zone === 'strip') {
      // 124 BPM four-on-the-floor, scheduled slightly ahead so frame hitches do not drift it.
      if (this.nextKick < t) this.nextKick = t + 0.05;
      while (this.nextKick < t + 0.25) {
        const k = this.nextKick;
        const o = c.createOscillator();
        o.frequency.setValueAtTime(120, k);
        o.frequency.exponentialRampToValueAtTime(45, k + 0.12);
        const g = c.createGain();
        this._env(g, k, 0.5, 0.22);
        o.connect(g).connect(this.kickBus);
        o.start(k); o.stop(k + 0.25);
        this.nextKick += 60 / 124;
      }
    }
    if (zone === 'docks') {
      this.hornT -= dt;
      if (this.hornT <= 0) {
        this.hornT = 28 + Math.random() * 30;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16 * lvl, t + 0.6);
        g.gain.setValueAtTime(0.16 * lvl, t + 2.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
        [65, 65.6, 98].forEach((fr) => {
          const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr;
          o.connect(f); o.start(t); o.stop(t + 3.7);
        });
        f.connect(g).connect(this.amb);
      }
    }
    if (zone === 'hof') {
      this.dripT -= dt;
      if (this.dripT <= 0) {
        this.dripT = 0.4 + Math.random() * 1.6;
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(1400 + Math.random() * 900, t);
        o.frequency.exponentialRampToValueAtTime(500, t + 0.05);
        const g = c.createGain();
        this._env(g, t, 0.025 * lvl, 0.06);
        o.connect(g).connect(this.layers.hof);
        o.start(t); o.stop(t + 0.08);
      }
    }
  }

  reload() { this._blip(180, 0.08, 0.12); setTimeout(() => this._blip(140, 0.06, 0.1), 220); }
  dry() { this._blip(90, 0.05, 0.06); }
  melee() { this._blip(70, 0.08, 0.12); }
  hurt() { this._blip(50, 0.2, 0.18); }
  kill() { this._blip(420, 0.05, 0.08); }
  door() { this._blip(100, 0.1, 0.1); }
  ui() { this._blip(620, 0.04, 0.05); }
  horn() { this._blip(220, 0.35, 0.4); }
  heat() { this._blip(300, 0.12, 0.2); }
  phone() { this._blip(880, 0.06, 0.1); setTimeout(() => this._blip(660, 0.06, 0.1), 160); }

  _blip(freq, vol, dur) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    this._env(g, t, vol, dur);
    o.connect(g).connect(this.sfx);
    o.start(t); o.stop(t + dur + 0.02);
  }

  _rain() {
    const n = this.ctx.createBufferSource();
    n.buffer = this._noise(2);
    n.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 800;
    const g = this.ctx.createGain();
    g.gain.value = 0.22;
    n.connect(f).connect(g).connect(this.amb);
    n.start();
  }

  _radio() {
    this._stopRadio();
    if (!this.radioOn) return;
    if (this.station === 0) this._synthStation();
    else this._talkStation();
  }

  _stopRadio() {
    this._radioNodes.forEach((n) => { try { n.stop?.(); n.disconnect?.(); } catch { /* */ } });
    this._radioNodes = [];
  }

  setStation(i) {
    this.station = i % 2;
    this.radioOn = true;
    if (this.ctx) this._radio();
  }

  toggleRadio() {
    this.radioOn = !this.radioOn;
    if (this.ctx) this._radio();
  }

  _synthStation() {
    const notes = [110, 130.8, 146.8, 164.8];
    notes.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.04;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 600 + i * 80;
      o.connect(filt).connect(g).connect(this.radio);
      o.start();
      this._radioNodes.push(o, g, filt);
    });
  }

  _talkStation() {
    const n = this.ctx.createBufferSource();
    n.buffer = this._noise(1.4);
    n.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2.5;
    const g = this.ctx.createGain();
    g.gain.value = 0.08;
    n.connect(f).connect(g).connect(this.radio);
    n.start();
    const beep = this.ctx.createOscillator();
    beep.frequency.value = 440;
    const bg = this.ctx.createGain();
    bg.gain.value = 0.02;
    beep.connect(bg).connect(this.radio);
    beep.start();
    this._radioNodes.push(n, beep, f, g, bg);
  }

  radioLine() {
    this._blip(180, 0.08, 0.3);
  }
}
