/**
 * NIGHTWIRE — Story presentation (.mjs)
 * Presentation only; the beats stay in story/Campaign.js.
 *  - Jack-in: letterbox + location card (COLD CARGO · HAFEN · NEO-DUISBURG · 23:41 · REGEN).
 *  - Objective changes: a short flash on the objective line and a soft ping.
 *  - Zone entry: small zone card (HAFEN / NEON-STRIP / PLATTENBAU) with the district line.
 * Reduced FX / motion off: no bars animation, cards still show (they carry information).
 */

const ZONE_CARDS = {
  docks: ['HAFEN', 'Container, Kräne, Rhein. Warehouse 09.'],
  strip: ['NEON-STRIP', 'Clubs, Kiosk, Security-Wagen.'],
  hof: ['PLATTENBAU', 'Hinterhof, Wohnung 4B.'],
};

export class StoryPresenter {
  constructor(game) {
    this.game = game;
    this.root = document.createElement('div');
    this.root.id = 'cine';
    this.root.innerHTML = `
      <div class="cine-bar top"></div><div class="cine-bar bottom"></div>
      <div class="cine-card"><div class="cine-kicker"></div><div class="cine-title"></div><div class="cine-sub"></div></div>`;
    // Right after the HUD in DOM order: above the HUD, below phone / pause / endcard.
    const hud = document.getElementById('hud');
    if (hud) hud.after(this.root);
    else document.body.appendChild(this.root);
    this.card = this.root.querySelector('.cine-card');
    this.lastObjective = null;
    this.lastZone = null;
    this.cardT = 0;
    this.barsT = 0;
    this.started = false;
  }

  intro() {
    this.started = true;
    this.root.classList.add('bars');
    this.barsT = 4.2;
    this._card('COLD CARGO', 'HAFEN · NEO-DUISBURG', '23:41 · REGEN · HANDLER KITE', 4.4);
    this.lastZone = this.game.world.zoneAt(this.game.player.pos.z);
  }

  _card(kicker, title, sub, dur) {
    this.card.querySelector('.cine-kicker').textContent = kicker;
    this.card.querySelector('.cine-title').textContent = title;
    this.card.querySelector('.cine-sub').textContent = sub;
    this.card.classList.remove('show');
    void this.card.offsetWidth; // restart the CSS transition
    this.card.classList.add('show');
    this.cardT = dur;
  }

  update(dt) {
    const g = this.game;
    if (this.barsT > 0) {
      this.barsT -= dt;
      if (this.barsT <= 0) this.root.classList.remove('bars');
    }
    if (this.cardT > 0) {
      this.cardT -= dt;
      if (this.cardT <= 0) this.card.classList.remove('show');
    }
    if (!this.started || g.mode !== 'play') return;

    const obj = g.story.objective;
    if (obj !== this.lastObjective) {
      if (this.lastObjective !== null) {
        const el = document.getElementById('objective');
        el?.classList.remove('flash');
        void el?.offsetWidth;
        el?.classList.add('flash');
        g.audio?.objective?.();
      }
      this.lastObjective = obj;
    }
    const zone = g.world.zoneAt(g.player.pos.z);
    if (zone !== this.lastZone) {
      this.lastZone = zone;
      const c = ZONE_CARDS[zone];
      if (c && this.barsT <= 0) this._card('DISTRIKT', c[0], c[1], 2.6);
    }
  }
}
