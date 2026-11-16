import { lockPointer, unlockPointer } from '../core/Input.js';

export class Phone {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('phone');
    this.home = document.getElementById('phone-home');
    this.app = document.getElementById('phone-app');
    this.back = document.getElementById('phone-back');
    this.clock = document.getElementById('phone-clock');
    this.openState = false;
    this.unread = true;
    this.home.querySelectorAll('button[data-app]').forEach((b) => {
      b.onclick = () => this.showApp(b.dataset.app);
    });
    this.back.onclick = () => this.showHome();
  }

  toggle() {
    if (this.openState) this.close();
    else this.open();
  }

  open() {
    this.openState = true;
    this.game.mode = 'phone';
    this.game.input.blocked = true;
    unlockPointer();
    this.el.classList.remove('hidden');
    document.body.classList.add('phone-open');
    this.game.touch?.releaseAll();
    this.showHome();
    this.game.audio?.ui();
  }

  close() {
    this.openState = false;
    this.el.classList.add('hidden');
    document.body.classList.remove('phone-open');
    this.game.skinEditor.closePreview();
    if (this.game.mode === 'phone') {
      this.game.mode = 'play';
      this.game.input.blocked = false;
      lockPointer(this.game.canvas);
    }
  }

  showHome() {
    this.home.classList.remove('hidden');
    this.app.classList.add('hidden');
    this.back.classList.add('hidden');
    this.game.skinEditor.closePreview();
  }

  showApp(name) {
    this.home.classList.add('hidden');
    this.app.classList.remove('hidden');
    this.back.classList.remove('hidden');
    this.game.audio?.ui();
    const g = this.game;
    if (name === 'jobs') {
      this.app.innerHTML = `<h3>JOBS</h3>
        <div class="job-card"><b>COLD CARGO · INTERCEPT</b><p>Warehouse 09. VIP package. KITE says don't work clean.</p>
        <button id="job-accept">ACCEPT / TRACK</button></div>`;
      this.app.querySelector('#job-accept').onclick = () => { g.story.accept(); this.close(); };
    } else if (name === 'map') {
      this.app.innerHTML = `<h3>DISTRICT</h3>
        <p>Hafen · Neon-Strip · Plattenbau Hof</p>
        <p>Blips: WH-09 · RHEINLICHT · BLOCK 17 · BOAT · 4B</p>
        <div class="map-legend">You: ${g.world.zoneAt(g.player.pos.z)}</div>
        <button id="open-skim">OPEN SKIM EDITOR</button>`;
      this.app.querySelector('#open-skim').onclick = () => { this.close(); g.skim.open(); };
    } else if (name === 'wardrobe') {
      g.skinEditor.mount(this.app);
    } else if (name === 'radio') {
      this.app.innerHTML = `<h3>RADIO</h3>
        <p>Station: ${g.audio.station === 0 ? 'DARK SYNTH FM' : 'LATE NIGHT TALK'}</p>
        <button id="r0">DARK SYNTH FM</button>
        <button id="r1">LATE NIGHT TALK</button>
        <button id="r2">${g.audio.radioOn ? 'MUTE' : 'UNMUTE'}</button>`;
      this.app.querySelector('#r0').onclick = () => { g.audio.setStation(0); this.showApp('radio'); };
      this.app.querySelector('#r1').onclick = () => { g.audio.setStation(1); this.showApp('radio'); };
      this.app.querySelector('#r2').onclick = () => { g.audio.toggleRadio(); this.showApp('radio'); };
    } else if (name === 'messages') {
      this.unread = false;
      this.app.innerHTML = `<h3>MESSAGES</h3>
        <div class="msg kite-row"><img src="/assets/tex/kite.jpg" alt="KITE" class="kite-pic" /><div><b>KITE</b><p>Wire. Package is sitting in Warehouse 09. Crew inside. Don't work clean.</p></div></div>
        <div class="msg"><b>KITE</b><p>Extract is your call: Wohnung 4B or the dock boat. I only care that it leaves the district.</p></div>`;
    } else if (name === 'settings') {
      this.app.innerHTML = `<h3>SETTINGS</h3><p>Full settings live in Pause (ESC).</p><button id="to-pause">OPEN PAUSE</button>`;
      this.app.querySelector('#to-pause').onclick = () => { this.close(); g.pause.open(); };
    }
  }

  // In-world clock: the night starts at 23:41 (the jack-in card) and runs in real minutes.
  update() {
    const g = this.game;
    if (g.mode === 'title') return;
    if (this._jackT == null) this._jackT = g.time.elapsed;
    const m = (23 * 60 + 41 + Math.floor((g.time.elapsed - this._jackT) / 60)) % 1440;
    const text = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    if (text !== this._clock) { this._clock = text; this.clock.textContent = text; }
  }

  buzz(text) {
    this.game.audio?.phone();
    this.game.hud.notify(text);
    this.unread = true;
  }
}
