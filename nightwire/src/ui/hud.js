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
    this.el.sub.innerHTML = `<b>${who}</b>  ${text}`;
    this.subT = dur;
  }

  notify(text) {
    this.el.notify.textContent = text;
    this.noteT = 2.6;
  }

  update(dt) {
    const g = this.game;
    this.el.hp.style.width = `${g.health.hp}%`;
    this.el.st.style.width = `${g.stamina.v}%`;
    this.el.wname.textContent = g.weapons.def.name;
    const a = g.weapons.mag;
    this.el.wammo.innerHTML = `<b>${a.mag}</b><span> / ${a.reserve}</span>`;
    const fire = g.weapons.def.mode === 'semi' ? ((g.weapons.def.pellets || 1) > 1 ? 'PUMP' : 'SEMI') : 'AUTO';
    const stance = g.weapons.ads ? 'ADS' : g.player.crouch ? 'CROUCH' : g.player.sprint ? 'SPRINT' : 'HIP';
    this.el.wmode.textContent = `${stance} · ${fire}`;
    this.el.obj.textContent = g.story.objective;
    const zone = g.world.zoneAt(g.player.pos.z);
    this.el.zone.textContent = ZONES[zone] || 'DISTRICT';
    this.el.compass.querySelectorAll('[data-z]').forEach((s) => {
      s.classList.toggle('on', s.dataset.z === zone);
    });
    this.el.heat.className = `heat${g.settings.colorblind ? ' cb' : ''}`;
    this.el.heat.innerHTML = [0, 1, 2].map((i) => `<i class="${g.heat.level > i ? 'on' : ''}"></i>`).join('');
    this.el.hurt.style.opacity = String(g.health.hurt);
    this.el.ch.classList.toggle('ads', g.weapons.ads);
    const spread = 10 + g.weapons.spread * 220;
    this.el.ch.querySelectorAll('.ch.t').forEach((n) => { n.style.bottom = `${spread}px`; });
    this.el.ch.querySelector('.ch.b').style.top = `${spread}px`;
    this.el.ch.querySelector('.ch.l').style.right = `${spread}px`;
    this.el.ch.querySelector('.ch.r').style.left = `${spread}px`;
    this.subT -= dt;
    if (this.subT <= 0) this.el.sub.textContent = '';
    this.noteT -= dt;
    if (this.noteT <= 0) this.el.notify.textContent = '';
    document.documentElement.style.setProperty('--hud', String(g.settings.hudScale));
  }
}
