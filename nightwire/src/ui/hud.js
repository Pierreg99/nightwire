const ZONES = { docks: 'HAFEN', strip: 'NEON-STRIP', hof: 'PLATTENBAU' };

export class HUD {
  constructor(game) {
    this.game = game;
    this.el = {
      hp: document.getElementById('hp-fill'),
      st: document.getElementById('st-fill'),
      wname: document.getElementById('w-name'),
      wammo: document.getElementById('w-ammo'),
      wmode: document.getElementById('w-mode'),
      obj: document.getElementById('objective'),
      heat: document.getElementById('heat'),
      zone: document.getElementById('zone-tag'),
      sub: document.getElementById('subtitles'),
      feed: document.getElementById('killfeed'),
      hm: document.getElementById('hitmarker'),
      hurt: document.getElementById('hurt'),
      ch: document.getElementById('crosshair'),
      notify: document.getElementById('notify'),
      compass: document.getElementById('compass'),
    };
    this.subT = 0;
    this.noteT = 0;
    this.sub = null; // { who, text, shown }
    this.zone = 'docks';
    this._c = {}; // last written values: the DOM is only touched on change
    game.bus.on('notify', (m) => this.notify(m));
  }

  hitmarker(head) {
    this.el.hm.className = head ? 'show head' : 'show';
    setTimeout(() => { this.el.hm.className = ''; }, 180);
  }

  kill(text) {
    const d = document.createElement('div');
    d.textContent = `WIRE  ×  ${text}`;
    this.el.feed.prepend(d);
    setTimeout(() => d.remove(), 3200);
  }

  subtitle(who, text, dur = 4.5) {
    // Typewriter (~48 chars/s); the line stays for dur after it has finished typing.
    const instant = this.game.settings.reducedFx || !this.game.settings.motion;
    this.sub = { who, text, shown: instant ? text.length : 0 };
    this.subT = dur + (instant ? 0 : text.length / 48);
    this._renderSub();
    this.game.audio?.radioTick?.();
  }

  _renderSub() {
    const s = this.sub;
    this.el.sub.textContent = '';
    if (!s) return;
    const b = document.createElement('b');
    b.textContent = s.who;
    this.el.sub.append(b, `  ${s.text.slice(0, Math.floor(s.shown))}`);
    if (s.shown < s.text.length) {
      const c = document.createElement('span');
      c.className = 'cursor';
      c.textContent = '▌';
      this.el.sub.append(c);
    }
  }

  _set(key, value, write) {
    if (this._c[key] === value) return;
    this._c[key] = value;
    write(value);
  }

  notify(text) {
    this.el.notify.textContent = text;
    this.noteT = 2.6;
  }

  update(dt) {
    const g = this.game;
    const el = this.el;
    this._set('hp', Math.round(g.health.hp), (v) => { el.hp.style.width = `${v}%`; });
    this._set('st', Math.round(g.stamina.v), (v) => { el.st.style.width = `${v}%`; });
    this._set('wname', g.weapons.def.name, (v) => { el.wname.textContent = v; });
    const a = g.weapons.mag;
    this._set('ammo', `${a.mag}/${a.reserve}`, () => { el.wammo.innerHTML = `<b>${a.mag}</b><span> / ${a.reserve}</span>`; });
    const fire = g.weapons.def.mode === 'semi' ? ((g.weapons.def.pellets || 1) > 1 ? 'PUMP' : 'SEMI') : 'AUTO';
    const stance = g.weapons.ads ? 'ADS' : g.player.crouch ? 'CROUCH' : g.player.sprint ? 'SPRINT' : 'HIP';
    this._set('wmode', `${stance} · ${fire}`, (v) => { el.wmode.textContent = v; });
    this._set('obj', g.story.objective, (v) => { el.obj.textContent = v; });
    const zone = g.world.zoneAt(g.player.pos.z);
    this.zone = zone;
    this._set('zone', zone, (z) => {
      el.zone.textContent = ZONES[z] || 'DISTRICT';
      el.compass.querySelectorAll('[data-z]').forEach((s) => s.classList.toggle('on', s.dataset.z === z));
    });
    this._set('heat', `${g.heat.level}|${g.settings.colorblind ? 1 : 0}`, () => {
      el.heat.className = `heat${g.settings.colorblind ? ' cb' : ''}`;
      el.heat.innerHTML = [0, 1, 2].map((i) => `<i class="${g.heat.level > i ? 'on' : ''}"></i>`).join('');
    });
    this._set('hurt', g.health.hurt.toFixed(2), (v) => { el.hurt.style.opacity = v; });
    this._set('ads', g.weapons.ads, (v) => el.ch.classList.toggle('ads', v));
    const spread = Math.round(10 + g.weapons.spread * 220);
    this._set('spread', spread, (v) => {
      el.ch.querySelectorAll('.ch.t').forEach((n) => { n.style.bottom = `${v}px`; });
      el.ch.querySelector('.ch.b').style.top = `${v}px`;
      el.ch.querySelector('.ch.l').style.right = `${v}px`;
      el.ch.querySelector('.ch.r').style.left = `${v}px`;
    });
    if (this.sub) {
      if (this.sub.shown < this.sub.text.length) {
        const before = Math.floor(this.sub.shown);
        this.sub.shown = Math.min(this.sub.text.length, this.sub.shown + dt * 48);
        if (Math.floor(this.sub.shown) !== before) this._renderSub();
      }
      this.subT -= dt;
      if (this.subT <= 0) { this.sub = null; el.sub.textContent = ''; }
    }
    if (this.noteT > 0) {
      this.noteT -= dt;
      if (this.noteT <= 0) el.notify.textContent = '';
    }
    this._set('hudScale', g.settings.hudScale, (v) => document.documentElement.style.setProperty('--hud', String(v)));
  }
}
