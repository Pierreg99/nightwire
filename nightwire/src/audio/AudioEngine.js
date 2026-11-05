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
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setListener(p) { this.listenerPos = p; }

  _env(g, t, a, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  }

  _noise(dur) {
    const n = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
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
    n.connect(f).connect(g).connect(this._panner(pos));
    n.start(t);
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
